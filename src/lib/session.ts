import { hkdfSync } from "node:crypto";
import { EncryptJWT, errors, jwtDecrypt } from "jose";
import { z } from "zod";
import { env, oauthConfig } from "@/lib/env";

/**
 * The signed-in session and the sign-in transaction, each an encrypted JWE (A256GCM, direct key) in an
 * HttpOnly, SameSite=Lax cookie. The browser holds ciphertext only: the access, refresh and ID tokens
 * never reach its JavaScript. The two keys are derived from SESSION_SECRET with distinct labels, so a
 * sign-in cookie can never be presented as a session.
 *
 * A session carries three tokens and does not fit one 4 KB cookie, so its ciphertext is split across
 * numbered cookies (gs_session.0, gs_session.1, ...). Reading joins them in order.
 */

export const SESSION_COOKIE = "gs_session";
export const TRANSACTION_COOKIE = "gs_oauth_tx";

/** The refresh token's life in GeekOAuth; the session cookie never outlives it. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
/** A person who has to confirm an email before signing in needs longer than one who signs in directly. */
export const LOGIN_TRANSACTION_SECONDS = 60 * 10;
export const REGISTER_TRANSACTION_SECONDS = 60 * 60;

const CHUNK_SIZE = 3500;
const MAX_CHUNKS = 6;
const ISSUER = "geek-social";

export const sessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  idToken: z.string().min(1),
  /** Seconds since the epoch. */
  accessTokenExpiresAt: z.number().int(),
  user: z.object({
    sub: z.string().min(1),
    name: z.string().optional(),
    email: z.string().optional(),
    roles: z.array(z.string()),
  }),
});
export type Session = z.infer<typeof sessionSchema>;

export const transactionSchema = z.object({
  codeVerifier: z.string().min(1),
  state: z.string().min(1),
  nonce: z.string().min(1),
  flow: z.enum(["login", "register"]),
  /** A path inside this app, already checked by safeReturnTo. */
  returnTo: z.string().startsWith("/"),
});
export type Transaction = z.infer<typeof transactionSchema>;

export interface CookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}
export interface CookieReader {
  get(name: string): { value: string } | undefined;
}
export interface CookieWriter {
  set(name: string, value: string, options: CookieOptions): unknown;
}

function cookieOptions(maxAge: number): CookieOptions {
  return { httpOnly: true, secure: oauthConfig.cookieSecure, sameSite: "lax", path: "/", maxAge };
}

const keys = new Map<string, Uint8Array>();
function keyFor(label: "session" | "transaction"): Uint8Array {
  let key = keys.get(label);
  if (!key) {
    key = new Uint8Array(hkdfSync("sha256", env.SESSION_SECRET, "geek-social", label, 32));
    keys.set(label, key);
  }
  return key;
}

async function seal(label: "session" | "transaction", claim: object, lifetimeSeconds: number): Promise<string> {
  return new EncryptJWT({ v: claim })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuer(ISSUER)
    .setAudience(label)
    .setIssuedAt()
    .setExpirationTime(`${lifetimeSeconds}s`)
    .encrypt(keyFor(label));
}

/** The decrypted claim, or null when the value is not one this server issued or has expired. Other failures throw. */
async function unseal(label: "session" | "transaction", value: string): Promise<unknown | null> {
  try {
    const { payload } = await jwtDecrypt(value, keyFor(label), {
      issuer: ISSUER,
      audience: label,
      keyManagementAlgorithms: ["dir"],
      contentEncryptionAlgorithms: ["A256GCM"],
    });
    return payload.v;
  } catch (err) {
    if (err instanceof errors.JWTExpired) return null;
    if (
      err instanceof errors.JWEDecryptionFailed ||
      err instanceof errors.JWEInvalid ||
      err instanceof errors.JWTClaimValidationFailed
    ) {
      // A cookie from before a SESSION_SECRET change, or one that was altered. The person is treated as
      // signed out; the server log says why, so a mass sign-out after a deploy is explained.
      console.warn(`A ${label} cookie was refused: ${err.code}`);
      return null;
    }
    throw err;
  }
}

function chunkName(index: number): string {
  return `${SESSION_COOKIE}.${index}`;
}

function readChunks(reader: CookieReader): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < MAX_CHUNKS; i++) {
    const part = reader.get(chunkName(i));
    if (!part) break;
    chunks.push(part.value);
  }
  return chunks;
}

export async function readSession(reader: CookieReader): Promise<Session | null> {
  const chunks = readChunks(reader);
  if (chunks.length === 0) return null;
  const claim = await unseal("session", chunks.join(""));
  if (claim === null) return null;
  const parsed = sessionSchema.safeParse(claim);
  if (!parsed.success) {
    console.warn("A session cookie was refused: its contents are not the shape this version expects");
    return null;
  }
  return parsed.data;
}

/** The cookies that hold this session, ready to set. Throws if the session no longer fits in the allowed number of cookies. */
export async function sealSessionCookies(session: Session): Promise<{ name: string; value: string }[]> {
  const sealed = await seal("session", sessionSchema.parse(session), SESSION_MAX_AGE_SECONDS);
  const count = Math.ceil(sealed.length / CHUNK_SIZE);
  if (count > MAX_CHUNKS) {
    throw new Error(
      `The signed-in session is ${sealed.length} characters, which needs ${count} cookies; at most ${MAX_CHUNKS} are supported. GeekOAuth issued unusually large tokens.`,
    );
  }
  return Array.from({ length: count }, (_, i) => ({
    name: chunkName(i),
    value: sealed.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
  }));
}

/** What it takes to store `session` in place of whatever the reader holds: cookies to set, and stale chunks to remove. */
export async function planSessionWrite(
  reader: CookieReader,
  session: Session,
): Promise<{ set: { name: string; value: string; options: CookieOptions }[]; remove: { name: string; options: CookieOptions }[] }> {
  const previous = readChunks(reader).length;
  const cookies = await sealSessionCookies(session);
  const remove = [];
  for (let i = cookies.length; i < previous; i++) remove.push({ name: chunkName(i), options: cookieOptions(0) });
  return {
    set: cookies.map(({ name, value }) => ({ name, value, options: cookieOptions(SESSION_MAX_AGE_SECONDS) })),
    remove,
  };
}

export async function writeSession(writer: CookieWriter, reader: CookieReader, session: Session): Promise<void> {
  const plan = await planSessionWrite(reader, session);
  for (const { name, value, options } of plan.set) writer.set(name, value, options);
  for (const { name, options } of plan.remove) writer.set(name, "", options);
}

export function clearSession(writer: CookieWriter, reader: CookieReader): void {
  const present = Math.max(readChunks(reader).length, 1);
  for (let i = 0; i < present; i++) writer.set(chunkName(i), "", cookieOptions(0));
}

export async function writeTransaction(writer: CookieWriter, transaction: Transaction): Promise<void> {
  const seconds = transaction.flow === "register" ? REGISTER_TRANSACTION_SECONDS : LOGIN_TRANSACTION_SECONDS;
  writer.set(TRANSACTION_COOKIE, await seal("transaction", transaction, seconds), cookieOptions(seconds));
}

export async function readTransaction(reader: CookieReader): Promise<Transaction | null> {
  const value = reader.get(TRANSACTION_COOKIE)?.value;
  if (!value) return null;
  const claim = await unseal("transaction", value);
  if (claim === null) return null;
  const parsed = transactionSchema.safeParse(claim);
  return parsed.success ? parsed.data : null;
}

export function clearTransaction(writer: CookieWriter): void {
  writer.set(TRANSACTION_COOKIE, "", cookieOptions(0));
}
