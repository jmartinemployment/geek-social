import { SocialApiError } from "@/services/social-api";

/**
 * What a Server Action hands back. A thrown error does not cross from the server to the browser intact (in production
 * its message is replaced), so a failure travels as data carrying GeekAPI's own sentence, status, code and the
 * Reviewer's broken rules, and the browser raises the same SocialApiError the proxy path raised.
 */
export type ActionResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; status: number; code: string | null; violations: string[] };

export async function run<T>(work: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, value: await work() };
  } catch (err) {
    if (err instanceof SocialApiError) {
      return { ok: false, error: err.message, status: err.status, code: err.code, violations: err.violations };
    }
    // Not a GeekAPI answer (a bug, a redirect): it is not turned into a result, so Next.js and the error page see it.
    throw err;
  }
}

export function unwrap<T>(result: ActionResult<T>): T {
  if (result.ok) return result.value;
  throw new SocialApiError(result.error, result.status, result.code, result.violations);
}
