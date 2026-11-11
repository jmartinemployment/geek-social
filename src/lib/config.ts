/**
 * GeekSocial screen -> GeekOAuth -> GeekAPI (api/social/*) -> GeekRepository.
 * Never call GeekRepository from this app.
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

const authUrl = envOrDefault(process.env.NEXT_PUBLIC_AUTH_URL, "https://auth.geekatyourspot.com");
// appUrl feeds redirectUri, so a wrong value here is a redirect_uri mismatch at the IdP rather than
// a visible error. When NEXT_PUBLIC_APP_URL is absent or empty, prefer the host Vercel reports over
// the localhost default, so production never sends people to http://localhost:3006/auth/callback.
const vercelProductionUrl = (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "").trim();
const appUrl = envOrDefault(
  process.env.NEXT_PUBLIC_APP_URL,
  vercelProductionUrl.length > 0 ? `https://${vercelProductionUrl}` : "http://localhost:3006",
);
const geekApiUrl = envOrDefault(process.env.NEXT_PUBLIC_GEEK_API_URL, "https://api.geekatyourspot.com");

export const authConfig = {
  authUrl,
  authorizeUrl: `${authUrl}/connect/authorize`,
  tokenUrl: `${authUrl}/connect/token`,
  // GeekOAuth registers one public client per app; this app is "geek-social".
  clientId: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID?.trim() || "geek-social",
  // Always derived from appUrl. The callback lives at src/app/auth/callback, so the path is fixed.
  redirectUri: `${appUrl}/auth/callback`,
  // Where GeekOAuth sends the browser after sign-out. A public page, so signing out does not bounce
  // straight back into a sign-in prompt.
  postLogoutRedirectUri: `${appUrl}/signed-out`,
  // geeksocial.manage is what every api/social route and the social hub check for. GeekOAuth is
  // shared across Geek apps, so a valid token proves only that someone signed in somewhere; the
  // scope is what says this person may run GeekSocial. Without it every route answers 403.
  scope: "openid profile email offline_access geeksocial.manage",
  appUrl,
};

export const apiConfig = {
  baseUrl: geekApiUrl,
  socialHubUrl: `${geekApiUrl}/hubs/social-realtime`,
};
