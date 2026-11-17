import { draftApi, readAnswer, type Transport } from "@/services/social-api";
import type { DraftActions } from "@/services/draft-actions";

/**
 * A stand-in for GeekAPI's social routes, as a Transport: the test says what each route answers, and every call is
 * recorded. A call to a route the test did not describe throws, so a component that makes a request the test did not
 * expect fails loudly instead of getting an empty answer. Answers are real Responses read by the app's own
 * `readAnswer`, so a refusal reaches the component the way GeekAPI's would.
 */

export interface RecordedCall {
  method: string;
  path: string;
  body: unknown;
}

export type Answer = Response | ((call: RecordedCall) => Response | Promise<Response>);

export interface FakeApi {
  transport: Transport;
  calls: RecordedCall[];
  /** The calls to one route, in order. */
  to(method: string, path: string): RecordedCall[];
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

/** Routes are written "METHOD /path", with the path after /api/social, query string included. */
export function fakeApi(routes: Record<string, Answer>): FakeApi {
  const calls: RecordedCall[] = [];
  const transport: Transport = async <T,>(method: "GET" | "POST" | "PUT", path: string, payload?: unknown) => {
    const call: RecordedCall = { method, path, body: payload ?? null };
    calls.push(call);
    const answer = routes[`${method} ${path}`];
    if (!answer) throw new Error(`The test did not describe ${method} ${path}`);
    // Each answer is built fresh: a Response body can be read only once.
    const response = typeof answer === "function" ? await answer(call) : answer.clone();
    return readAnswer<T>(response);
  };
  return {
    transport,
    calls,
    to: (method, path) => calls.filter((c) => c.method === method && c.path === path),
  };
}

/** What a draft card does, over a fake API. */
export function draftActionsOver(transport: Transport): DraftActions {
  const api = draftApi(transport);
  return { saveText: api.saveText, approve: api.approve, send: api.send, reject: api.reject, read: api.get };
}
