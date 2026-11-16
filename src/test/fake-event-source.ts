/** Stands in for the browser's EventSource, which a test can drive event by event. */
export class FakeEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  static instances: FakeEventSource[] = [];

  readyState = FakeEventSource.CONNECTING;
  closed = false;
  readonly url: string;
  private readonly listeners = new Map<string, ((event: unknown) => void)[]>();

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: unknown) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  close() {
    this.closed = true;
    this.readyState = FakeEventSource.CLOSED;
  }

  /** A named event with its data, as the server sends it. */
  send(type: string, data?: unknown) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ data: typeof data === "string" ? data : JSON.stringify(data ?? {}) });
    }
  }

  /** The browser's error event: reopening (CONNECTING), or given up (CLOSED). */
  fail(state: number) {
    this.readyState = state;
    this.send("error");
  }
}

/** Replaces the browser's EventSource with the fake, and forgets the streams a previous test opened. */
export function installFakeEventSource(): void {
  FakeEventSource.instances = [];
  (globalThis as unknown as { EventSource: unknown }).EventSource = FakeEventSource;
}
