import { fetchWithAuth } from "@/lib/api-client";
import { readTenantResponse } from "@/lib/social/tenant";
import type { SocialTenant } from "@/lib/social/types";

/**
 * The signed-in person's tenant, read on the server while a page renders, or null before they have signed up.
 * A failure throws, so the page's error boundary shows it.
 */
export async function getTenant(): Promise<SocialTenant | null> {
  return readTenantResponse(await fetchWithAuth("/api/social/tenant"));
}
