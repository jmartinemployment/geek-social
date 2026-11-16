"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { fetchWithAuth } from "@/lib/api-client";
import { verifySession } from "@/lib/dal";
import { errorText } from "@/lib/errors";
import { failureText } from "@/lib/social/tenant";

/** What a form on the welcome page shows after it ran. An error is a sentence for the person to read. */
export interface WelcomeState {
  error: string | null;
}

/** redirect() ends an action by throwing; anything else that was thrown is a failure to show. */
function isNextControlFlow(err: unknown): boolean {
  return typeof err === "object" && err !== null && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_");
}

/** Signs the person up for GeekSocial: makes their tenant, then shows them the next step. */
export async function createTenantAction(_previous: WelcomeState, formData: FormData): Promise<WelcomeState> {
  await verifySession();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter the name of your business." };

  let failed: string | null = null;
  try {
    const response = await fetchWithAuth("/api/social/tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    // 409 means they already have a tenant (another tab, or a double click): the page below shows it.
    if (!response.ok && response.status !== 409) failed = await failureText(response, "GeekSocial could not sign you up.");
  } catch (err) {
    if (isNextControlFlow(err)) throw err;
    failed = `GeekSocial could not sign you up. ${errorText(err)}`;
  }

  if (failed) return { error: failed };
  redirect("/welcome");
}

/** Records that the tenant accepted the AI terms. */
export async function acceptAiTermsAction(): Promise<WelcomeState> {
  await verifySession();

  try {
    const response = await fetchWithAuth("/api/social/tenant/ai-terms", { method: "POST" });
    if (!response.ok) return { error: await failureText(response, "GeekSocial could not record your answer.") };
  } catch (err) {
    if (isNextControlFlow(err)) throw err;
    return { error: `GeekSocial could not record your answer. ${errorText(err)}` };
  }

  revalidatePath("/welcome");
  return { error: null };
}
