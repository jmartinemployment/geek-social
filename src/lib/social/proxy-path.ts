/**
 * The GeekAPI path for a request to this app's /api/social proxy.
 *
 * Every segment is encoded, but `.` and `..` survive encoding and `new URL` then collapses them, so
 * `/api/social/../health` would leave api/social and reach any other GeekAPI route with the
 * signed-in person's token. A segment that is empty, `.` or `..` is refused instead.
 */
export function socialTargetPath(segments: string[]): string {
  if (segments.length === 0) {
    throw new Error("A GeekSocial route is needed after /api/social.");
  }
  for (const segment of segments) {
    if (segment === "" || segment === "." || segment === "..") {
      throw new Error(`"${segment}" is not a valid GeekSocial route segment.`);
    }
  }
  return `/api/social/${segments.map((segment) => encodeURIComponent(segment)).join("/")}`;
}
