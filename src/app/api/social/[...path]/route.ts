import { NextRequest } from "next/server";
import { getAccessTokenWithRefresh } from "@/lib/auth/session";
import { apiConfig } from "@/lib/config";

/**
 * Same-origin proxy to GeekAPI's GeekSocial routes: /api/social/<path> here is
 * <GeekAPI>/api/social/<path> there. It forwards the signed-in person's OAuth Bearer and never
 * substitutes another credential when that token is refused. The token never reaches the browser
 * through this route.
 */

// Approve sends to the platform and resync reads every stored post's comments; the platform
// default is not guaranteed long enough, and a killed function is an empty 500 with no message.
export const maxDuration = 300;

async function forward(request: NextRequest, path: string[]): Promise<Response> {
  const targetUrl = new URL(
    `/api/social/${path.map((segment) => encodeURIComponent(segment)).join("/")}`,
    apiConfig.baseUrl,
  );
  targetUrl.search = request.nextUrl.search;

  let token: string | null;
  try {
    token = await getAccessTokenWithRefresh();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: `Could not refresh the sign-in with GeekOAuth: ${detail}` },
      { status: 502 },
    );
  }
  if (!token) {
    return Response.json(
      { error: "Your sign-in has ended. Sign in again." },
      { status: 401 },
    );
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const bufferedBody = hasBody ? await request.arrayBuffer() : undefined;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: bufferedBody,
      redirect: "manual",
      cache: "no-store",
    });
  } catch (err) {
    // A timeout, a reset connection, or GeekAPI not answering. Plain text: the screen shows a body
    // that is not JSON as it came.
    const detail = err instanceof Error ? err.message : String(err);
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
