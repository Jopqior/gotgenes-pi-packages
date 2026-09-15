import { createJsonSafeReplacer } from "./json-safe-stringify";

/**
 * Key-name redaction for the permission logs.
 *
 * The technique is deliberately structural rather than predictive: a value is
 * masked because of the *name* it is bound to, never because of what it looks
 * like. Value-shape secret detection (provider prefixes, entropy heuristics)
 * was measured against a real 6.7 MB review log and declined — see
 * `docs/decisions/0010-permission-log-secret-exposure.md`.
 *
 * The boundary that follows from this, stated once: a value bound to a
 * sensitive key name is masked; a secret embedded in a bash command string is
 * not, because a command string has no keys.
 */

export const REDACTED_PLACEHOLDER = "[redacted]";

const SENSITIVE_NAME_PATTERN =
  /authorization|api[-_]?key|secret|token|password|passwd|credential|cookie|private[-_]?key/i;

/** True when a name binds a credential-bearing value. */
export function isSensitiveName(name: string): boolean {
  return SENSITIVE_NAME_PATTERN.test(name);
}

/**
 * `safeJsonStringify` with sensitive-keyed values masked.
 *
 * Masking runs inside the replacer, so the structure beneath a sensitive key
 * is never visited and the traversal's existing cycle guard is reused — one
 * walk, not two. A `null` or `undefined` value is left alone so an absent
 * field does not read as a suppressed one.
 */
export function redactedJsonStringify(value: unknown): string | undefined {
  return JSON.stringify(
    value,
    createJsonSafeReplacer((key, currentValue) =>
      currentValue != null && isSensitiveName(key)
        ? REDACTED_PLACEHOLDER
        : currentValue,
    ),
  );
}
