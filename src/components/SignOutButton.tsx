"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toaster";
import { errorText } from "@/lib/errors";

/**
 * Signs out with a fetch, so the page is not reloaded by a form post. The server clears the session
 * cookies and says where to go next (GeekOAuth's end-session address); the browser then navigates there.
 * Every outcome is said: a failure that left the person signed in, and a sign-out that ended this app's
 * session but not GeekOAuth's.
 */
export function SignOutButton({
  className,
  navigate = (url) => window.location.assign(url),
}: {
  className?: string;
  /** Where the browser is sent after sign-out. A page cannot be navigated in a test, so a test passes its own. */
  navigate?: (url: string) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    let response: Response;
    try {
      response = await fetch("/api/auth/logout", { method: "POST", headers: { accept: "application/json" } });
    } catch (err) {
      toast.error(`Sign out did not reach the app, so you may still be signed in: ${errorText(err)}`);
      setBusy(false);
      return;
    }

    let body: { error?: unknown; redirectTo?: unknown };
    try {
      body = (await response.json()) as typeof body;
    } catch {
      toast.error(`Sign out was answered with ${response.status} and something unreadable, so you may still be signed in.`);
      setBusy(false);
      return;
    }
    const redirectTo = typeof body.redirectTo === "string" ? body.redirectTo : null;

    if (response.ok && redirectTo) {
      // GeekOAuth's end-session address, on another origin, so this is a navigation, not a router push.
      navigate(redirectTo);
      return;
    }
    if (redirectTo && typeof body.error === "string") {
      // This app's cookies are cleared; only GeekOAuth's own session was not ended. Say so, then leave.
      toast.error(body.error);
      router.replace(new URL(redirectTo).pathname);
      return;
    }
    toast.error(
      typeof body.error === "string" ? body.error : `Sign out failed (${response.status}), so you may still be signed in.`,
    );
    setBusy(false);
  }

  return (
    <button type="button" onClick={() => void signOut()} disabled={busy} className={className}>
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
