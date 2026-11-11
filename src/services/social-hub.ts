import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { apiConfig } from "@/lib/config";

/**
 * The access token for the hub, from this app's server (the browser cannot read the httpOnly
 * cookie). Content Creator gets its hub token the same way.
 */
async function hubAccessToken(): Promise<string> {
  let res: Response;
  try {
    res = await fetch("/api/auth/hub-token", { cache: "no-store" });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Could not reach this app's server for the live-update sign-in: ${detail}`);
  }
  const text = await res.text();
  let body: { accessToken?: string; error?: string } = {};
  try {
    body = text ? (JSON.parse(text) as typeof body) : {};
  } catch {
    throw new Error(`The live-update sign-in answered ${res.status} with a body that is not JSON.`);
  }
  if (!res.ok) throw new Error(body.error || `The live-update sign-in answered ${res.status}.`);
  if (!body.accessToken) throw new Error("The live-update sign-in answered with no token.");
  return body.accessToken;
}

export const HUB_MESSAGES = ["draftChanged", "commentChanged", "accountChanged"] as const;
export type HubMessageName = (typeof HUB_MESSAGES)[number];

export function createSocialHubConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(apiConfig.socialHubUrl, { accessTokenFactory: hubAccessToken })
    .withAutomaticReconnect([0, 1000, 3000, 5000, 10000])
    .configureLogging(LogLevel.Warning)
    .build();
}
