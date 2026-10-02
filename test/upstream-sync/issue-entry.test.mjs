import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const prompt = readFileSync(".pi/prompts/upstream-sync.md", "utf8");
const target = "a".repeat(40);
const targetLine = `Upstream target: gotgenes/pi-packages@${target}`;
const url = (number) =>
  `https://github.com/Jopqior/gotgenes-pi-packages/issues/${number}`;
const issue = (number, body = targetLine, state = "open") => ({
  number,
  body,
  state,
  html_url: url(number),
});
const directories = [];

afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

// The fake transport returns REST pages, not pre-filtered matches: the actual
// prompt's matcher decides exact lines, PRs, null bodies and line endings.
function runEntry(scenario = {}, mode = "lookup") {
  const directory = mkdtempSync(path.join(os.tmpdir(), "sync-entry-"));
  directories.push(directory);
  const log = path.join(directory, "calls.jsonl");
  const body = path.join(directory, "body.md");
  writeFileSync(body, scenario.body ?? `${targetLine}\n`);
  writeFileSync(
    path.join(directory, "scenario.json"),
    JSON.stringify(scenario),
  );
  const fake = path.join(directory, "gh");
  writeFileSync(
    fake,
    `#!${process.execPath}
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
const scenario = JSON.parse(readFileSync(process.env.SCENARIO, 'utf8'));
appendFileSync(process.env.CALLS, JSON.stringify(args) + '\\n');
if (args[0] === 'repo') {
  if (scenario.repoFailure) process.exit(1);
  console.log(scenario.repository ?? 'Jopqior/gotgenes-pi-packages');
} else if (args[0] === 'api' && args.some(x => x.endsWith('/commits/main'))) {
  if (scenario.targetFailure) process.exit(1);
  console.log(scenario.target ?? '${target}');
} else if (args[0] === 'api' && args.some(x => x.includes('/issues?'))) {
  let count = 0;
  try { count = Number(readFileSync(process.env.COUNTER, 'utf8')); } catch {}
  writeFileSync(process.env.COUNTER, String(count + 1));
  const response = (scenario.responses ?? [{ pages: [[]] }])[count] ?? { pages: [[]] };
  let pages = response.pages ?? [[]];
  if (!args.includes('--paginate')) pages = pages.slice(0, 1);
  if (!args.some(x => x.includes('state=all'))) pages = pages.map(p => p.filter(x => x.state === 'open'));
  console.log(JSON.stringify(args.includes('--slurp') ? pages : pages[0]));
  if (response.failure) process.exit(1);
} else if (args[0] === 'issue' && args[1] === 'create') {
  const bodyFile = args[args.indexOf('--body-file') + 1];
  writeFileSync(process.env.CREATED_BODY, readFileSync(bodyFile));
  if (scenario.createFailure) process.exit(1);
  console.log(scenario.createdUrl ?? '${url(57)}');
} else { console.error('Forbidden command: ' + args.join(' ')); process.exit(99); }
`,
  );
  chmodSync(fake, 0o755);
  const match = /<!-- issue-entry -->\n+```bash\n([\s\S]*?)\n```/.exec(prompt);
  expect(match, "actual executable issue-entry fence").not.toBeNull();
  const result = spawnSync("bash", ["-c", match[1]], {
    cwd: directory,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${directory}:${process.env.PATH}`,
      ENTRY_MODE: mode,
      TARGET: scenario.target ?? target,
      ISSUE_BODY_FILE: body,
      SCENARIO: path.join(directory, "scenario.json"),
      CALLS: log,
      COUNTER: path.join(directory, "counter"),
      CREATED_BODY: path.join(directory, "created.md"),
    },
  });
  const calls = readFileSync(log, "utf8").trim().split("\n").map(JSON.parse);
  return {
    ...result,
    calls,
    creates: calls.filter((c) => c[0] === "issue"),
    createdBody: calls.some((c) => c[0] === "issue")
      ? readFileSync(path.join(directory, "created.md"), "utf8")
      : null,
  };
}

const lookup = (pages) => runEntry({ responses: [{ pages }] });

describe("upstream synchronization issue entry", () => {
  describe("exact target lookup", () => {
    it.each(["open", "closed"])(
      "returns an exact %s match without mutation",
      (state) => {
        const result = lookup([[issue(41, targetLine, state)]]);
        expect(result.status).toBe(0);
        expect(JSON.parse(result.stdout).matches).toEqual([
          { number: 41, state, html_url: url(41) },
        ]);
        expect(result.creates).toEqual([]);
      },
    );
    it("finds a match on a later page", () => {
      expect(
        JSON.parse(lookup([[issue(1, "unrelated")], [issue(42)]]).stdout)
          .matches,
      ).toEqual([{ number: 42, state: "open", html_url: url(42) }]);
    });
    it("rejects near matches, short and prefix SHAs, null bodies and other targets", () => {
      const result = lookup([
        [
          issue(1, `prefix ${targetLine}`),
          issue(2, `${targetLine} extra`),
          issue(3, targetLine.slice(0, -1)),
          issue(4, null),
          issue(5, targetLine.replace(target, "b".repeat(40))),
        ],
      ]);
      expect(JSON.parse(result.stdout).matches).toEqual([]);
    });
    it("excludes pull requests", () => {
      expect(
        JSON.parse(lookup([[{ ...issue(44), pull_request: {} }]]).stdout)
          .matches,
      ).toEqual([]);
    });
    it("normalizes CRLF lines", () => {
      expect(
        JSON.parse(
          lookup([[issue(45, `intro\r\n${targetLine}\r\nend`)]]).stdout,
        ).matches,
      ).toEqual([{ number: 45, state: "open", html_url: url(45) }]);
    });
    it("reports multiple matches without selecting or creating another", () => {
      const result = lookup([[issue(46), issue(47, targetLine, "closed")]]);
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout).matches).toHaveLength(2);
      expect(result.creates).toEqual([]);
    });
  });
  describe("fail closed", () => {
    it.each([
      "short",
      "A".repeat(40),
      `${target}; touch unsafe`,
      "b".repeat(64),
    ])("rejects malformed target %s", (value) => {
      const result = runEntry({ target: value });
      expect(result.status).not.toBe(0);
      expect(result.creates).toEqual([]);
      expect(
        result.calls.some((c) => c.some((x) => x.includes("/issues?"))),
      ).toBe(false);
    });
    it.each([
      { repoFailure: true },
      { repository: "gotgenes/pi-packages" },
      { targetFailure: true },
    ])("stops on identity or target query failure %j", (scenario) => {
      const result = runEntry(scenario);
      expect(result.status).not.toBe(0);
      expect(result.creates).toEqual([]);
    });
    it("does not interpret partial failed pagination as no match", () => {
      const result = runEntry(
        { responses: [{ pages: [[]], failure: true }] },
        "create",
      );
      expect(result.status).not.toBe(0);
      expect(result.creates).toEqual([]);
    });
  });
  describe("final create boundary", () => {
    it("rechecks an exact closed match immediately before creation", () => {
      const result = runEntry(
        { responses: [{ pages: [[issue(48, targetLine, "closed")]] }] },
        "create",
      );
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout).matches).toEqual([
        { number: 48, state: "closed", html_url: url(48) },
      ]);
      expect(result.creates).toEqual([]);
    });
    it("creates only in the fork with repo scope and exact body, then stops", () => {
      const result = runEntry({}, "create");
      expect(result.status).toBe(0);
      const create = result.creates[0];
      expect(create.slice(0, 8)).toEqual([
        "issue",
        "create",
        "--repo",
        "Jopqior/gotgenes-pi-packages",
        "--label",
        "scope:repo",
        "--title",
        `Sync gotgenes/pi-packages@${target}`,
      ]);
      expect(create[8]).toBe("--body-file");
      expect(result.createdBody).toBe(`${targetLine}\n`);
      expect(result.stdout).toBe(`${url(57)}\n/plan-issue 57\n`);
      expect(result.calls.at(-1)).toEqual(create);
      expect(result.stderr).toBe("");
    });
    it("rejects a body with a different target before creation", () => {
      const result = runEntry({ body: "another target\n" }, "create");
      expect(result.status).not.toBe(0);
      expect(result.creates).toEqual([]);
    });
    it("queries after an ambiguous create failure and never retries", () => {
      const result = runEntry(
        {
          createFailure: true,
          responses: [{ pages: [[]] }, { pages: [[issue(49)]] }],
        },
        "create",
      );
      expect(result.status).not.toBe(0);
      expect(result.creates).toHaveLength(1);
      expect(JSON.parse(result.stdout).matches).toEqual([
        { number: 49, state: "open", html_url: url(49) },
      ]);
      expect(result.calls.at(-1)[0]).toBe("api");
    });
    it("stops when recovery lookup also fails", () => {
      const result = runEntry(
        {
          createFailure: true,
          responses: [{ pages: [[]] }, { pages: [[]], failure: true }],
        },
        "create",
      );
      expect(result.status).not.toBe(0);
      expect(result.creates).toHaveLength(1);
    });
    it("does not guess an issue number from malformed create output", () => {
      const result = runEntry({ createdUrl: "ambiguous response" }, "create");
      expect(result.status).not.toBe(0);
      expect(result.stdout).not.toContain("/plan-issue");
      expect(result.creates).toHaveLength(1);
    });
  });
});
