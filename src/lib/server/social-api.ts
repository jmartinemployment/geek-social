import { fetchWithAuth } from "@/lib/api-client";
import { SocialApiError, readAnswer, type Transport } from "@/services/social-api";

/**
 * GeekAPI's GeekSocial routes called from the server as the signed-in person: a Server Component reading data
 * while a page renders, or a Server Action changing it. The token comes from the encrypted session cookie and never
 * reaches the browser. A failure is a SocialApiError carrying GeekAPI's own sentence and code, as it is in the
 * browser, so the same code reads it.
 */
export const serverTransport: Transport = async (method, path, payload) => {
  let response: Response;
  try {
    response = await fetchWithAuth(`/api/social${path}`, {
      method,
      ...(payload === undefined ? {} : { body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } }),
    });
  } catch (err) {
    // A redirect to sign-in is how fetchWithAuth ends a session; it must reach Next.js untouched.
    if (typeof err === "object" && err !== null && "digest" in err) throw err;
    const detail = err instanceof Error ? err.message : String(err);
    throw new SocialApiError(`Could not reach GeekAPI: ${detail}`, 0, null, []);
  }
  return readAnswer(response);
};
