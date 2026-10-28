/** Accept only same-origin application paths for post-authentication navigation. */
export function safeReturnTo(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  const path = value.split(/[?#]/, 1)[0];
  if (path === "/signin" || path === "/signup") return fallback;
  return value;
}
