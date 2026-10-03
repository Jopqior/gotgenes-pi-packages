import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const SCRIPT_URL = JSON.stringify(
  new URL("../scripts/verify-core-compatibility.mjs", import.meta.url).href,
);

// Only subprocess IO is simulated; manifests and disposable consumer files
// are read/written by the real script, without registry access.
const OFFLINE_DRIVER = `
  import assert from "node:assert/strict";
  import childProcess from "node:child_process";
  import { syncBuiltinESMExports } from "node:module";
  import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
  import { join } from "node:path";
  const installs = [];
  childProcess.spawnSync = (command, args, options) => {
    assert.equal(command, "pnpm");
    const manifest = JSON.parse(readFileSync(join(options.cwd, "package.json"), "utf8"));
    installs.push(manifest.dependencies);
    for (const [name, specifier] of Object.entries(manifest.dependencies)) {
      const version = name === "@jopqior/pi-subagents" && specifier.startsWith("file:")
        ? "4.0.7" : name === "@jopqior/pi-subagents-model-selector"
          ? script.readJson(join(script.PACKAGE_ROOT, "package.json")).version : specifier;
      const packageDir = join(options.cwd, "node_modules", name);
      mkdirSync(join(packageDir, "src", "service"), { recursive: true });
      writeFileSync(join(packageDir, "package.json"), JSON.stringify({ name, version }));
      writeFileSync(join(packageDir, "src", "service", "service.ts"), "");
    }
    return { status: 0, stdout: "", stderr: "" };
  };
  syncBuiltinESMExports();
  const script = await import(${SCRIPT_URL});
`;

function runDriver(driver: string): void {
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", driver],
    {
      encoding: "utf8",
    },
  );
  expect(result.status, result.stderr).toBe(0);
}

const MATRIX_DRIVER = `
  import assert from "node:assert/strict";
  import childProcess from "node:child_process";
  import { syncBuiltinESMExports } from "node:module";
  import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
  import { join } from "node:path";
  const packs = new Map();
  const installs = [];
  const typechecks = [];
  childProcess.spawnSync = (command, args, options) => {
    let stdout = "";
    if (command === "pnpm" && args.includes("pack")) {
      const packageDir = args[1];
      const destination = args[args.indexOf("--pack-destination") + 1];
      const manifest = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
      const tarball = join(destination, "packed.tgz");
      packs.set(tarball, manifest);
      writeFileSync(tarball, "offline fixture");
    } else if (command === "tar") {
      const destination = args[args.indexOf("-C") + 1];
      mkdirSync(join(destination, "package"), { recursive: true });
      writeFileSync(join(destination, "package", "package.json"), JSON.stringify(packs.get(args[1])));
    } else if (command === "pnpm") {
      const manifest = JSON.parse(readFileSync(join(options.cwd, "package.json"), "utf8"));
      installs.push(manifest.dependencies);
      for (const [name, specifier] of Object.entries(manifest.dependencies)) {
        const installed = specifier.startsWith("file:")
          ? packs.get(specifier.slice(5)) : { name, version: specifier };
        const dir = join(options.cwd, "node_modules", name);
        mkdirSync(join(dir, "src", "service"), { recursive: true });
        writeFileSync(join(dir, "package.json"), JSON.stringify(installed));
        writeFileSync(join(dir, "src", "service", "service.ts"), "");
      }
    } else if (command === "node") {
      const entries = JSON.parse(args[1]);
      const core = entries.find((entry) => entry.includes("/pi-subagents/src/"));
      const selector = entries.find((entry) => entry.includes("/pi-subagents-model-selector/src/"));
      const hasCore = installs.at(-1)["@jopqior/pi-subagents"] !== undefined;
      const positive = core && entries[0] === core;
      const extensions = core ? [{ path: core, handlers: [] }] : [];
      if (positive) extensions.push({ path: selector, handlers: ["session_start", "session_shutdown"] });
      const errors = positive ? [] : [{ path: selector, error: hasCore
        ? "@jopqior/pi-subagents requires registerSpawnSelectionProvider"
        : "Cannot find module '@jopqior/pi-subagents'" }];
      stdout = "###RESULT_JSON###\\n" + JSON.stringify({ errors, extensions, canRegister: !!positive });
    } else {
      const config = JSON.parse(readFileSync(args[1], "utf8"));
      assert.equal(config.compilerOptions.paths, undefined);
      assert.equal(config.extends, undefined);
      assert.deepEqual(config.files, ["node_modules/@jopqior/pi-subagents-model-selector/src/index.ts"]);
      typechecks.push(options.cwd);
    }
    return { status: 0, stdout, stderr: "" };
  };
  syncBuiltinESMExports();
  const script = await import(${SCRIPT_URL});
`;

describe("packed compatibility orchestration", () => {
  it("verifies the actual local candidate alongside every historical row without aliases", () => {
    runDriver(`${MATRIX_DRIVER}
      await script.main();
      const cores = installs.filter((dependencies) => dependencies["@jopqior/pi-subagents"] !== undefined);
      assert.equal(cores.length, 6, "historical positives, packed candidate and negative consumer must all install");
      const [candidateTarball] = [...packs.entries()].find(([, manifest]) => manifest.name === "@jopqior/pi-subagents");
      assert.deepEqual(cores.map((dependencies) => dependencies["@jopqior/pi-subagents"]), [
        "1.0.0", "1.0.1", "1.0.2", "2.0.0",
        "file:" + candidateTarball,
        "2.0.0",
      ]);
      const candidate = cores[4];
      assert.equal(candidate["@earendil-works/pi-ai"], "1.0.0");
      assert.equal(candidate["@earendil-works/pi-coding-agent"], "1.0.0");
      assert.equal(candidate["@earendil-works/pi-tui"], "1.0.0");
      assert.equal(candidate.typebox, "1.3.27");
      assert.equal(typechecks.length, 5);
    `);
  });
});

describe("packed candidate consumer", () => {
  it("uses explicit Pi 1 host pins without changing historical defaults", () => {
    runDriver(`${OFFLINE_DRIVER}
      script.withDisposableRoot((root) => {
        const options = { selectorTarball: "/packed/selector.tgz", coreVersion: "4.0.7" };
        script.installConsumer(join(root, "candidate"), {
          ...options,
          hostPins: {
            "@earendil-works/pi-ai": "1.0.0",
            "@earendil-works/pi-coding-agent": "1.0.0",
            "@earendil-works/pi-tui": "1.0.0",
            "typebox": "1.3.27",
          },
        });
        script.installConsumer(join(root, "historical"), options);
        assert.deepEqual(installs, [
          {
            "@types/node": "^22.15.3",
            "@earendil-works/pi-ai": "1.0.0",
            "@earendil-works/pi-coding-agent": "1.0.0",
            "@earendil-works/pi-tui": "1.0.0",
            "typebox": "1.3.27",
            "@jopqior/pi-subagents": "4.0.7",
            "@jopqior/pi-subagents-model-selector": "file:/packed/selector.tgz",
          },
          {
            "@types/node": "^22.15.3",
            "@earendil-works/pi-ai": "0.84.4",
            "@earendil-works/pi-coding-agent": "0.84.4",
            "@earendil-works/pi-tui": "0.84.4",
            "@jopqior/pi-subagents": "4.0.7",
            "@jopqior/pi-subagents-model-selector": "file:/packed/selector.tgz",
          },
        ]);
      });
    `);
  });

  it("separates the tarball install specifier from the manifest identity and version", () => {
    runDriver(`${OFFLINE_DRIVER}
      script.withDisposableRoot((root) => {
        script.installConsumer(join(root, "candidate"), {
          selectorTarball: "/packed/selector.tgz",
          coreVersion: "4.0.7",
          coreSpecifier: "file:/packed/core.tgz",
          coreName: "@jopqior/pi-subagents",
        });
        assert.equal(installs[0]["@jopqior/pi-subagents"], "file:/packed/core.tgz");
      });
    `);
  });
});
