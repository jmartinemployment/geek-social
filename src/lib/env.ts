import { z } from "zod";

/**
 * The server's environment, checked once when this module is first imported (at server start through
 * `instrumentation.ts`, and at build time when a route imports it). A missing or malformed value stops
 * the start or the build with every problem named, instead of surfacing as a failed sign-in later.
 * Values are never printed, only the names of the variables that are wrong.
 */

function isLoopback(url: URL): boolean {
  return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
}

/** An https address, or an http one only for a machine's own loopback. */
const httpsUrl = z.url().refine(
  (value) => {
    const url = new URL(value);
    return url.protocol === "https:" || (url.protocol === "http:" && isLoopback(url));
  },
  { message: "must be an https address (http is accepted only for localhost)" },
);

const schema = z.object({
  /** GeekOAuth's issuer, exactly as its discovery document names it, e.g. https://auth.geekatyourspot.com. */
  OAUTH_ISSUER_URL: httpsUrl.transform((value) => value.replace(/\/+$/, "")),
  /** The confidential client's id in GeekOAuth. */
  OAUTH_CLIENT_ID: z.string().trim().min(1, "must not be empty"),
  /** The confidential client's secret; it stays on this server and is never sent to the browser. */
  OAUTH_CLIENT_SECRET: z.string().min(16, "must be at least 16 characters"),
  /** This app's callback, registered on the client: <app origin>/api/auth/callback. */
  OAUTH_REDIRECT_URI: httpsUrl.refine((value) => new URL(value).pathname === "/api/auth/callback" && !value.includes("?"), {
    message: "must end with /api/auth/callback and carry no query",
  }),
  /** Key material for the encrypted session and sign-in cookies. */
  SESSION_SECRET: z.string().min(32, "must be at least 32 characters"),
});

export function parseEnvironment(source: Record<string, string | undefined>) {
  const result = schema.safeParse({
    OAUTH_ISSUER_URL: source.OAUTH_ISSUER_URL,
    OAUTH_CLIENT_ID: source.OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET: source.OAUTH_CLIENT_SECRET,
    OAUTH_REDIRECT_URI: source.OAUTH_REDIRECT_URI,
    SESSION_SECRET: source.SESSION_SECRET,
  });
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  ${issue.path.join(".") || "(environment)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`The GeekSocial server environment is not valid:\n${problems}`);
  }
  return result.data;
}

export const env = parseEnvironment(process.env);

const redirectUri = new URL(env.OAUTH_REDIRECT_URI);

export const oauthConfig = {
  issuer: env.OAUTH_ISSUER_URL,
  clientId: env.OAUTH_CLIENT_ID,
  clientSecret: env.OAUTH_CLIENT_SECRET,
  redirectUri: env.OAUTH_REDIRECT_URI,
  /** This app's own origin, taken from the registered callback. */
  appOrigin: redirectUri.origin,
  /** A public page, so signing out does not bounce straight back into a sign-in prompt. */
  postLogoutRedirectUri: `${redirectUri.origin}/signed-out`,
  /**
   * geeksocial.manage is what every api/social route and the social hub check for: GeekOAuth is
   * shared across Geek apps, so a valid token proves only that someone signed in somewhere.
   */
  scope: "openid profile email roles offline_access geeksocial.manage",
  /** Cookies are Secure whenever the app is served over https. */
  cookieSecure: redirectUri.protocol === "https:",
  /** An http issuer (a local GeekOAuth) is allowed only because the schema accepted it for loopback. */
  allowInsecureIssuer: new URL(env.OAUTH_ISSUER_URL).protocol === "http:",
} as const;
