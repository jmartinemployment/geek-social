import * as client from "openid-client";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { oauthConfig } from "@/lib/env";
import type { Session, Transaction } from "@/lib/session";

/**
 * The OpenID Connect client for GeekOAuth (OpenIddict): discovery, Authorization Code with PKCE (S256),
 * the code exchange, ID token verification, refresh, and RP-initiated logout. Everything here runs on
 * the server; the client secret never leaves it.
 */

export type OAuthFlow = Transaction["flow"];

/** Both authorize flows end at the same callback with the same PKCE challenge; they differ only in the first hop. */
export interface AuthorizationStart {
  /** Where to send the browser: GeekOAuth's authorize endpoint, or its Register page carrying that request. */
  redirectTo: URL;
  /** What the callback needs to finish; to be stored in the sealed transaction cookie. */
  transaction: Transaction;
}

let discovered: Promise<client.Configuration> | undefined;

/** GeekOAuth's discovery document, fetched once per server process. A failed fetch is not cached. */
export function oidcConfiguration(): Promise<client.Configuration> {
  if (!discovered) {
    discovered = client
      .discovery(
        new URL(oauthConfig.issuer),
        oauthConfig.clientId,
        oauthConfig.clientSecret,
        undefined,
        oauthConfig.allowInsecureIssuer ? { execute: [client.allowInsecureRequests] } : undefined,
      )
      .catch((err: unknown) => {
        discovered = undefined;
        throw err;
      });
  }
  return discovered;
}

export async function startAuthorization(flow: OAuthFlow, returnTo: string): Promise<AuthorizationStart> {
  const config = await oidcConfiguration();
  const codeVerifier = client.randomPKCECodeVerifier();
  const parameters: Record<string, string> = {
    redirect_uri: oauthConfig.redirectUri,
    scope: oauthConfig.scope,
    code_challenge: await client.calculatePKCECodeChallenge(codeVerifier),
    code_challenge_method: "S256",
    state: client.randomState(),
    nonce: client.randomNonce(),
  };
  // Sign-in always asks for credentials: the SSO cookie alone must not sign in silently. A sign-up does
  // not, or the person who has just created an account would be asked to sign in a second time.
  if (flow === "login") parameters.prompt = "login";

  const authorize = client.buildAuthorizationUrl(config, parameters);
  const transaction: Transaction = {
    codeVerifier,
    state: parameters.state,
    nonce: parameters.nonce,
    flow,
    returnTo,
  };
  if (flow === "login") return { redirectTo: authorize, transaction };

  // Sign-up: GeekOAuth's Register page takes the authorize request as a local returnUrl, and after the
  // person has registered, confirmed their email and signed in, sends them back through it. The PKCE
  // challenge, state and nonce ride inside that request, so the callback below still matches them.
  if (authorize.pathname !== "/connect/authorize") {
    throw new Error(
      `GeekOAuth's authorization endpoint is ${authorize.pathname}, but its Register page only accepts /connect/authorize as a return address.`,
    );
  }
  const register = new URL("/Account/Register", oauthConfig.issuer);
  register.searchParams.set("returnUrl", `${authorize.pathname}${authorize.search}`);
  return { redirectTo: register, transaction };
}

const jwksByUri = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

interface IdTokenClaims {
  sub: string;
  name?: string;
  email?: string;
  roles: string[];
}

/**
 * Verifies an ID token's signature against GeekOAuth's JWKS, and its issuer, audience and expiry. A
 * nonce is checked when one is expected (the code exchange); a refresh response carries none.
 */
async function verifyIdToken(
  config: client.Configuration,
  idToken: string,
  expectedNonce: string | undefined,
): Promise<IdTokenClaims> {
  const metadata = config.serverMetadata();
  if (!metadata.jwks_uri) throw new Error("GeekOAuth's discovery document names no jwks_uri, so the ID token cannot be verified.");
  let jwks = jwksByUri.get(metadata.jwks_uri);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(metadata.jwks_uri));
    jwksByUri.set(metadata.jwks_uri, jwks);
  }
  const advertised = (metadata.id_token_signing_alg_values_supported ?? []).filter(
    (alg) => alg !== "none" && !alg.startsWith("HS"),
  );
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: metadata.issuer,
    audience: oauthConfig.clientId,
    algorithms: advertised.length > 0 ? advertised : ["RS256"],
    clockTolerance: 30,
    requiredClaims: ["sub", "exp", "iat"],
  });
  if (expectedNonce !== undefined && payload.nonce !== expectedNonce) {
    throw new Error("The ID token's nonce does not match the sign-in this browser started.");
  }
  const role = payload.role;
  return {
    sub: String(payload.sub),
    name: typeof payload.name === "string" ? payload.name : undefined,
    email: typeof payload.email === "string" ? payload.email : undefined,
    roles: Array.isArray(role) ? role.map(String) : typeof role === "string" ? [role] : [],
  };
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Finishes a sign-in: checks the state, exchanges the code with the PKCE verifier and the client
 * secret, verifies the ID token, and returns the session to store. Throws on any mismatch or refusal.
 *
 * `callbackUrl` is the registered callback address carrying the query GeekOAuth redirected with, never
 * a URL rebuilt from request headers.
 */
export async function completeAuthorization(callbackUrl: URL, transaction: Transaction): Promise<Session> {
  const config = await oidcConfiguration();
  const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
    pkceCodeVerifier: transaction.codeVerifier,
    expectedState: transaction.state,
    expectedNonce: transaction.nonce,
    idTokenExpected: true,
  });
  if (!tokens.id_token) throw new Error("GeekOAuth answered the code exchange with no ID token.");
  if (!tokens.refresh_token) {
    throw new Error("GeekOAuth issued no refresh token, so the session could not be renewed. The client needs the offline_access scope.");
  }
  if (typeof tokens.expires_in !== "number") throw new Error("GeekOAuth's token answer carries no expires_in.");
  const user = await verifyIdToken(config, tokens.id_token, transaction.nonce);
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token,
    accessTokenExpiresAt: nowSeconds() + tokens.expires_in,
    user,
  };
}

/** Exchanges the refresh token for new tokens. GeekOAuth rotates refresh tokens, so the result must be stored. */
export async function refreshSession(session: Session): Promise<Session> {
  const config = await oidcConfiguration();
  const tokens = await client.refreshTokenGrant(config, session.refreshToken);
  if (typeof tokens.expires_in !== "number") throw new Error("GeekOAuth's refresh answer carries no expires_in.");
  const idToken = tokens.id_token ?? session.idToken;
  const user = tokens.id_token ? await verifyIdToken(config, tokens.id_token, undefined) : session.user;
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? session.refreshToken,
    idToken,
    accessTokenExpiresAt: nowSeconds() + tokens.expires_in,
    user,
  };
}

/**
 * True when GeekOAuth refused the refresh token as spent, expired or revoked: the session is over and
 * only a new sign-in helps. Anything else (GeekOAuth unreachable, a 5xx) is not a verdict on the
 * session and is not matched here.
 */
export function isSessionEnded(err: unknown): boolean {
  return err instanceof client.ResponseBodyError && (err.error === "invalid_grant" || err.error === "invalid_token");
}

/** GeekOAuth's end-session address for this session, which returns to the signed-out page. */
export async function endSessionUrl(idToken: string): Promise<URL> {
  const config = await oidcConfiguration();
  return client.buildEndSessionUrl(config, {
    id_token_hint: idToken,
    post_logout_redirect_uri: oauthConfig.postLogoutRedirectUri,
    client_id: oauthConfig.clientId,
  });
}

