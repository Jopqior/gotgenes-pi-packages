import type { Model } from "@earendil-works/pi-ai";
import { describe, expect, it, vi } from "vitest";
import type { SpawnSelection } from "#src/service/service";
import type { ModelRegistry } from "#src/session/model-resolver";
import { readSelectionChoices, validateSpawnSelection } from "#src/session/selection-catalogue";
import { makeModel } from "#test/helpers/make-model";

const sonnet = makeModel({ id: "claude-sonnet", name: "Claude Sonnet" });
const haiku = makeModel({ id: "claude-haiku", name: "Claude Haiku" });
const reasoningModel = makeModel({
	id: "reasoning-model",
	name: "Reasoning Model",
	reasoning: true,
});

/** A registry whose authenticated availability is exactly `models`. */
function makeRegistry(models: Model<any>[]): ModelRegistry {
	return {
		find: (provider, id) => models.find((m) => m.provider === provider && m.id === id),
		getAll: () => models,
		getAvailable: () => models,
	};
}

/** A registry with `getAll` populated but no availability support at all. */
function registryWithoutAvailability(models: Model<any>[]): ModelRegistry {
	return {
		find: (provider, id) => models.find((m) => m.provider === provider && m.id === id),
		getAll: () => models,
	};
}

/** The default pair a satisfied provider resolves with. */
function selection(model: Model<any>, thinkingLevel: string): SpawnSelection {
	return { model, thinkingLevel: thinkingLevel as SpawnSelection["thinkingLevel"] };
}

describe("readSelectionChoices — the authenticated catalogue", () => {
	it("lists exactly the registry's authenticated available models", () => {
		const registry = makeRegistry([sonnet, haiku]);

		const choices = readSelectionChoices(registry);

		expect(choices).toEqual([sonnet, haiku]);
	});

	it("errors when the registry does not support availability — getAll cannot substitute", () => {
		// A populated getAll must not allow a gated spawn: the choices a human
		// picks from are the authenticated ones or none.
		const registry = registryWithoutAvailability([sonnet, haiku]);

		expect(() => readSelectionChoices(registry)).toThrow(/getAvailable/);
	});

	it("errors when availability is empty", () => {
		const registry = makeRegistry([]);

		expect(() => readSelectionChoices(registry)).toThrow(/no .*models.*available/i);
	});
});

describe("validateSpawnSelection — the provider's result", () => {
	it("accepts a valid pair and canonicalizes the model to the catalogue entry", async () => {
		const registry = makeRegistry([sonnet, haiku]);
		// A forged look-alike: same identity, not the registry's object.
		const forged = makeModel({ id: sonnet.id, name: "Forged Sonnet" });

		const validated = await validateSpawnSelection(
			selection(forged, "off"),
			[sonnet, haiku],
			registry,
		);

		expect(validated.model).toBe(sonnet);
		expect(validated.thinkingLevel).toBe("off");
	});

	it("rejects a model absent from the catalogue snapshot", async () => {
		const registry = makeRegistry([sonnet]);
		const stranger = makeModel({ id: "claude-opus" });

		await expect(
			validateSpawnSelection(selection(stranger, "off"), [sonnet], registry),
		).rejects.toThrow(/not in the available catalogue/i);
	});

	it("rejects a model that left availability while the dialog was open", async () => {
		const before = [sonnet, haiku];
		// The registry changed: only haiku is still available.
		const registry = makeRegistry([haiku]);

		await expect(
			validateSpawnSelection(selection(sonnet, "off"), before, registry),
		).rejects.toThrow(/no longer available/i);
	});

	it("rejects a result whose thinking level is omitted", async () => {
		const registry = makeRegistry([sonnet]);
		const forged = { model: sonnet, thinkingLevel: undefined } as unknown as SpawnSelection;

		await expect(validateSpawnSelection(forged, [sonnet], registry)).rejects.toThrow(
			/thinking/i,
		);
	});

	it("rejects a thinking level the selected model does not support", async () => {
		// sonnet is non-reasoning: its only supported level is `off`.
		const registry = makeRegistry([sonnet]);

		await expect(
			validateSpawnSelection(selection(sonnet, "high"), [sonnet], registry),
		).rejects.toThrow(/does not support/i);
	});

	it("rejects a level the model's mapping excludes", async () => {
		const mapped = makeModel({
			id: "mapped-model",
			reasoning: true,
			thinkingLevelMap: { minimal: null },
		});
		const registry = makeRegistry([mapped]);

		await expect(
			validateSpawnSelection(selection(mapped, "minimal"), [mapped], registry),
		).rejects.toThrow(/does not support/i);
	});

	it("accepts every level a reasoning model with no mapping holes supports", async () => {
		const registry = makeRegistry([reasoningModel]);

		const validated = await validateSpawnSelection(
			selection(reasoningModel, "high"),
			[reasoningModel],
			registry,
		);

		expect(validated.thinkingLevel).toBe("high");
	});
});

describe("validateSpawnSelection — supported-level capability", () => {
	it("denies gated execution when the pi-ai helper is unavailable on the peer", async () => {
		vi.resetModules();
		vi.doMock("@earendil-works/pi-ai", async () => {
			const actual =
				await vi.importActual<typeof import("@earendil-works/pi-ai")>("@earendil-works/pi-ai");
			const withoutHelper = { ...actual } as Record<string, unknown>;
			delete withoutHelper.getSupportedThinkingLevels;
			return withoutHelper;
		});

		try {
			const { validateSpawnSelection: freshValidate } = await import(
				"#src/session/selection-catalogue"
			);
			const registry = makeRegistry([sonnet]);

			await expect(freshValidate(selection(sonnet, "off"), [sonnet], registry)).rejects.toThrow(
				/getSupportedThinkingLevels/,
			);
		} finally {
			vi.doUnmock("@earendil-works/pi-ai");
			vi.resetModules();
		}
	});
});
