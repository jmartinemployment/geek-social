import { NextRequest } from "next/server";
import { fetchWithAuth, SessionEndedError } from "@/lib/api-client";
import { apiConfig } from "@/lib/config";
import { errorText } from "@/lib/errors";
import { SessionRenewalError } from "@/lib/session-renewal";
import { socialTargetPath } from "@/lib/social/proxy-path";

/**
 * Same-origin proxy to GeekAPI's GeekSocial routes: /api/social/<path> here is
 * <GeekAPI>/api/social/<path> there. It forwards the signed-in person's OAuth Bearer from the encrypted
 * session cookie and never substitutes another credential when that token is refused. The token never
 * reaches the browser through this route.
 */

// Approve sends to the platform and resync reads every stored post's comments; the platform
// default is not guaranteed long enough, and a killed function is an empty 500 with no message.
export const maxDuration = 300;

async function forward(request: NextRequest, path: string[]): Promise<Response> {
  let targetPath: string;
  try {
    targetPath = socialTargetPath(path);
  } catch (err) {
    const detail = errorText(err);
    return Response.json({ error: detail }, { status: 400 });
  }
  const targetUrl = new URL(targetPath, apiConfig.baseUrl);
  targetUrl.search = request.nextUrl.search;

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const bufferedBody = hasBody ? await request.arrayBuffer() : undefined;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  let response: Response;
  try {
    response = await fetchWithAuth(
      targetUrl,
      { method: request.method, headers, body: bufferedBody, redirect: "manual" },
      { onSessionEnded: "throw" },
    );
  } catch (err) {
    if (err instanceof SessionEndedError) {
      return Response.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof SessionRenewalError) {
      return Response.json({ error: err.message }, { status: 502 });
    }
    // A timeout, a reset connection, or GeekAPI not answering. Plain text: the screen shows a body
    // that is not JSON as it came.
    const detail = errorText(err);
    return new Response(`Could not reach GeekAPI: ${detail}`, {
      status: 502,
      headers: { "content-type": "text/plain" },
    });
  }

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

async function handler(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await ctx.params;
  return forward(request, path);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
