#!/usr/bin/env node
// Artifact-only first release: project with the ordinary artifact preflight,
// then stage the exact application set outside the source checkout.
import { execFileSync } from "node:child_process";
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decideFirstForkRelease } from "./fork-sync/first-release.mjs";
import { ForkSyncError, parseStrictSemVer } from "./fork-sync/values.mjs";
import { requireForkSyncTarget } from "./fork-sync-targets.mjs";
import { prepareArtifacts } from "./release-artifacts.mjs";
import {
  findReleaseSection,
  readReleasePackages,
  requireReleasePackage,
} from "./release-correspondence.mjs";

function main(args) {
  if (args.length === 1 && ["--help", "-h"].includes(args[0])) {
    process.stdout.write(
      [
        "Usage: node scripts/release/prepare-first-fork-release.mjs",
        "  --repo <primary-checkout> --package <directory> --version <stable-version>",
        "  --merge <completed-merge> --notes <reviewed-summary-file> --output <fresh-external-directory>",
        "",
        "All six inputs are required. No default version, apply, publish or dispatch mode.",
        "Requires clean main, actual registered fork manifest and empty selected evidence.",
        "Queries supported upstream tags without fetching or changing refs.",
        "Writes candidate files at their eventual repository-relative paths and first-fork-release.json.",
        "Review sourceHead, merge, evidence and applicationFiles before separately applying/committing/tagging.",
        "If source HEAD or contents change, regenerate or stop for review. Publication requires separate approval.",
        "",
      ].join("\n"),
    );
    return;
  }
  const options = parseOptions(args);
  const repo = realpathSync(options.repo);
  const target = requireForkSyncTarget(options.package);
  const output = requireFreshOutput(repo, options.output);
  const registry = readReleasePackages(
    path.join(repo, "scripts/release/release-packages.json"),
    repo,
  );
  const registration = requireReleasePackage(registry, target.directory);
  if (registration.kind !== "fork")
    throw new ForkSyncError(`${target.directory} must be registered as a fork`);
  if (registration.upstream.repository !== "gotgenes/pi-packages")
    throw new ForkSyncError("unsupported registered upstream repository");
  const manifestPath = `packages/${target.directory}/package.json`;
  const changelogPath = `packages/${target.directory}/CHANGELOG.md`;
  const manifest = JSON.parse(
    readFileSync(path.join(repo, manifestPath), "utf8"),
  );
  if (!parseStrictSemVer(manifest.version))
    throw new ForkSyncError(
      "working fork manifest requires a strict stable version",
    );
  const applicationFiles = [
    manifestPath,
    changelogPath,
    target.statePath,
    target.correspondencePath,
  ];
  // Refuse critical-byte drift hidden from status by index flags or symlinks.
  for (const relative of [
    ...applicationFiles,
    "scripts/release/release-packages.json",
  ]) {
    const working = readFileSync(path.join(repo, relative));
    const tagged = execFileSync("git", ["show", `HEAD:${relative}`], {
      cwd: repo,
    });
    if (
      !lstatSync(path.join(repo, relative)).isFile() ||
      !working.equals(tagged)
    )
      throw new ForkSyncError(
        `first release requires clean committed artifact ${relative}`,
      );
  }
  const notes = readNotes(options.notes);
  const evidence = decideFirstForkRelease(
    repo,
    path.join(repo, target.statePath),
    target.directory,
    { version: options.version, merge: options.merge },
  );
  const tag = evidence.decision.nextTag;
  const date = new Date().toISOString().slice(0, 10);
  const section = `## [${options.version}](https://github.com/Jopqior/gotgenes-pi-packages/releases/tag/${tag}) (${date})\n\n${notes}\n`;
  findReleaseSection(section, tag, target.directory);
  const inherited = readFileSync(path.join(repo, changelogPath));
  const scratchParent = realpathSync(tmpdir());
  requireOutsideCheckout(repo, scratchParent);
  const scratch = mkdtempSync(
    path.join(scratchParent, "first-fork-artifacts-"),
  );
  try {
    const sectionFile = path.join(scratch, "input-section");
    const specFile = path.join(scratch, "spec.json");
    writeFileSync(sectionFile, section);
    writeFileSync(
      specFile,
      JSON.stringify([
        {
          directory: target.directory,
          tag,
          decision: evidence.decision,
          section: sectionFile,
        },
      ]),
    );
    prepareArtifacts(repo, scratch, specFile);
    const [artifacts] = JSON.parse(
      readFileSync(path.join(scratch, "fork-artifacts.json"), "utf8"),
    );
    const decorated = readFileSync(path.join(scratch, "section-0"));
    const historicalHeading = inherited.indexOf("\n## ");
    const seam =
      inherited.subarray(0, 3).toString() === "## "
        ? 0
        : historicalHeading === -1
          ? inherited.length
          : historicalHeading + 1;
    const changelog = Buffer.concat([
      inherited.subarray(0, seam),
      decorated,
      Buffer.from("\n"),
      inherited.subarray(seam),
    ]);
    if (
      findReleaseSection(changelog.toString("utf8"), tag, target.directory) !==
      `${decorated.toString("utf8")}\n`
    )
      throw new ForkSyncError(
        "candidate first CHANGELOG section is not the bounded reviewed notes",
      );
    const candidate = new Map([
      [
        manifestPath,
        Buffer.from(
          `${JSON.stringify({ ...manifest, version: evidence.decision.version }, null, 2)}\n`,
        ),
      ],
      [changelogPath, changelog],
      [
        artifacts.statePath,
        readFileSync(path.join(scratch, artifacts.stateFile)),
      ],
      [
        artifacts.correspondencePath,
        readFileSync(path.join(scratch, artifacts.correspondenceFile)),
      ],
      [
        "first-fork-release.json",
        Buffer.from(
          `${JSON.stringify({ schemaVersion: 1, sourceHead: evidence.head, package: target.directory, merge: evidence.incorporated.merge, tag, version: evidence.decision.version, incorporated: evidence.incorporated, applicationFiles }, null, 2)}\n`,
        ),
      ],
    ]);
    // All evidence, notes and projected artifacts passed before output exists.
    requireFreshOutput(repo, output);
    mkdirSync(output);
    for (const [relative, bytes] of candidate) {
      const file = path.join(output, relative);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, bytes, { flag: "wx" });
    }
    process.stdout.write(`${output}\n`);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

function parseOptions(args) {
  const required = ["repo", "package", "version", "merge", "notes", "output"];
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i].slice(2);
    if (!args[i].startsWith("--") || !required.includes(name))
      throw new ForkSyncError(`unknown argument ${args[i]} (see --help)`);
    if (Object.hasOwn(options, name))
      throw new ForkSyncError(`--${name} cannot be repeated`);
    if (!args[i + 1]?.trim() || args[i + 1].startsWith("--"))
      throw new ForkSyncError(`--${name} requires a value`);
    options[name] = args[i + 1];
  }
  for (const name of required) {
    if (!options[name])
      throw new ForkSyncError(`--${name} is required (see --help)`);
  }
  return options;
}

function requireFreshOutput(repo, requested) {
  const absolute = path.resolve(requested);
  if (lstatSync(absolute, { throwIfNoEntry: false }))
    throw new ForkSyncError("output must be a fresh external directory");
  const parent = realpathSync(path.dirname(absolute));
  const output = path.join(parent, path.basename(absolute));
  requireOutsideCheckout(repo, output);
  return output;
}

function requireOutsideCheckout(repo, file) {
  const relative = path.relative(repo, file);
  if (
    !relative ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  )
    throw new ForkSyncError("candidate output must be outside checkout");
}

function readNotes(file) {
  const bytes = readFileSync(file);
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ForkSyncError("notes must be valid UTF-8");
  }
  if (
    bytes.length > 65536 ||
    !text.trim() ||
    // biome-ignore lint/suspicious/noControlCharactersInRegex: reject control bytes in reviewed prose; tabs and line endings are permitted.
    /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text) ||
    /^#{1,2}(?:\s|$)/m.test(text) ||
    /^###\s+Upstream correspondence\s*$/im.test(text) ||
    /<!--\s*(?:upstream|release)-correspondence:/.test(text)
  )
    throw new ForkSyncError(
      "notes must be a bounded summary without release headings or managed correspondence sections",
    );
  // Reuse the strict reader's fence validation rather than create a scanner.
  try {
    findReleaseSection(
      `## [0.0.0](https://github.com/Jopqior/gotgenes-pi-packages/releases/tag/pi-subagents-v0.0.0) (notes validation)\n\n${text}`,
      "pi-subagents-v0.0.0",
      "pi-subagents",
    );
  } catch (error) {
    throw new ForkSyncError(`invalid notes: ${error.message}`);
  }
  return text.trim();
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
