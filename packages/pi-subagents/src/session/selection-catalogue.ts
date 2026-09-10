/**
 * selection-catalogue.ts — Authenticated choices and validation for per-spawn selection.
 *
 * The selection path's own view of the spawning parent's model registry: it
 * reads only authenticated availability (`getAvailable()`, never a `getAll()`
 * fallback — a model the session cannot authenticate is not a choice a human
 * can be offered), snapshots the choices for the duration of one selection,
 * and validates the provider's answer against that snapshot plus a fresh
 * availability read before the pair reaches the child factory.
 */

import type { Model } from "@earendil-works/pi-ai";
import { parseThinkingLevel, type SubagentThinkingLevel } from "#src/config/thinking-level";
import type { SpawnSelection } from "#src/service/service";
import type { ModelRegistry } from "#src/session/model-resolver";

/** The validated pair a gated run carries into the factory. */
export interface ValidatedSpawnSelection {
	/** The catalogue's own model object, canonicalized from the provider's answer. */
	model: Model<any>;
	/** A level the selected model supports — mandatory, never defaulted. */
	thinkingLevel: SubagentThinkingLevel;
}

/**
 * Read the authenticated choices for one selection.
 *
 * Missing availability support or an empty catalogue is an error, not a
 * fallback: the ordinary resolver's `getAll()` fallback serves a different
 * constituency (silent inheritance), and a gated run must not offer models the
 * session cannot authenticate.
 */
export function readSelectionChoices(registry: ModelRegistry): Model<any>[] {
	const available = registry.getAvailable?.();
	if (available === undefined) {
		throw new Error(
			"The model registry does not expose authenticated availability (getAvailable); a model selection cannot be offered.",
		);
	}
	if (available.length === 0) {
		throw new Error("No authenticated models are available to select from.");
	}
	return available;
}

/**
 * Validate the provider's answer for one selection: the model must be in the
 * snapshot (canonicalized to the catalogue's own object) and still available
 * now, and the thinking level must be one the selected model supports.
 *
 * Anything else — an unknown model, a level the model rejects, an omitted
 * level, a forged result — rejects rather than clamping or defaulting.
 */
export async function validateSpawnSelection(
	selection: SpawnSelection,
	choices: readonly Model<any>[],
	registry: ModelRegistry,
): Promise<ValidatedSpawnSelection> {
	const model = canonicalizeModel(selection.model, choices);
	revalidateAvailability(model, registry);
	const thinkingLevel = await validateThinkingLevel(selection.thinkingLevel, model);
	return { model, thinkingLevel };
}

/** The signature of pi-ai's supported-level helper, feature-detected at use. */
type SupportedLevelsHelper = (model: Model<any>) => string[];

/** Memoized feature detection of the supported-level helper on the installed peer. */
let supportedLevelsLoader: Promise<SupportedLevelsHelper | undefined> | undefined;

/**
 * Resolve pi-ai's `getSupportedThinkingLevels` through the package namespace.
 *
 * The core's peer floor predates the helper, so an unconditional named import
 * would be unavailable on an older supported peer; absence denies only gated
 * execution (the caller reports an error) and never the ordinary path.
 */
function loadSupportedLevelsHelper(): Promise<SupportedLevelsHelper | undefined> {
	supportedLevelsLoader ??= import("@earendil-works/pi-ai").then((ns) => {
		const helper = (ns as Record<string, unknown>).getSupportedThinkingLevels;
		return typeof helper === "function" ? (helper as SupportedLevelsHelper) : undefined;
	});
	return supportedLevelsLoader;
}

/** Canonicalize the answered model to the catalogue entry with that identity. */
function canonicalizeModel(model: unknown, choices: readonly Model<any>[]): Model<any> {
	const identity = modelIdentity(model);
	const found = choices.find(
		(candidate) => candidate.provider === identity.provider && candidate.id === identity.id,
	);
	if (!found) {
		throw new Error(
			`Selected model is not in the available catalogue: "${identity.provider}/${identity.id}".`,
		);
	}
	return found;
}

/** Extract a provider/id identity, rejecting answers that do not name a model. */
function modelIdentity(model: unknown): { provider: string; id: string } {
	if (typeof model !== "object" || model === null) {
		throw new Error("The selection did not name a model.");
	}
	const { provider, id } = model as { provider?: unknown; id?: unknown };
	if (typeof provider !== "string" || typeof id !== "string") {
		throw new Error("The selection did not name a model.");
	}
	return { provider, id };
}

/** Re-read availability and confirm the chosen model is still one of the choices. */
function revalidateAvailability(model: Model<any>, registry: ModelRegistry): void {
	const fresh = registry.getAvailable?.();
	if (!fresh?.some((candidate) => candidate.provider === model.provider && candidate.id === model.id)) {
		throw new Error(`Selected model "${model.provider}/${model.id}" is no longer available.`);
	}
}

/** Validate the answered level against the vocabulary and the selected model. */
async function validateThinkingLevel(
	level: unknown,
	model: Model<any>,
): Promise<SubagentThinkingLevel> {
	const parsed = parseThinkingLevel(level);
	if (parsed === undefined) {
		throw new Error(
			`The selection did not include a valid thinking level: ${typeof level === "string" ? `"${level}"` : String(level)}.`,
		);
	}
	const supported = await loadSupportedLevelsHelper();
	if (supported === undefined) {
		throw new Error(
			"pi-ai's getSupportedThinkingLevels is unavailable on the installed peer; the selected thinking level cannot be validated.",
		);
	}
	if (!supported(model).includes(parsed)) {
		throw new Error(
			`Model "${model.provider}/${model.id}" does not support thinking level "${parsed}".`,
		);
	}
	return parsed;
}
