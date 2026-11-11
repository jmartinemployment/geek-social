"use client";

import { AppNavbar } from "@/components/AppNavbar";
import { SocialHubProvider, useSocialHub } from "@/components/SocialHubProvider";

/** Top navbar over full-width content, as in Content Creator, inside the one live connection. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SocialHubProvider>
      <div className="flex min-h-screen flex-col bg-paper text-ink">
        <AppNavbar />
        <HubBanner />
        <main className="flex-1">{children}</main>
      </div>
    </SocialHubProvider>
  );
}

/**
 * Says, across every page, when the screen is not live. Without live updates a page shows what it
 * last read and nothing more, so this stays up until the connection is back.
 */
function HubBanner() {
  const { state, reconnect } = useSocialHub();
  if (state.kind === "live" || state.kind === "connecting") return null;

  if (state.kind === "reconnecting") {
    return (
      <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-6 lg:px-8">
        Live updates dropped and are reconnecting
        {state.reason ? `: ${state.reason}` : "."} What you see may be out of date until they are back.
      </div>
    );
  }

  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 sm:px-6 lg:px-8">
      <span>
        Live updates are off: {state.reason} Pages show what they last read and do not change on
        their own.
      </span>
      <button type="button" onClick={reconnect} className="font-semibold underline">
        Reconnect
      </button>
      <a href="/api/auth/start" className="font-semibold underline">
        Sign in again
      </a>
    </div>
  );
}
