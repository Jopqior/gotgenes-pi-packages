/**
 * construction-inheritance.test.ts — the real-loader initialization pins.
 *
 * Proves, against the real SDK `DefaultResourceLoader` and the real core
 * extension factory, that the construction wrapper's context reaches a child
 * core factory during `loader.reload()` — the moment Pi jiti-loads and
 * initializes child extensions. A session-ID registry or a `session_start`
 * capture cannot supply this: factories run before either exists.
 *
 * No network: the loader's settings are empty in-memory ones, every extension
 * source is a local absolute path, and `PI_OFFLINE=1` turns any accidental
 * install attempt into a refusal rather than a fetch.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  DefaultResourceLoader,
  SettingsManager as SdkSettingsManager,
} from "@earendil-works/pi-coding-agent";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Test-only injection point for the session deps. The production composition
 * (index.ts) is exercised for real — including its construction wrapper — so
 * the factory mock delegates to the actual implementation with these deps
 * substituted, the way the composition root's own io seam would carry them.
 */
const injected = vi.hoisted(() => ({ deps: undefined as import("#src/lifecycle/create-subagent-session").SubagentSessionDeps | undefined }));

vi.mock("#src/lifecycle/create-subagent-session", async () => {
  const actual =
    await vi.importActual<typeof import("#src/lifecycle/create-subagent-session")>(
      "#src/lifecycle/create-subagent-session",
    );
  return {
    ...actual,
    createSubagentSession: (
      params: import("#src/lifecycle/create-subagent-session").CreateSubagentSessionParams,
      deps: import("#src/lifecycle/create-subagent-session").SubagentSessionDeps,
    ) => actual.createSubagentSession(params, injected.deps ?? deps),
  };
});

import subagentsExtension from "#src/index";
import {
  createSubagentSession,
  type ResourceLoaderOptions,
  type SubagentSessionDeps,
} from "#src/lifecycle/create-subagent-session";
import { captureInheritedSelectionScope } from "#src/lifecycle/selection-scope";
import { SpawnSelectionScope } from "#src/lifecycle/spawn-selection";
import {
  getSubagentsService,
  publishSubagentsService,
  unpublishSubagentsService,
} from "#src/service/service";
import { makeModel } from "#test/helpers/make-model";
import { STUB_SNAPSHOT } from "#test/helpers/stub-ctx";
import {
  createFactorySession,
  createSubagentSessionDeps,
  createSubagentSessionIO,
} from "#test/helpers/subagent-session-io";

/** The real core package — its `pi.extensions` manifest points the loader at src/index.ts. */
const CORE_PACKAGE_DIR = join(import.meta.dirname, "..", "..");

/** globalThis channel the jiti-loaded fixture and this test share (Symbol.for, like the carrier itself). */
const RECORD_KEY = Symbol.for("pi-subagents-test:construction-scope-record");
const CHOOSER_KIND_KEY = Symbol.for("pi-subagents-test:chooser-kind-record");

/** What the fixture pushed per initialization: a rootId, or "<none>" when no context was ambient. */
const recordedScopeIds: string[] = [];
/** Registration kind recorded by the child-loaded chooser stub, or "no-service". */
const chooserKinds: string[] = [];

/** A tiny extension that records the ambient construction handle at factory initialization. */
function writeScopeObserverFixture(dir: string): string {
  const fixturePath = join(dir, "scope-observer-fixture.ts");
  const source = [
    `import { captureInheritedSelectionScope } from "${join(CORE_PACKAGE_DIR, "src", "lifecycle", "selection-scope.ts")}";`,
    `const record: string[] = (globalThis as Record<symbol, string[]>)[Symbol.for("pi-subagents-test:construction-scope-record")];`,
    `export default function () {`,
    `  const captured = captureInheritedSelectionScope();`,
    `  record.push(captured ? captured.rootId : "<none>");`,
    `}`,
  ].join("\n");
  writeFileSync(fixturePath, source, "utf8");
  return fixturePath;
}

/** A companion-shaped stub: registers at init and records the kind it received. */
function writeChooserStubFixture(dir: string): string {
  const fixturePath = join(dir, "chooser-stub-fixture.ts");
  const source = [
    `import { getSubagentsService } from "${join(CORE_PACKAGE_DIR, "src", "service", "service.ts")}";`,
    `const record: string[] = (globalThis as Record<symbol, string[]>)[Symbol.for("pi-subagents-test:chooser-kind-record")];`,
    `export default function () {`,
    `  const service = getSubagentsService();`,
    `  if (typeof service?.registerSpawnSelectionProvider !== "function") {`,
    `    record.push("no-service");`,
    `    return;`,
    `  }`,
    `  const registration = service.registerSpawnSelectionProvider({ select: async () => undefined });`,
    `  record.push(registration.kind);`,
    `}`,
  ].join("\n");
  writeFileSync(fixturePath, source, "utf8");
  return fixturePath;
}

/** A minimal pi API surface, matching the composition-root tests' fixture. */
function makePi() {
  const handlers = new Map<string, Array<(event: unknown, ctx: unknown) => unknown>>();
  return {
    pi: {
      registerMessageRenderer: vi.fn(),
      registerTool: vi.fn(),
      registerCommand: vi.fn(),
      on: vi.fn((event: string, handler: (event: unknown, ctx: unknown) => unknown) => {
        const registered = handlers.get(event);
        if (registered) registered.push(handler);
        else handlers.set(event, [handler]);
      }),
      events: { emit: vi.fn(), on: vi.fn(() => vi.fn()) },
      appendEntry: vi.fn(),
      sendMessage: vi.fn(),
      exec: vi.fn(),
    } as never as Parameters<typeof subagentsExtension>[0],
    fire: async (event: string, ...args: unknown[]) => {
      for (const handler of handlers.get(event) ?? []) {
        await handler(...(args as [unknown, unknown]));
      }
    },
  };
}

/** The session context Pi hands a session_start handler. */
function makeSessionStartCtx(models: ReturnType<typeof makeModel>[] = []) {
  return {
    hasUI: false,
    ui: { setStatus: vi.fn(), setWidget: vi.fn() },
    cwd: "/tmp",
    model: models[0],
    modelRegistry: {
      find: (provider: string, id: string) =>
        models.find((model) => model.provider === provider && model.id === id),
      getAll: () => models,
      getAvailable: () => models,
    },
    sessionManager: {
      getSessionId: vi.fn(() => "root-session"),
      getSessionFile: vi.fn(() => "/sessions/root.jsonl"),
      getBranch: vi.fn(() => []),
    },
    getSystemPrompt: vi.fn(() => "parent prompt"),
  };
}

describe("construction inheritance through the real resource loader", () => {
  let tempDirs: string[] = [];
  let previouslyPublished: ReturnType<typeof getSubagentsService>;
  let root: SpawnSelectionScope | undefined;

  beforeEach(() => {
    // Refuse package installation rather than reaching the network. Every
    // source below is a local absolute path, so nothing should try.
    vi.stubEnv("PI_OFFLINE", "1");
    recordedScopeIds.length = 0;
    chooserKinds.length = 0;
    (globalThis as Record<symbol, unknown>)[RECORD_KEY] = recordedScopeIds;
    (globalThis as Record<symbol, unknown>)[CHOOSER_KIND_KEY] = chooserKinds;
    previouslyPublished = getSubagentsService();
    unpublishSubagentsService();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    root?.revoke();
    root = undefined;
    injected.deps = undefined;
    // Restore the service this file's children overwrote on globalThis.
    if (previouslyPublished) publishSubagentsService(previouslyPublished);
    else unpublishSubagentsService();
    for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
    tempDirs = [];
  });

  function makeTempRoots(): { tempCwd: string; tempAgentDir: string; fixturePath: string } {
    const tempCwd = mkdtempSync(join(tmpdir(), "pi-sel-cwd-"));
    const tempAgentDir = mkdtempSync(join(tmpdir(), "pi-sel-agent-"));
    tempDirs.push(tempCwd, tempAgentDir);
    return { tempCwd, tempAgentDir, fixturePath: writeScopeObserverFixture(tempAgentDir) };
  }

  /** Build the deps bag whose loader is the real SDK one, limited to local test sources. */
  function makeRealLoaderDeps(
    fixturePath: string,
    tempCwd: string,
    tempAgentDir: string,
    extraExtensionPaths: string[] = [],
  ): SubagentSessionDeps {
    const io = createSubagentSessionIO();
    io.getAgentDir.mockReturnValue(tempAgentDir);
    io.deriveSessionDir.mockReturnValue(join(tempCwd, "tasks"));
    io.createLoaderSettingsManager.mockImplementation(() => SdkSettingsManager.inMemory());
    // The production ResourceLoaderOptions stay untouched: the test-only
    // additionalExtensionPaths live in this adapter's closure, exactly the
    // seam the composition root exposes.
    io.createResourceLoader.mockImplementation(
      (opts: ResourceLoaderOptions) =>
        new DefaultResourceLoader({
          ...opts,
          additionalExtensionPaths: [CORE_PACKAGE_DIR, ...extraExtensionPaths, fixturePath],
        }),
    );
    // The session IO seam injected after loading: factories have already run
    // inside loader.reload(), and the stub session never prompts a provider
    // or opens a transport.
    io.createSession.mockResolvedValue({ session: createFactorySession() });
    return createSubagentSessionDeps({ io });
  }

  it("runs child factories inside the construction context, so the core captures the inherited scope", { timeout: 120_000 }, async () => {
    const { tempCwd, tempAgentDir, fixturePath } = makeTempRoots();
    const deps = makeRealLoaderDeps(fixturePath, tempCwd, tempAgentDir);

    root = new SpawnSelectionScope();
    // Deliberately unconfigured: the construction wrapper is unconditional,
    // so inheritance must not depend on a provider being registered.
    expect(root.state).toBe("unconfigured");

    const child = await root.constructChild(() =>
      createSubagentSession({ snapshot: STUB_SNAPSHOT, type: "Explore", cwd: tempCwd }, deps),
    );

    // The fixture initialized inside the context and recorded the root's identity.
    expect(recordedScopeIds).toHaveLength(1);
    expect(recordedScopeIds[0]).toBe(root.rootId);

    // The real core factory ran too — it published the child's service.
    const childService = getSubagentsService();
    expect(childService).toBeDefined();
    expect(childService).not.toBe(previouslyPublished);

    // And the child core captured the inherited handle at initialization:
    // registering on the child is denied with `inherited`, never `owned`,
    // even though the root never configured a provider.
    const registration = childService!.registerSpawnSelectionProvider({
      select: async () => undefined,
    });
    expect(registration.kind).toBe("inherited");

    // The same loader path with the same cwd reuses the cached factory
    // modules — and still re-runs the factories, so a second child captures
    // a handle of the same root through the shared carrier.
    await root.constructChild(() =>
      createSubagentSession({ snapshot: STUB_SNAPSHOT, type: "Explore", cwd: tempCwd }, deps),
    );
    expect(recordedScopeIds).toHaveLength(2);
    expect(recordedScopeIds[1]).toBe(root.rootId);

    await child.dispose();
  });

  it("wires the wrapper into the production spawn path unconditionally", { timeout: 120_000 }, async () => {
    const { tempCwd, tempAgentDir, fixturePath } = makeTempRoots();
    injected.deps = makeRealLoaderDeps(fixturePath, tempCwd, tempAgentDir);

    const { pi, fire } = makePi();
    subagentsExtension(pi);
    await fire("session_start", {}, makeSessionStartCtx());

    const rootService = getSubagentsService()!;
    // The root session never registers a provider — this is the unconfigured
    // case the wrapper's conditionality would break.
    rootService.spawn("general-purpose", "run", { description: "child" });

    // The spawn went through the root manager's factory lambda: its wrapper
    // established the context the child core factories initialized inside.
    await vi.waitFor(() => {
      expect(recordedScopeIds).toHaveLength(1);
    });
    expect(recordedScopeIds[0]).not.toBe("<none>");

    await vi.waitFor(() => {
      expect(getSubagentsService()).not.toBe(rootService);
    });
    // The child core published its own service; registering on it must be
    // denied with `inherited` — only the wrapper's unconditional context
    // makes the child a descendant rather than a fresh root.
    const registration = getSubagentsService()!.registerSpawnSelectionProvider({
      select: async () => undefined,
    });
    expect(registration.kind).toBe("inherited");

    await fire("session_shutdown", {}, {});
  });

  it("nests: a grandchild factory captures the same root through the child's construction handle", { timeout: 120_000 }, async () => {
    const { tempCwd, tempAgentDir, fixturePath } = makeTempRoots();
    const deps = makeRealLoaderDeps(fixturePath, tempCwd, tempAgentDir);

    root = new SpawnSelectionScope();
    const childHandle = await root.constructChild(async () => captureInheritedSelectionScope());
    const grandchild = await childHandle!.constructChild(() =>
      createSubagentSession({ snapshot: STUB_SNAPSHOT, type: "Explore", cwd: tempCwd }, deps),
    );

    expect(recordedScopeIds).toEqual([root.rootId]);
    const grandchildService = getSubagentsService();
    expect(
      grandchildService!.registerSpawnSelectionProvider({ select: async () => undefined }).kind,
    ).toBe("inherited");

    await grandchild.dispose();
  });

  it("loads a chooser in one descendant and excludes it from another without replacing the root", { timeout: 120_000 }, async () => {
    const { tempCwd, tempAgentDir, fixturePath } = makeTempRoots();
    const chooserPath = writeChooserStubFixture(tempAgentDir);
    root = new SpawnSelectionScope();
    const rootProvider = { select: vi.fn() };
    root.register(rootProvider);

    const withChooser = makeRealLoaderDeps(fixturePath, tempCwd, tempAgentDir, [chooserPath]);
    await root.constructChild(() =>
      createSubagentSession({ snapshot: STUB_SNAPSHOT, type: "Explore", cwd: tempCwd }, withChooser),
    );
    expect(chooserKinds).toEqual(["inherited"]);
    expect(root.activeProvider).toBe(rootProvider);

    const withoutChooser = makeRealLoaderDeps(fixturePath, tempCwd, tempAgentDir);
    await root.constructChild(() =>
      createSubagentSession({ snapshot: STUB_SNAPSHOT, type: "Explore", cwd: tempCwd }, withoutChooser),
    );
    // The excluded descendant never ran the chooser, and the loaded one did not take ownership.
    expect(chooserKinds).toEqual(["inherited"]);
    expect(recordedScopeIds).toEqual([root.rootId, root.rootId]);
    expect(root.state).toBe("active");
    expect(root.activeProvider).toBe(rootProvider);
  });

  it("keeps the production spawn path's child-loaded chooser inherited after a gated selection", { timeout: 120_000 }, async () => {
    const { tempCwd, tempAgentDir, fixturePath } = makeTempRoots();
    const chooserPath = writeChooserStubFixture(tempAgentDir);
    injected.deps = makeRealLoaderDeps(fixturePath, tempCwd, tempAgentDir, [chooserPath]);

    const sonnet = makeModel({ id: "claude-sonnet" });
    const { pi, fire } = makePi();
    subagentsExtension(pi);
    await fire("session_start", {}, makeSessionStartCtx([sonnet]));

    const rootService = getSubagentsService()!;
    const registration = rootService.registerSpawnSelectionProvider({
      select: async () => ({ model: sonnet, thinkingLevel: "off" }),
    });
    expect(registration.kind).toBe("owned");

    rootService.spawn("general-purpose", "run", { description: "child" });
    await vi.waitFor(() => {
      expect(chooserKinds).toEqual(["inherited"]);
    });
    expect(recordedScopeIds).toHaveLength(1);
    expect(recordedScopeIds[0]).not.toBe("<none>");

    await fire("session_shutdown", {}, {});
  });
});
