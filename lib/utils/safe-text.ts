/** Trim any value safely — never throws on null/undefined/non-string. */
export function trimText(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

/** Coerce unknown values to a string safe for TextInput. */
export function toSafeText(value: unknown): string {
  return trimText(value);
}

/** True when trimmed text is non-empty. */
export function hasText(value: unknown): boolean {
  return trimText(value).length > 0;
}
