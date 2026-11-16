/**
 * Where to send a person after sign-in: a path inside this app, or "/".
 *
 * The value arrives in a query string, so it is untrusted. Only a single-slash local path is kept; an
 * absolute address, a protocol-relative "//host", a backslash form, a control character, or a path
 * back into the sign-in routes (which would loop) all become "/".
 */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || value.length > 2048) return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return "/";
  }
  if (value === "/api/auth" || value.startsWith("/api/auth/")) return "/";
  return value;
}
