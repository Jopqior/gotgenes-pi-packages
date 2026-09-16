import { Key, type KeyId, matchesKey } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";
import {
  BINDABLE_DIALOG_KEY_CHARACTERS,
  isBindableDialogKey,
} from "#src/config/dialog-keys";

/**
 * pi-tui's symbol vocabulary, read from the dependency rather than remembered.
 *
 * `Key` enumerates every special and symbol key as a runtime value; the
 * single-character ones are exactly its symbols, since every special key's
 * name (`escape`, `f1`, `pageUp`) is longer than one character.
 */
function piTuiSymbolKeys(): string[] {
  const values: unknown[] = Object.values(Key);
  return values.filter(
    (value): value is string => typeof value === "string" && value.length === 1,
  );
}

describe("BINDABLE_DIALOG_KEY_CHARACTERS", () => {
  it("admits every lowercase letter and digit", () => {
    for (const character of "abcdefghijklmnopqrstuvwxyz0123456789") {
      expect(BINDABLE_DIALOG_KEY_CHARACTERS.has(character)).toBe(true);
    }
  });

  it("admits exactly pi-tui's symbol keys, minus the one its matcher cannot see", () => {
    const symbols = piTuiSymbolKeys();
    // Guard the derivation itself: an empty list would make the claim vacuous.
    expect(symbols.length).toBeGreaterThan(20);
    const admitted = symbols.filter((symbol) =>
      BINDABLE_DIALOG_KEY_CHARACTERS.has(symbol),
    );
    expect(admitted).toEqual(symbols.filter((symbol) => symbol !== "+"));
  });

  it("excludes `+` because pi-tui reads it as a modifier separator", () => {
    // `parseKeyId` splits the identifier on `+`, leaving no key name behind, so
    // a `+` binding would match nothing at all.
    expect(matchesKey("+", "+")).toBe(false);
    expect(BINDABLE_DIALOG_KEY_CHARACTERS.has("+")).toBe(false);
  });

  it("holds only characters pi-tui's matcher accepts", () => {
    for (const character of BINDABLE_DIALOG_KEY_CHARACTERS) {
      // A bindable character is by definition a `KeyId`; the cast is what the
      // assertion is proving.
      expect(matchesKey(character, character as KeyId)).toBe(true);
    }
  });
});

describe("isBindableDialogKey", () => {
  it.each([
    ["a digit", "1"],
    ["a letter", "q"],
    ["a symbol", "/"],
  ])("accepts %s", (_name, value) => {
    expect(isBindableDialogKey(value)).toBe(true);
  });

  it.each([
    ["the empty string", ""],
    ["two characters", "yy"],
    ["an uppercase letter", "A"],
    ["a non-ASCII character", "é"],
    ["the modifier separator", "+"],
    ["a named key", "escape"],
    ["a modifier combination", "ctrl+g"],
    ["a space", " "],
  ])("rejects %s", (_name, value) => {
    expect(isBindableDialogKey(value)).toBe(false);
  });
});
