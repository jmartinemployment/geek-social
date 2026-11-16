"use client";

import { useEffect } from "react";
import { useSocialHub, type HubEventName } from "@/components/SocialHubProvider";
import { useServerRefresh } from "@/lib/hooks/use-server-refresh";

/** Makes the server read the page again when the live connection reports one of these messages, or reconnects. Renders nothing. */
export function LiveRefresh({ names }: { names: readonly HubEventName[] }) {
  const { subscribe } = useSocialHub();
  const { refresh } = useServerRefresh();
  const key = names.join(",");

  useEffect(() => {
    const stops = key.split(",").map((name) => subscribe(name as HubEventName, refresh));
    return () => stops.forEach((stop) => stop());
  }, [key, subscribe, refresh]);

  return null;
}

/** Reads the page's data again on the server. */
export function ReloadButton({ className, label = "Reload" }: { className: string; label?: string }) {
  const { refresh, refreshing } = useServerRefresh();
  return (
    <button type="button" onClick={refresh} className={className}>
      {refreshing ? "Reloading…" : label}
    </button>
  );
}
