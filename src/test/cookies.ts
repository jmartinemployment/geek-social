/** The cookies a response sets (not the ones it clears), as a Cookie request header. */
export function cookieHeaderFrom(response: Response): string {
  return response.headers
    .getSetCookie()
    .filter((line) => !/max-age=0/i.test(line))
    .map((line) => line.split(";")[0])
    .join("; ");
}

/** The names of the cookies a response clears. */
export function clearedCookies(response: Response): string[] {
  return response.headers
    .getSetCookie()
    .filter((line) => /max-age=0/i.test(line))
    .map((line) => line.split("=")[0]);
}
