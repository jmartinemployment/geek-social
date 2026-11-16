import { SocialApiError } from "@/services/social-api";

/**
 * True when a refused call may still have done what it was asked: the platform write timed out or
 * its answer was lost (`outcome_unknown`), GeekAPI or the proxy did not answer (no code, status 0 or
 * 5xx, e.g. a 504 timeout), or the answer could not be read (status 200 with no code).
 *
 * GeekAPI's own refusals carry a code and are definite: nothing was done (`review_refused`,
 * `conflict`, `not_configured`, and the rest). For an uncertain one the screen must not say "not
 * done", and must not offer the same write again until the operator has looked at the platform.
 */
export function mayHaveHappened(err: unknown): boolean {
  if (!(err instanceof SocialApiError)) return false;
  if (err.code === "outcome_unknown") return true;
  if (err.code !== null) return false;
  return err.status === 0 || err.status === 200 || err.status >= 500;
}
