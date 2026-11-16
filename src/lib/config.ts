/**
 * GeekSocial screen -> GeekOAuth -> GeekAPI (api/social/*) -> GeekRepository.
 * Never call GeekRepository from this app. The OAuth and session settings live in `lib/env.ts`.
 */

/**
 * Reads an env var, treating empty and whitespace-only as absent.
 *
 * `??` only falls back on null/undefined, so a var set to "" passes straight through. Content
 * Creator lost sign-in in production to exactly that: an empty NEXT_PUBLIC_AUTH_URL made the
 * authorize address the bare "/connect/authorize", which `new URL()` rejects.
 */
function envOrDefault(value: string | undefined, fallback: string): string {
  const trimmed = (value ?? "").trim();
  return (trimmed.length > 0 ? trimmed : fallback).replace(/\/$/, "");
}

const geekApiUrl = envOrDefault(process.env.NEXT_PUBLIC_GEEK_API_URL, "https://api.geekatyourspot.com");

export const apiConfig = {
  baseUrl: geekApiUrl,
  socialHubUrl: `${geekApiUrl}/hubs/social-realtime`,
};
