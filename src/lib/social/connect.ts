/** Where Meta sends the browser back after a Page is connected. */
export const META_CALLBACK_PATH = "/connect/meta/callback";

/**
 * The redirect address for the Meta connect, on the origin the browser is on now. The signed-in
 * session lives in this origin's cookies, so Meta must return here, and the same address has to be
 * sent to both start and complete. Browser only.
 */
export function metaRedirectUri(): string {
  return `${window.location.origin}${META_CALLBACK_PATH}`;
}
