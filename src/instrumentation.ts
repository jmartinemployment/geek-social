/**
 * Runs once when the server starts. Importing the environment module validates every OAuth and session
 * variable, so a missing or malformed one stops the server here with each problem named, instead of
 * failing the first sign-in.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/env");
  }
}
