import { apiConfig } from "@/lib/config";

/**
 * A path on GeekAPI, or an absolute address on its origin, as a URL. Any other origin is refused: the
 * signed-in person's token is sent only to GeekAPI.
 */
export function apiUrl(target: string | URL): URL {
  const base = new URL(apiConfig.baseUrl);
  const url = typeof target === "string" && target.startsWith("/") ? new URL(target, base) : new URL(target);
  if (url.origin !== base.origin) {
    throw new Error(`The sign-in is only sent to ${base.origin}, but the request was for ${url.origin}.`);
  }
  return url;
}
