/**
 * A stand-in for this app's /api/social proxy: the test says what each route answers, and every call
 * is recorded. A call to a route the test did not describe throws, so a component that makes a request
 * the test did not expect fails loudly instead of getting an empty answer.
 */

export interface RecordedCall {
  method: string;
  path: string;
  body: unknown;
}

export type Answer = Response | ((call: RecordedCall) => Response | Promise<Response>);

export interface FakeApi {
  calls: RecordedCall[];
  /** The calls to one route, in order. */
  to(method: string, path: string): RecordedCall[];
  restore(): void;
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

/** Routes are written "METHOD /path", with the path after /api/social, query string included. */
export function installFakeApi(routes: Record<string, Answer>): FakeApi {
  const realFetch = globalThis.fetch;
  const calls: RecordedCall[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, "http://localhost:3006");
    const path = url.pathname.replace(/^\/api\/social/, "") + url.search;
    const method = (init?.method ?? "GET").toUpperCase();
    const call: RecordedCall = {
      method,
      path,
      body: typeof init?.body === "string" ? JSON.parse(init.body) : (init?.body ?? null),
    };
    calls.push(call);
    const answer = routes[`${method} ${path}`];
    if (!answer) throw new Error(`The test did not describe ${method} ${path}`);
    // Each answer is built fresh: a Response body can be read only once.
    const response = typeof answer === "function" ? await answer(call) : answer.clone();
    return response;
  }) as typeof fetch;
  return {
    calls,
    to: (method, path) => calls.filter((c) => c.method === method && c.path === path),
    restore: () => {
      globalThis.fetch = realFetch;
    },
  };
}
