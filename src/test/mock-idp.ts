import { createHash } from "node:crypto";
import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { SignJWT, exportJWK, generateKeyPair, type JWK } from "jose";

/**
 * A stand-in for GeekOAuth in tests: real discovery, a real JWKS, ID tokens signed with a real key, and
 * a token endpoint that enforces what GeekOAuth enforces (the client secret, the PKCE verifier against
 * the challenge, the redirect URI, single-use refresh tokens). The "browser" step is played by the test:
 * it reads the authorize request it was handed and calls `expect(...)` with what that request carried.
 */

export const CLIENT_ID = "geek-social";
export const CLIENT_SECRET = "test-client-secret-0123456789";

export interface Expectation {
  challenge: string;
  nonce: string;
  code?: string;
}

export interface MockIdp {
  issuer: string;
  /** Records the authorize request's challenge and nonce so the token endpoint can check them. */
  expect(expectation: Expectation): void;
  /** Counts of requests the token endpoint has answered, by grant type. */
  grants: { authorization_code: number; refresh_token: number };
  /** Makes ID tokens be signed by a key that is not in the JWKS (or, with false, by the published key again). */
  signWithUnknownKey(on?: boolean): void;
  /** Makes the next ID tokens carry this audience instead of the client id. */
  useAudience(audience: string): void;
  /** Makes the token endpoint answer refresh requests with this status and body; null stops it. */
  failRefresh(status: number | null, body?: string): void;
  /** Delays refresh answers, so concurrent callers overlap. */
  delayRefresh(milliseconds: number): void;
  close(): Promise<void>;
}

async function readForm(request: IncomingMessage): Promise<URLSearchParams> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

export async function startMockIdp(): Promise<MockIdp> {
  const signing = await generateKeyPair("RS256");
  const stranger = await generateKeyPair("RS256");
  const jwk: JWK = { ...(await exportJWK(signing.publicKey)), kid: "test-key", alg: "RS256", use: "sig" };

  let issuer = "";
  let expectation: Expectation | null = null;
  let unknownKey = false;
  let audience = CLIENT_ID;
  let refreshFailure: { status: number; body: string } | null = null;
  let refreshDelay = 0;
  let refreshCounter = 1;
  const grants = { authorization_code: 0, refresh_token: 0 };
  const spentRefreshTokens = new Set<string>();

  async function idToken(nonce: string | undefined): Promise<string> {
    const claims: Record<string, unknown> = { name: "ada@example.com", email: "ada@example.com", role: ["operator", "admin"] };
    if (nonce) claims.nonce = nonce;
    return new SignJWT(claims)
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setIssuer(issuer)
      .setSubject("user-1")
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(unknownKey ? stranger.privateKey : signing.privateKey);
  }

  const server: Server = createServer(async (request, response) => {
    const path = new URL(request.url ?? "/", issuer).pathname;
    const json = (status: number, body: unknown) => {
      response.writeHead(status, { "content-type": "application/json" });
      response.end(JSON.stringify(body));
    };

    if (path === "/.well-known/openid-configuration") {
      return json(200, {
        issuer,
        authorization_endpoint: `${issuer}/connect/authorize`,
        token_endpoint: `${issuer}/connect/token`,
        jwks_uri: `${issuer}/.well-known/jwks`,
        end_session_endpoint: `${issuer}/connect/logout`,
        response_types_supported: ["code"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"],
        code_challenge_methods_supported: ["S256"],
        token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
      });
    }
    if (path === "/.well-known/jwks") return json(200, { keys: [jwk] });

    if (path === "/connect/token" && request.method === "POST") {
      const form = await readForm(request);
      if (form.get("client_id") !== CLIENT_ID || form.get("client_secret") !== CLIENT_SECRET) {
        return json(401, { error: "invalid_client" });
      }
      const grant = form.get("grant_type");

      if (grant === "authorization_code") {
        grants.authorization_code++;
        const verifier = form.get("code_verifier") ?? "";
        const challenge = createHash("sha256").update(verifier).digest("base64url");
        if (!expectation || form.get("code") !== (expectation.code ?? "good-code")) return json(400, { error: "invalid_grant" });
        if (challenge !== expectation.challenge) return json(400, { error: "invalid_grant", error_description: "PKCE verifier mismatch" });
        if (!form.get("redirect_uri")?.endsWith("/api/auth/callback")) return json(400, { error: "invalid_grant" });
        return json(200, {
          token_type: "Bearer",
          access_token: "access-1",
          refresh_token: "refresh-1",
          expires_in: 900,
          id_token: await idToken(expectation.nonce),
        });
      }

      if (grant === "refresh_token") {
        grants.refresh_token++;
        if (refreshDelay > 0) await new Promise((resolve) => setTimeout(resolve, refreshDelay));
        if (refreshFailure) {
          response.writeHead(refreshFailure.status, { "content-type": "application/json" });
          return response.end(refreshFailure.body);
        }
        const presented = form.get("refresh_token") ?? "";
        if (spentRefreshTokens.has(presented) || !presented.startsWith("refresh-")) return json(400, { error: "invalid_grant" });
        spentRefreshTokens.add(presented);
        refreshCounter++;
        return json(200, {
          token_type: "Bearer",
          access_token: `access-${refreshCounter}`,
          refresh_token: `refresh-${refreshCounter}`,
          expires_in: 900,
          id_token: await idToken(undefined),
        });
      }
    }
    return json(404, { error: "not_found" });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  issuer = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  return {
    issuer,
    expect(next) {
      expectation = next;
    },
    grants,
    signWithUnknownKey(on = true) {
      unknownKey = on;
    },
    useAudience(next) {
      audience = next;
    },
    failRefresh(status, body = "") {
      refreshFailure = status === null ? null : { status, body };
    },
    delayRefresh(milliseconds) {
      refreshDelay = milliseconds;
    },
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.closeAllConnections();
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

/** The environment a server needs to run against this mock. Call before importing any server module. */
export function useMockIdpEnvironment(idp: MockIdp): void {
  process.env.OAUTH_ISSUER_URL = idp.issuer;
  process.env.OAUTH_CLIENT_ID = CLIENT_ID;
  process.env.OAUTH_CLIENT_SECRET = CLIENT_SECRET;
  process.env.OAUTH_REDIRECT_URI = "http://localhost:3006/api/auth/callback";
  process.env.SESSION_SECRET = "test-session-secret-0123456789-abcdefghij";
}
