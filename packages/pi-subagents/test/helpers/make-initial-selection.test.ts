import { describe, expect, it } from "vitest";
import type { InitialSelection } from "#src/lifecycle/initial-spawn-selection";
import { makeInitialSelection } from "#test/helpers/make-initial-selection";
import { makeModel } from "#test/helpers/make-model";

describe("makeInitialSelection", () => {
	it("provides typed passive pending and pair facts without pretending to run", () => {
		const pair = { model: makeModel({ id: "selected" }), thinkingLevel: "high" as const };
		const selection: InitialSelection = makeInitialSelection({ awaitingSelection: true, selectedPair: pair });
		expect(selection.awaitingSelection).toBe(true);
		expect(selection.selectedPair).toBe(pair);
		expect(() => selection.begin(new AbortController().signal)).toThrow("Passive selection fixture cannot start a run");
		expect(() => selection.wait(undefined, () => {})).toThrow("Passive selection fixture cannot wait for startup");
		expect(() => selection.cancelUnfinished(() => {})).toThrow("Passive selection fixture cannot cancel startup");
		expect(() => selection.finished({ stopped: true, error: undefined })).toThrow("Passive selection fixture cannot finish a run");
	});
});
