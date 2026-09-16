/**
 * The inline permission dialog's key bindings, and the defaults they start from.
 *
 * The action ids are the `permissionDialogKeys` config keys, so the config
 * surface and the decision model speak one vocabulary rather than two that a
 * translation layer has to keep in step.
 */

/**
 * The dialog's five decisions, named by what they do.
 *
 * Distinct from the character that selects one: a binding is configurable and
 * an identity is not, so a rebound dialog still decides the same five things.
 */
export type PromptAction =
  | "approve"
  | "approveSession"
  | "approveSessionBoth"
  | "deny"
  | "denyWithReason";

/** Every action's bound character, complete. */
export type DialogKeyBindings = Readonly<Record<PromptAction, string>>;

/** What a config file may say: any subset of the actions. */
export type DialogKeyOverrides = Partial<Record<PromptAction, string>>;

/** The shipped bindings, unchanged since the dialog was introduced. */
export const DEFAULT_DIALOG_KEYS: DialogKeyBindings = {
  approve: "y",
  approveSession: "s",
  approveSessionBoth: "b",
  deny: "n",
  denyWithReason: "r",
};

const LOWERCASE_LETTERS = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";

/**
 * pi-tui's symbol keys, minus `+`.
 *
 * `+` separates a modifier from its key in a key identifier, so pi-tui's
 * parser splits `"+"` into two empty halves and the binding matches nothing.
 * A parity test in `test/config/dialog-keys.test.ts` derives this roster from
 * pi-tui's exported `Key` constant and fails if the two drift; keeping the
 * literal here is what lets this module stay free of SDK imports.
 */
const SYMBOLS = "`-=[]\\;',./!@#$%^&*()_|~{}:<>?";

/**
 * Every character a decision may be bound to.
 *
 * Uppercase is excluded deliberately rather than normalized: pi-tui lowercases
 * a key identifier, so a `"Y"` binding would answer to a lowercase `y` and
 * never to the keystroke the user asked for.
 */
export const BINDABLE_DIALOG_KEY_CHARACTERS: ReadonlySet<string> = new Set(
  Array.from(LOWERCASE_LETTERS + DIGITS + SYMBOLS),
);

/** Whether `value` is a single character the dialog can bind a decision to. */
export function isBindableDialogKey(value: string): boolean {
  return BINDABLE_DIALOG_KEY_CHARACTERS.has(value);
}
