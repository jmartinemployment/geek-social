import type { SocialTenant } from "@/lib/social/types";

/** The sentence a failed GeekAPI answer carries ({ error, code }), or the status when it carries none. */
export async function failureText(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.trim()) return body.error;
  } catch {
    // The body was not JSON; the status below is all there is to say.
  }
  return `${fallback} (GeekAPI answered ${response.status}.)`;
}

/**
 * GeekAPI's answer to GET api/social/tenant: the tenant, or null when the person has not signed up for
 * GeekSocial yet. Only a 404 that says `not_found` means "no tenant"; a 404 with any other body is a route
 * GeekAPI does not have, and every other failure is thrown, so a broken answer is never read as "not signed up".
 */
export async function readTenantResponse(response: Response): Promise<SocialTenant | null> {
  if (response.ok) return (await response.json()) as SocialTenant;

  if (response.status === 404) {
    let code: unknown = null;
    try {
      code = ((await response.clone().json()) as { code?: unknown }).code;
    } catch {
      code = null;
    }
    if (code === "not_found") return null;
  }
  throw new Error(await failureText(response, "GeekSocial could not load your account."));
}
