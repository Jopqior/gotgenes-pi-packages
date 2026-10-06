#!/usr/bin/env node
// Network-dependent packed acceptance, deliberately separate from Vitest.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT = fileURLToPath(import.meta.url);
const PACKAGE_ROOT = resolve(dirname(SCRIPT), "..");
const REPO_ROOT = resolve(PACKAGE_ROOT, "../..");
const CORE = "@jopqior/pi-subagents";
const WORKTREES = "@jopqior/pi-subagents-worktrees";
const UPSTREAM = "@gotgenes/pi-subagents";
const SAVED_BYTES = "packed work\nexact bytes\n";
const ADDENDUM =
  "\n\n---\nChanges saved to branch `pi-agent-dirty`. Merge with: `git merge pi-agent-dirty`";

export function assertPackedContract(manifest) {
  assert.equal(manifest.name, WORKTREES, "packed identity");
  assert.equal(
    manifest.peerDependencies?.[CORE],
    ">=1.0.0",
    "required core floor",
  );
  assert.notEqual(
    manifest.peerDependenciesMeta?.[CORE]?.optional,
    true,
    "required peer",
  );
  assert.equal(
    manifest.devDependencies?.[CORE],
    "^5.0.0",
    "registry development core",
  );
  for (const field of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
    "devDependencies",
  ]) {
    assert.equal(
      manifest[field]?.[UPSTREAM],
      undefined,
      `no upstream ${field}`,
    );
    if (field === "dependencies" || field === "optionalDependencies") {
      assert.equal(
        manifest[field]?.[CORE],
        undefined,
        `no ordinary/optional core ${field}`,
      );
    }
  }
  for (const field of ["bundledDependencies", "bundleDependencies"]) {
    assert.ok(
      ![CORE, UPSTREAM].some(
        (name) => manifest[field] === true || manifest[field]?.includes(name),
      ),
      "no bundled core",
    );
  }
  assert.deepEqual(
    manifest.files,
    ["src", "README.md", "CHANGELOG.md", "LICENSE"],
    "unchanged shipped scope",
  );
}

export function assertPositiveLoad(result, { coreEntry, worktreesEntry }) {
  assert.deepEqual(result.errors, [], "positive loader errors");
  assert.equal(
    result.registrations,
    1,
    "one forwarded real provider registration",
  );
  assert.equal(result.unregisters, 1, "actual shutdown disposer invoked once");
  assert.ok(
    result.extensions.some(
      (entry) => resolve(entry.path) === resolve(coreEntry),
    ),
    "real core loaded",
  );
  const extension = result.extensions.find(
    (entry) => resolve(entry.path) === resolve(worktreesEntry),
  );
  assert.ok(extension, "worktrees entry loaded");
  assert.deepEqual(
    extension.handlers.toSorted(),
    ["session_shutdown", "session_start"],
    "worktrees hooks",
  );
  assert.deepEqual(
    extension.commands,
    ["subagents-worktrees"],
    "worktrees command",
  );
}

export function assertMissingPackageLoad(result, { worktreesEntry }) {
  assert.deepEqual(result.extensions, [], "missing core loads no extension");
  assert.equal(result.registrations, 0, "missing core registers no provider");
  assert.equal(result.errors.length, 1, "one missing import error");
  assert.equal(
    resolve(result.errors[0].path),
    resolve(worktreesEntry),
    "missing import attribution",
  );
  // Quoted boundary rejects the longer companion name, which shares the prefix.
  assert.match(
    result.errors[0].error,
    /Cannot find module ['"]@jopqior\/pi-subagents['"]/,
    "quoted core import diagnostic",
  );
}

export function assertInactiveLoad(
  result,
  { coreEntry, worktreesEntry, reversed },
) {
  assert.deepEqual(
    result.errors,
    [],
    "inactive service is not an import failure",
  );
  assert.equal(
    result.registrations,
    0,
    "inactive service has no provider or later retry",
  );
  assert.equal(result.unregisters, 0, "inactive service has no disposer");
  assert.deepEqual(
    result.extensions.map((entry) => resolve(entry.path)).toSorted(),
    (reversed ? [coreEntry, worktreesEntry] : [worktreesEntry])
      .map((entry) => resolve(entry))
      .toSorted(),
    "exact inactive load set",
  );
  const extension = result.extensions.find(
    (entry) => resolve(entry.path) === resolve(worktreesEntry),
  );
  assert.deepEqual(extension.handlers, [], "inactive worktrees hooks");
  assert.deepEqual(extension.commands, [], "inactive worktrees commands");
}

export function assertProviderResult(result) {
  assert.equal(result.nonOpted, null, "non-opted prepare returns undefined");
  assert.equal(
    result.globalOverridden,
    null,
    "project config overrides global opt-in",
  );
  for (const name of ["clean", "dirty"]) {
    assert.equal(result[name]?.detached, true, `${name}: opted detached HEAD`);
    assert.equal(
      result[name].head,
      result.baseHead,
      `${name}: starts at base HEAD`,
    );
    assert.equal(
      result[name].existsAfter,
      false,
      `${name}: removed after disposal`,
    );
  }
  assert.equal(result.clean.disposal, null, "clean disposal returns undefined");
  assert.equal(
    result.dirty.savedBytes,
    SAVED_BYTES,
    "rescue branch exact saved bytes",
  );
  assert.deepEqual(
    result.dirty.disposal,
    { resultAddendum: ADDENDUM },
    "dirty rescue branch exact resultAddendum",
  );
  assert.equal(
    result.reregistered,
    true,
    "real service accepts re-registration after shutdown",
  );
}

export async function withDisposableRoot(callback) {
  const root = mkdtempSync(join(tmpdir(), "worktrees-core-compat-"));
  const tracked = new Set();
  try {
    // Await is essential: a returned Promise otherwise outlives the finally.
    return await callback(root, tracked);
  } finally {
    for (const path of tracked) rmSync(path, { recursive: true, force: true });
    rmSync(root, { recursive: true, force: true });
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: 300_000,
    ...options,
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed (${result.status}): ${result.error ?? ""}\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function packInto(directory, destination) {
  mkdirSync(destination, { recursive: true });
  const tarball = join(destination, "package.tgz");
  run("pnpm", ["-C", directory, "pack", "--out", tarball]);
  const manifest = JSON.parse(
    run("tar", ["-xOzf", tarball, "package/package.json"]).stdout,
  );
  return { tarball, manifest };
}

function installConsumer(dir, tarball, core, host) {
  mkdirSync(dir, { recursive: true });
  const dependencies = {
    [WORKTREES]: `file:${tarball}`,
    "@types/node": "^22.15.3",
  };
  for (const name of ["pi-ai", "pi-coding-agent", "pi-tui"])
    dependencies[`@earendil-works/${name}`] = host;
  if (host === "1.0.0") dependencies.typebox = "1.3.27";
  if (core) dependencies[CORE] = core.specifier;
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ private: true, type: "module", dependencies }),
  );
  writeFileSync(join(dir, ".npmrc"), "registry=https://registry.npmjs.org/\n");
  // Do not weaken repository policy: these flags apply only to this consumer.
  run(
    "pnpm",
    [
      "--ignore-workspace",
      "--ignore-scripts",
      "--config.auto-install-peers=false",
      "--config.strict-peer-dependencies=false",
      "--config.minimum-release-age=0",
      "install",
      "--registry=https://registry.npmjs.org/",
    ],
    { cwd: dir },
  );
  const require = createRequire(join(dir, "package.json"));
  const worktreesEntry = realpathSync(require.resolve(WORKTREES));
  const sources = [];
  for (const name of Object.keys(dependencies).filter(
    (name) => name !== "@types/node",
  )) {
    const path = realpathSync(join(dir, "node_modules", ...name.split("/")));
    assert.ok(
      path.startsWith(`${realpathSync(dir)}/`),
      `${name}: installed consumer path, not checkout/sibling symlink`,
    );
    assert.ok(
      !path.startsWith(`${REPO_ROOT}/`),
      `${name}: no monorepo resolution`,
    );
    const installed = readJson(join(path, "package.json"));
    assert.equal(installed.name, name, "resolved package identity");
    const expected =
      name === CORE
        ? core.version
        : name === WORKTREES
          ? JSON.parse(
              run("tar", ["-xOzf", tarball, "package/package.json"]).stdout,
            ).version
          : dependencies[name];
    assert.equal(
      installed.version,
      expected,
      `${name}: exact installed version`,
    );
    sources.push({ name: installed.name, version: installed.version, path });
  }
  assert.throws(
    () => createRequire(worktreesEntry).resolve(UPSTREAM),
    "upstream core must not resolve from worktrees",
  );
  const corePath = core
    ? realpathSync(dirname(dirname(require.resolve(CORE))))
    : undefined;
  const coreEntry = core ? join(corePath, "index.ts") : undefined;
  if (core) {
    assert.ok(
      coreEntry.startsWith(`${realpathSync(dir)}/`),
      "core entry belongs to consumer",
    );
    assert.ok(existsSync(coreEntry), "actual shipped core extension entry");
  } else {
    assert.throws(
      () => createRequire(worktreesEntry).resolve(CORE),
      "missing consumer cannot resolve fork core",
    );
  }
  console.log(`installed sources: ${JSON.stringify(sources)}`);
  return { dir, coreEntry, worktreesEntry };
}

function typecheck(consumer) {
  const source = dirname(consumer.worktreesEntry);
  const config = join(consumer.dir, "tsconfig.verify.json");
  writeFileSync(
    config,
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        target: "es2024",
        lib: ["es2024"],
        module: "esnext",
        moduleResolution: "bundler",
        types: ["node"],
        skipLibCheck: true,
        // Only installed worktrees source participates; runtime still uses its packed imports map.
        paths: { "#src/*": [`${source}/*`] },
      },
      files: [consumer.worktreesEntry],
    }),
  );
  run(join(PACKAGE_ROOT, "node_modules/.bin/tsc"), ["-p", config], {
    cwd: consumer.dir,
  });
}

function runLoaderProbe(consumer, mode) {
  const probe = join(consumer.dir, "probe.mjs");
  const ledger = join(consumer.dir, "external-paths.json");
  copyFileSync(SCRIPT, probe);
  try {
    const output = run(
      "node",
      [probe, "--probe", JSON.stringify(consumer), mode, ledger],
      {
        cwd: consumer.dir,
        env: {
          ...process.env,
          NODE_PATH: "",
          PI_CODING_AGENT_DIR: join(consumer.dir, "empty-agent"),
        },
      },
    ).stdout;
    const marker = "###RESULT_JSON###";
    assert.ok(output.includes(marker), "loader result marker");
    return JSON.parse(output.slice(output.indexOf(marker) + marker.length));
  } finally {
    // The parent also reclaims paths if the fresh process failed before its finally.
    if (existsSync(ledger)) {
      for (const path of readJson(ledger))
        rmSync(path, { recursive: true, force: true });
    }
  }
}

async function providerProbe(consumer, mode, ledger) {
  return withDisposableRoot(async (root, tracked) => {
    const cwd = join(root, "git");
    const agentDir = join(consumer.dir, "empty-agent");
    mkdirSync(join(cwd, ".pi"), { recursive: true });
    mkdirSync(agentDir, { recursive: true });
    const git = (...args) => run("git", ["-C", cwd, ...args]).stdout.trim();
    git("init");
    git("config", "user.name", "Packed Probe");
    git("config", "user.email", "probe@example.invalid");
    git("config", "core.hooksPath", join(root, "empty-hooks"));
    writeFileSync(join(cwd, "base.txt"), "base\n");
    git("add", "base.txt");
    git("commit", "-m", "fixture");
    const baseHead = git("rev-parse", "HEAD");
    writeFileSync(
      join(agentDir, "subagents-worktrees.json"),
      JSON.stringify({ worktreeAgents: ["global-only"] }),
    );
    writeFileSync(
      join(cwd, ".pi/subagents-worktrees.json"),
      JSON.stringify({ worktreeAgents: ["project-only"] }),
    );
    const previous = process.cwd();
    process.chdir(cwd);
    process.env.PI_CODING_AGENT_DIR = agentDir;
    try {
      const { discoverAndLoadExtensions } = await import(
        "@earendil-works/pi-coding-agent"
      );
      const captureKey = "worktrees-packed-probe";
      const capture = {
        registrations: 0,
        unregisters: 0,
        provider: undefined,
        original: undefined,
      };
      globalThis[Symbol.for(captureKey)] = capture;
      const instrument = join(consumer.dir, "instrument.ts");
      writeFileSync(
        instrument,
        `import { getSubagentsService } from "${CORE}";
export default function () {
  const service = getSubagentsService();
  if (!service) return;
  const capture = globalThis[Symbol.for("${captureKey}")];
  const original = service.registerWorkspaceProvider.bind(service);
  capture.original = original;
  service.registerWorkspaceProvider = (provider) => {
    const dispose = original(provider);
    capture.provider = provider;
    capture.registrations++;
    return () => { dispose(); capture.unregisters++; capture.provider = undefined; };
  };
}`,
      );
      const paths =
        mode === "positive"
          ? [consumer.coreEntry, instrument, consumer.worktreesEntry]
          : mode === "reversed"
            ? [consumer.worktreesEntry, consumer.coreEntry, instrument]
            : [consumer.worktreesEntry];
      const loaded = await discoverAndLoadExtensions(paths, cwd, agentDir);
      const result = {
        errors: loaded.errors.map(({ path, error }) => ({ path, error })),
        extensions: loaded.extensions
          .filter((entry) => entry.path !== instrument)
          .map((entry) => ({
            path: entry.path,
            handlers: [...entry.handlers.keys()],
            commands: [...entry.commands.keys()],
          })),
      };
      if (mode === "positive") {
        assert.deepEqual(result.errors, [], "real extension loader errors");
        assert.equal(
          capture.registrations,
          1,
          "one actual provider registered",
        );
        assert.ok(capture.provider, "forwarded registered provider captured");
        const prepare = async (agentType, agentId) => {
          try {
            return await capture.provider.prepare({
              agentType,
              agentId,
              baseCwd: cwd,
            });
          } finally {
            // Scan even if prepare throws/returns the wrong value, before any assertion.
            for (const line of git("worktree", "list", "--porcelain").split(
              "\n",
            )) {
              if (line.startsWith("worktree ") && line.slice(9) !== cwd)
                tracked.add(line.slice(9));
            }
            writeFileSync(ledger, JSON.stringify([...tracked]));
          }
        };
        const nonOptedWorkspace = await prepare("not-opted", "nonopted");
        const nonOpted = nonOptedWorkspace ?? null;
        assert.equal(nonOpted, null, "non-opted prepare must return undefined");
        const globalOverridden =
          (await prepare("global-only", "global")) ?? null;
        assert.equal(globalOverridden, null, "project config overrides global");
        const exercise = async (id, dirty) => {
          const workspace = await prepare("project-only", id);
          assert.ok(workspace, `${id}: opted prepare yields workspace`);
          assert.ok(
            tracked.has(workspace.cwd),
            "workspace tracked outside consumer before assertions",
          );
          const head = run("git", [
            "-C",
            workspace.cwd,
            "rev-parse",
            "HEAD",
          ]).stdout.trim();
          const detached =
            spawnSync("git", [
              "-C",
              workspace.cwd,
              "symbolic-ref",
              "-q",
              "HEAD",
            ]).status === 1;
          if (dirty)
            writeFileSync(join(workspace.cwd, "saved.txt"), SAVED_BYTES);
          const disposal =
            workspace.dispose({
              status: "completed",
              description: "packed fixture",
            }) ?? null;
          const existsAfter = existsSync(workspace.cwd);
          const savedBytes = dirty
            ? run("git", ["-C", cwd, "show", "pi-agent-dirty:saved.txt"]).stdout
            : undefined;
          return {
            head,
            detached,
            disposal,
            existsAfter,
            ...(dirty ? { savedBytes } : {}),
          };
        };
        const clean = await exercise("clean", false);
        const dirty = await exercise("dirty", true);
        const extension = loaded.extensions.find(
          (entry) => entry.path === consumer.worktreesEntry,
        );
        for (const handler of extension.handlers.get("session_shutdown") ?? [])
          await handler({ type: "session_shutdown" }, {});
        // Use the original method, not the instrumentation: a retained slot must reject this.
        const unregister = capture.original({ prepare: async () => undefined });
        unregister();
        assert.equal(
          capture.provider,
          undefined,
          "shutdown revoked captured provider through actual disposer",
        );
        result.provider = {
          nonOpted,
          globalOverridden,
          clean,
          dirty,
          baseHead,
          reregistered: true,
        };
        assertProviderResult(result.provider);
      }
      result.registrations = capture.registrations;
      result.unregisters = capture.unregisters;
      return result;
    } finally {
      process.chdir(previous);
    }
  });
}

export async function main() {
  await withDisposableRoot(async (root) => {
    const packed = packInto(PACKAGE_ROOT, join(root, "pack-worktrees"));
    assertPackedContract(packed.manifest);
    const files = run("tar", ["-tzf", packed.tarball])
      .stdout.trim()
      .split("\n");
    assert.ok(
      files.every((file) =>
        /^package\/(?:src\/[^/]+\.ts|package\.json|README\.md|CHANGELOG\.md|LICENSE)$/.test(
          file,
        ),
      ),
      "no shipped verification scripts/tests",
    );
    const candidate = packInto(
      join(REPO_ROOT, "packages/pi-subagents"),
      join(root, "pack-core"),
    );
    assert.equal(candidate.manifest.name, CORE, "candidate actual identity");
    const rows = [
      {
        label: "floor",
        core: { specifier: "1.0.0", version: "1.0.0" },
        host: "0.84.4",
      },
      {
        label: "published",
        core: { specifier: "5.0.0", version: "5.0.0" },
        host: "1.0.0",
      },
      {
        label: "candidate",
        core: {
          specifier: `file:${candidate.tarball}`,
          version: candidate.manifest.version,
        },
        host: "1.0.0",
      },
    ];
    let published;
    for (const row of rows) {
      const consumer = installConsumer(
        join(root, row.label),
        packed.tarball,
        row.core,
        row.host,
      );
      typecheck(consumer);
      const result = runLoaderProbe(consumer, "positive");
      assertPositiveLoad(result, consumer);
      assertProviderResult(result.provider);
      console.log(
        `PASS ${row.label}: ${CORE}@${row.core.version}, host ${row.host}, installed-source typecheck + real configured provider lifecycle`,
      );
      if (row.label === "published") published = consumer;
    }
    const missing = installConsumer(
      join(root, "missing"),
      packed.tarball,
      null,
      "1.0.0",
    );
    assertMissingPackageLoad(runLoaderProbe(missing, "missing"), missing);
    console.log("PASS missing-core: attributed quoted import failure");
    for (const mode of ["inactive", "reversed"]) {
      assertInactiveLoad(runLoaderProbe(published, mode), {
        ...published,
        reversed: mode === "reversed",
      });
      console.log(
        `PASS ${mode}: resolvable core, no provider/commands/hooks or retry`,
      );
    }
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv[2] === "--probe") {
    const result = await providerProbe(
      JSON.parse(process.argv[3]),
      process.argv[4],
      process.argv[5],
    );
    process.stdout.write(`###RESULT_JSON###${JSON.stringify(result)}\n`);
  } else {
    await main().catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
