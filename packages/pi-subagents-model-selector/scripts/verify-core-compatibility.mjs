#!/usr/bin/env node
/**
 * Reproducible packed-compatibility verification for the model selector.
 *
 * Characterizes what the published tarball declares and what an installed
 * selector does against every published @jopqior/pi-subagents core:
 *
 * 1. Pack the real package and assert its manifest contract (required core
 *    peer, registry development range, no ordinary/optional/bundled core
 *    dependency).
 * 2. Pack a copied selector inside an isolated workspace copy before and
 *    after changing only the copied sibling core version, asserting the
 *    public core peer range is preserved. The synthetic sibling version is
 *    never published and the checkout is never edited.
 * 3. Install the packed selector into disposable consumers with each exact
 *    published core and the selector's pinned Pi host packages, with peer
 *    auto-install and lifecycle scripts disabled, resolving from npmjs.org.
 * 4. Type-check the packed selector source against each installed core with
 *    the workspace TypeScript binary, with no workspace path aliases.
 * 5. Run the Pi loader matrix in a fresh process per case: positive rows per
 *    core, plus negative missing-package, missing-service, reversed-order,
 *    and synthetic incompatible-service rows.
 *
 * The incompatible-service row is synthetic: no published core release lacks
 * `registerSpawnSelectionProvider`, so an empty service object is planted
 * under the real service key to exercise the selector's capability guard.
 *
 * Every fixture lives under a fresh mkdtemp directory and is removed in a
 * finally block. Network-dependent; run explicitly via
 * `pnpm run verify:core-compatibility`, never from the Vitest suite.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const PACKAGE_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const REPO_ROOT = resolve(PACKAGE_ROOT, "..", "..");
export const CORE_PACKAGE = "@jopqior/pi-subagents";
export const SELECTOR_PACKAGE = "@jopqior/pi-subagents-model-selector";
export const CORE_VERSIONS = ["1.0.0", "1.0.1", "1.0.2", "2.0.0"];
export const REQUIRED_CORE_PEER = ">=1.0.0";
export const CORE_DEV_RANGE = "^1.0.0";
export const NPMJS_REGISTRY = "https://registry.npmjs.org/";
export const HOST_PACKAGES = [
  "@earendil-works/pi-ai",
  "@earendil-works/pi-coding-agent",
  "@earendil-works/pi-tui",
];
export const TSC_BIN = join(PACKAGE_ROOT, "node_modules", ".bin", "tsc");

const TYPES_NODE_RANGE = "^22.15.3"; // matches the repository catalog range

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error !== undefined) {
    throw new Error(`spawning ${command} failed: ${result.error}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with status ${result.status}\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result;
}

function onlyTarball(directory) {
  const tarballs = readdirSync(directory).filter((name) =>
    name.endsWith(".tgz"),
  );
  assert.equal(
    tarballs.length,
    1,
    `expected exactly one tarball in ${directory}`,
  );
  return join(directory, tarballs[0]);
}

export function packSelectorInto(packageDir, destination) {
  mkdirSync(destination, { recursive: true });
  run("pnpm", ["-C", packageDir, "pack", "--pack-destination", destination]);
  return onlyTarball(destination);
}

export function extractPackedManifest(tarball, workDir) {
  mkdirSync(workDir, { recursive: true });
  run("tar", ["-xzf", tarball, "-C", workDir, "package/package.json"]);
  return readJson(join(workDir, "package", "package.json"));
}

/**
 * Asserts the packed selector manifest declares the core as a required peer
 * at the compatibility floor with a registry development range, and ships no
 * ordinary, optional, or bundled core dependency.
 */
export function assertPackedCoreContract(packed, label) {
  assert.equal(
    packed.peerDependencies?.[CORE_PACKAGE],
    REQUIRED_CORE_PEER,
    `${label}: packed core peer must be ${REQUIRED_CORE_PEER}`,
  );
  assert.equal(
    packed.peerDependenciesMeta?.[CORE_PACKAGE]?.optional,
    undefined,
    `${label}: packed core peer must not be optional`,
  );
  assert.equal(
    packed.dependencies?.[CORE_PACKAGE],
    undefined,
    `${label}: packed manifest must not depend on the core ordinarily`,
  );
  assert.equal(
    packed.optionalDependencies?.[CORE_PACKAGE],
    undefined,
    `${label}: packed manifest must not depend on the core optionally`,
  );
  const bundled = [
    ...(packed.bundledDependencies ?? []),
    ...(packed.bundleDependencies ?? []),
  ];
  assert.ok(
    !bundled.includes(CORE_PACKAGE),
    `${label}: packed manifest must not bundle the core`,
  );
  assert.equal(
    packed.devDependencies?.[CORE_PACKAGE],
    CORE_DEV_RANGE,
    `${label}: packed development range must be ${CORE_DEV_RANGE}`,
  );
}

export function buildIsolatedWorkspace(root) {
  const workspace = join(root, "workspace");
  const packages = join(workspace, "packages");
  mkdirSync(join(packages, "pi-subagents"), { recursive: true });
  // The real workspace configuration is copied so catalog: devDependencies
  // pack faithfully; the pack itself never touches the checkout.
  copyFileSync(
    join(REPO_ROOT, "pnpm-workspace.yaml"),
    join(workspace, "pnpm-workspace.yaml"),
  );
  // The copied sibling core contributes its manifest only: the pack test
  // packs the selector, never the core.
  copyFileSync(
    join(REPO_ROOT, "packages", "pi-subagents", "package.json"),
    join(packages, "pi-subagents", "package.json"),
  );
  const selector = join(packages, "pi-subagents-model-selector");
  mkdirSync(selector, { recursive: true });
  copyFileSync(
    join(PACKAGE_ROOT, "package.json"),
    join(selector, "package.json"),
  );
  cpSync(join(PACKAGE_ROOT, "src"), join(selector, "src"), { recursive: true });
  return workspace;
}

function assertIsolatedPacks(workspace, packRoot) {
  const coreManifestPath = join(
    workspace,
    "packages",
    "pi-subagents",
    "package.json",
  );
  const coreManifest = readJson(coreManifestPath);
  assert.notEqual(
    coreManifest.version,
    "99.0.0",
    "the isolated sibling version mutation collides with its own synthetic version",
  );

  const beforePacked = extractPackedManifest(
    packSelectorInto(
      join(workspace, "packages", "pi-subagents-model-selector"),
      join(packRoot, "before"),
    ),
    join(packRoot, "before-extract"),
  );
  assertPackedCoreContract(
    beforePacked,
    "isolated pack before sibling version change",
  );

  // Change only the copied sibling core version, to a version that is never
  // published, and repack: the public peer range must not follow it.
  coreManifest.version = "99.0.0";
  writeFileSync(coreManifestPath, `${JSON.stringify(coreManifest, null, 2)}\n`);
  const afterPacked = extractPackedManifest(
    packSelectorInto(
      join(workspace, "packages", "pi-subagents-model-selector"),
      join(packRoot, "after"),
    ),
    join(packRoot, "after-extract"),
  );
  assertPackedCoreContract(
    afterPacked,
    "isolated pack after sibling version change",
  );
  assert.equal(
    afterPacked.peerDependencies[CORE_PACKAGE],
    beforePacked.peerDependencies[CORE_PACKAGE],
    "changing the sibling core version must not change the packed core peer range",
  );
}

export function installConsumer(dir, { selectorTarball, coreVersion }) {
  mkdirSync(dir, { recursive: true });
  // The disposable consumer resolves from npmjs.org and disables peer
  // auto-install, lifecycle scripts, and any registry-age policy; none of
  // that weakens repository installation policy.
  writeFileSync(join(dir, ".npmrc"), `registry=${NPMJS_REGISTRY}\n`);
  const manifest = readJson(join(PACKAGE_ROOT, "package.json"));
  const dependencies = { "@types/node": TYPES_NODE_RANGE };
  for (const host of HOST_PACKAGES) {
    dependencies[host] = manifest.devDependencies[host];
  }
  if (coreVersion !== null) {
    dependencies[CORE_PACKAGE] = coreVersion;
  }
  dependencies[SELECTOR_PACKAGE] = `file:${selectorTarball}`;
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ private: true, type: "module", dependencies }, null, 2)}\n`,
  );
  run(
    "pnpm",
    [
      "--ignore-workspace",
      "--ignore-scripts",
      "--config.auto-install-peers=false",
      "--config.strict-peer-dependencies=false",
      "--config.minimum-release-age=0",
      "install",
    ],
    { cwd: dir },
  );
  const consumer = {
    dir,
    coreEntry: join(
      dir,
      "node_modules",
      ...CORE_PACKAGE.split("/"),
      "src",
      "index.ts",
    ),
    selectorEntry: join(
      dir,
      "node_modules",
      ...SELECTOR_PACKAGE.split("/"),
      "src",
      "index.ts",
    ),
  };
  assert.equal(
    readJson(
      join(dir, "node_modules", ...SELECTOR_PACKAGE.split("/"), "package.json"),
    ).version,
    manifest.version,
    "consumer: packed selector version installed",
  );
  if (coreVersion !== null) {
    assert.equal(
      readJson(
        join(dir, "node_modules", ...CORE_PACKAGE.split("/"), "package.json"),
      ).version,
      coreVersion,
      `consumer: resolved core version must be ${coreVersion}`,
    );
    assert.ok(
      readdirSync(
        join(dir, "node_modules", ...CORE_PACKAGE.split("/"), "src", "service"),
      ).includes("service.ts"),
      `consumer: core ${coreVersion} ships its service entry`,
    );
  }
  return consumer;
}

const PROBE_SOURCE = `// Generated by scripts/verify-core-compatibility.mjs - disposable loader probe.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { discoverAndLoadExtensions } from "@earendil-works/pi-coding-agent";

const consumerRoot = import.meta.dirname;
// mkdirSync with recursive returns undefined when the directory already
// exists, so the empty directories are constructed explicitly instead of
// from its return value.
const cwd = join(consumerRoot, "empty-cwd");
const agentDir = join(consumerRoot, "empty-agent");
mkdirSync(cwd, { recursive: true });
mkdirSync(agentDir, { recursive: true });
const [entryPathsJson, mode] = process.argv.slice(2);
if (mode === "synthetic-empty-service") {
  // Synthetic fixture: an empty service object under the real key.
  globalThis[Symbol.for("@gotgenes/pi-subagents:service")] = {};
}
const result = await discoverAndLoadExtensions(JSON.parse(entryPathsJson), cwd, agentDir);
process.stdout.write(
  "###RESULT_JSON###\\n" +
    JSON.stringify({
      errors: result.errors.map((entry) => ({ path: entry.path, error: entry.error })),
      extensions: result.extensions.map((extension) => ({
        path: extension.path,
        handlers: [...extension.handlers.keys()],
      })),
    }) +
      "\\n",
);
`;

function writeProbe(consumer) {
  const probePath = join(consumer.dir, "probe.mjs");
  writeFileSync(probePath, PROBE_SOURCE);
  return probePath;
}

/**
 * Loads the given extension entries through the SDK's public loader in a
 * fresh Node process with empty cwd/agent directories, and returns the
 * parsed loader result. The probe itself asserts nothing: the harness
 * inspects the collected errors rather than a process exit code.
 */
export function runLoaderProbe(consumer, entryPaths, mode) {
  const probePath = writeProbe(consumer);
  const result = run(
    "node",
    [probePath, JSON.stringify(entryPaths), ...(mode ? [mode] : [])],
    {
      cwd: consumer.dir,
    },
  );
  const output = result.stdout;
  const marker = output.indexOf("###RESULT_JSON###");
  assert.notEqual(marker, -1, "probe output must contain the result marker");
  return JSON.parse(output.slice(marker + "###RESULT_JSON###".length));
}

function loadedPaths(resultJson) {
  return new Set(
    resultJson.extensions.map((extension) => resolve(extension.path)),
  );
}

export function assertPositiveLoad(
  resultJson,
  { coreEntry, selectorEntry, label },
) {
  assert.deepEqual(resultJson.errors, [], `${label}: loader reports no errors`);
  const loaded = loadedPaths(resultJson);
  assert.ok(loaded.has(resolve(coreEntry)), `${label}: core extension loaded`);
  assert.ok(
    loaded.has(resolve(selectorEntry)),
    `${label}: selector extension loaded`,
  );
  const selector = resultJson.extensions.find(
    (extension) => resolve(extension.path) === resolve(selectorEntry),
  );
  assert.deepEqual(
    selector.handlers.sort(),
    ["session_shutdown", "session_start"],
    `${label}: selector lifecycle handlers registered`,
  );
}

/**
 * Negative-row shape for the missing-package case: no extension loads and
 * the single collected error names the missing core package. Also applied
 * to a positive result as a control, where it must be rejected.
 */
export function assertMissingPackageLoad(resultJson, label) {
  assert.deepEqual(
    [...loadedPaths(resultJson)],
    [],
    `${label}: no extension loads when the core package is missing`,
  );
  assert.equal(
    resultJson.errors.length,
    1,
    `${label}: exactly one loader error`,
  );
  assert.match(
    resultJson.errors[0].error,
    /@jopqior\/pi-subagents/,
    `${label}: the error names the missing core package`,
  );
}

/**
 * Negative-row shape for cases where the core is installed but cannot serve
 * selection: the selector stays unloaded, the single error carries the
 * capability diagnostic naming the core, and the core loads when given.
 */
export function assertConfigurationErrorLoad(
  resultJson,
  { coreEntry, selectorEntry, label, expectCoreLoaded },
) {
  const loaded = loadedPaths(resultJson);
  assert.ok(
    !loaded.has(resolve(selectorEntry)),
    `${label}: selector must not load`,
  );
  assert.equal(
    resultJson.errors.length,
    1,
    `${label}: exactly one loader error`,
  );
  assert.match(
    resultJson.errors[0].error,
    /registerSpawnSelectionProvider/,
    `${label}: the diagnostic names the missing registration capability`,
  );
  assert.match(
    resultJson.errors[0].error,
    /@jopqior\/pi-subagents/,
    `${label}: the diagnostic names the core package`,
  );
  if (expectCoreLoaded) {
    assert.ok(
      loaded.has(resolve(coreEntry)),
      `${label}: core extension loaded`,
    );
  } else {
    assert.deepEqual([...loaded], [], `${label}: no extension loads`);
  }
}

/**
 * Runs the callback with a unique temporary run root and removes it with its
 * entire fixture tree afterwards, so concurrent invocations never share or
 * delete each other's fixtures.
 */
export function withDisposableRoot(callback) {
  const root = mkdtempSync(join(tmpdir(), "selector-core-compat-"));
  try {
    return callback(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

export async function main() {
  return withDisposableRoot(async (root) => {
    // Pack the real package and pin its manifest contract.
    const realTarball = packSelectorInto(PACKAGE_ROOT, join(root, "pack-real"));
    const realPacked = extractPackedManifest(
      realTarball,
      join(root, "pack-real-extract"),
    );
    assertPackedCoreContract(realPacked, "pack-real");
    console.log("PASS pack-real");

    // The packed floor survives a changed sibling version in an isolated copy.
    assertIsolatedPacks(
      buildIsolatedWorkspace(join(root, "iso")),
      join(root, "iso-packs"),
    );
    console.log("PASS isolated-pack");

    const selectorVersion = readJson(
      join(PACKAGE_ROOT, "package.json"),
    ).version;

    // Positive rows: one consumer per published core.
    const positiveResults = new Map();
    for (const coreVersion of CORE_VERSIONS) {
      const consumer = installConsumer(join(root, `consumer-${coreVersion}`), {
        selectorTarball: realTarball,
        coreVersion,
      });
      const resultJson = runLoaderProbe(consumer, [
        consumer.coreEntry,
        consumer.selectorEntry,
      ]);
      assertPositiveLoad(resultJson, {
        coreEntry: consumer.coreEntry,
        selectorEntry: consumer.selectorEntry,
        label: `positive[${coreVersion}]`,
      });
      positiveResults.set(coreVersion, resultJson);

      const tsconfigPath = join(consumer.dir, "tsconfig.verify.json");
      writeFileSync(
        tsconfigPath,
        `${JSON.stringify(
          {
            compilerOptions: {
              strict: true,
              noEmit: true,
              target: "es2024",
              lib: ["es2024"],
              module: "esnext",
              moduleResolution: "bundler",
              types: ["node"],
              skipLibCheck: true,
            },
            files: [
              join(
                "node_modules",
                ...SELECTOR_PACKAGE.split("/"),
                "src",
                "index.ts",
              ),
            ],
          },
          null,
          2,
        )}\n`,
      );
      run(TSC_BIN, ["-p", tsconfigPath], { cwd: consumer.dir });
      console.log(
        `PASS positive[${coreVersion}] (+ type-check, selector ${selectorVersion})`,
      );
    }

    // Control: the missing-package assertion must reject a successful
    // resolution, so a green negative row is evidence and not a vacuous pass.
    const controlPositive = positiveResults.get(CORE_VERSIONS[0]);
    assert.throws(
      () => assertMissingPackageLoad(controlPositive, "control"),
      `control: the missing-package assertion rejects a core-installed result`,
    );
    console.log("PASS control");

    // Negative rows. The missing-package row uses its own consumer without
    // the core; the three service-state rows share the consumer installed
    // below and isolate from each other through a fresh probe process each.
    const missingConsumer = installConsumer(
      join(root, "consumer-missing-package"),
      {
        selectorTarball: realTarball,
        coreVersion: null,
      },
    );
    assertMissingPackageLoad(
      runLoaderProbe(missingConsumer, [missingConsumer.selectorEntry]),
      "missing-package",
    );
    console.log("PASS missing-package");

    const negativeConsumer = installConsumer(join(root, "consumer-negative"), {
      selectorTarball: realTarball,
      coreVersion: CORE_VERSIONS[CORE_VERSIONS.length - 1],
    });

    // Core installed but not loaded before the selector: the initialization
    // error identifies the required package and load order.
    assertConfigurationErrorLoad(
      runLoaderProbe(negativeConsumer, [negativeConsumer.selectorEntry]),
      {
        coreEntry: negativeConsumer.coreEntry,
        selectorEntry: negativeConsumer.selectorEntry,
        label: "missing-service",
        expectCoreLoaded: false,
      },
    );
    console.log("PASS missing-service");

    assertConfigurationErrorLoad(
      runLoaderProbe(negativeConsumer, [
        negativeConsumer.selectorEntry,
        negativeConsumer.coreEntry,
      ]),
      {
        coreEntry: negativeConsumer.coreEntry,
        selectorEntry: negativeConsumer.selectorEntry,
        label: "reversed-order",
        expectCoreLoaded: true,
      },
    );
    console.log("PASS reversed-order");

    // Synthetic incompatible service: no published core lacks the capability,
    // so an empty service object is planted under the real key instead.
    assertConfigurationErrorLoad(
      runLoaderProbe(
        negativeConsumer,
        [negativeConsumer.selectorEntry],
        "synthetic-empty-service",
      ),
      {
        coreEntry: negativeConsumer.coreEntry,
        selectorEntry: negativeConsumer.selectorEntry,
        label: "synthetic-incompatible-service",
        expectCoreLoaded: false,
      },
    );
    console.log("PASS synthetic-incompatible-service (synthetic fixture)");

    console.log(
      `verify-core-compatibility: all rows passed (selector ${selectorVersion})`,
    );
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
