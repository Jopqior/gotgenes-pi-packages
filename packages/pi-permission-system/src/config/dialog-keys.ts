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
