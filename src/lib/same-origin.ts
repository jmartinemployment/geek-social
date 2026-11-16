const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Whether a request that changes something came from this app's own pages.
 *
 * The session cookie is SameSite=Lax, which already keeps a browser from sending it on another site's
 * form post or fetch. This is the second check, made on the request itself: a write must carry this
 * app's origin in `Origin`, or `Sec-Fetch-Site: same-origin` when the browser sent no Origin. A write
 * with neither is refused, so a request that hides where it came from is not given the benefit of the
 * doubt. Reads are not checked.
 */
export function isSameOriginWrite(request: Request, appOrigin: string): boolean {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return true;
  const origin = request.headers.get("origin");
  if (origin !== null) return origin === appOrigin;
  return request.headers.get("sec-fetch-site") === "same-origin";
}
