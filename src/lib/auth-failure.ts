import { NextResponse } from "next/server";
import { errorText } from "@/lib/errors";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * A small page saying what went wrong with sign-in and offering another try. The message is always
 * shown: a failed sign-in is never turned into a redirect that looks like it worked. `detail` can carry
 * text from GeekOAuth, so it is escaped.
 */
export function authFailurePage(title: string, detail: unknown, status: number, retryHref = "/api/auth/login"): NextResponse {
  const message = typeof detail === "string" ? detail : errorText(detail);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head><body style="font-family:system-ui,sans-serif;max-width:28rem;margin:20vh auto;padding:0 1.5rem;text-align:center"><h1 style="font-size:1.5rem">${escapeHtml(title)}</h1><p style="color:#555">${escapeHtml(message)}</p><p><a href="${escapeHtml(retryHref)}" style="display:inline-block;padding:.5rem 1rem;background:#0b162a;color:#fff;border-radius:.375rem;text-decoration:none;font-weight:600">Try again</a></p></body></html>`;
  return new NextResponse(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
