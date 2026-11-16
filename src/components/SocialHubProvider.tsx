"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import type { HubMessageName } from "@/lib/live-protocol";
import { openLiveStream } from "@/services/live-stream";

/**
 * The one live connection: a Server-Sent Events stream from this app's own server, which holds the
 * SignalR connection to GeekAPI's /hubs/social-realtime with the person's token. The browser never
 * holds that token.
 *
 * Messages carry ids and states only. A page that hears one reads the item again through the REST
 * routes. Nothing on this screen polls on a timer; when the connection is down the screen says so,
 * and "resync" fires after every connect and reconnect so each page reads again whatever it may
 * have missed while disconnected.
 */

export type HubState =
  | { kind: "connecting" }
  | { kind: "live" }
  | { kind: "reconnecting"; reason: string | null }
  | { kind: "off"; reason: string };

type HubEventName = HubMessageName | "resync";
type Listener = (body: unknown) => void;

interface HubContextValue {
  state: HubState;
  subscribe: (name: HubEventName, listener: Listener) => () => void;
  reconnect: () => void;
}

const HubContext = createContext<HubContextValue | null>(null);

export function SocialHubProvider({ children }: { children: React.ReactNode }) {
  const listeners = useRef(new Map<HubEventName, Set<Listener>>());
  const [state, setState] = useState<HubState>({ kind: "connecting" });
  const [attempt, setAttempt] = useState(0);

  const emit = useCallback((name: HubEventName, body: unknown) => {
    const set = listeners.current.get(name);
    if (!set) return;
    for (const listener of [...set]) listener(body);
  }, []);

  useEffect(() => {
    // Set when this stream is torn down (unmount, or a manual reconnect replacing it). Anything it
    // reports after that belongs to a stream nobody is looking at.
    let disposed = false;

    const close = openLiveStream({
      // The server's hub connection is up, on the first connect and after every reconnect: each page
      // reads again whatever it may have missed.
      onLive: () => {
        if (disposed) return;
        setState({ kind: "live" });
        emit("resync", null);
      },
      onMessage: (name, body) => {
        if (!disposed) emit(name, body);
      },
      onReconnecting: (reason) => {
        if (!disposed) setState({ kind: "reconnecting", reason });
      },
      // A refusal retrying cannot fix (the session ended, the permission is missing) arrives with its
      // own reason and stops here.
      onOff: (reason) => {
        if (!disposed) setState({ kind: "off", reason });
      },
    });

    return () => {
      disposed = true;
      close();
    };
  }, [attempt, emit]);

  const subscribe = useCallback((name: HubEventName, listener: Listener) => {
    let set = listeners.current.get(name);
    if (!set) {
      set = new Set();
      listeners.current.set(name, set);
    }
    set.add(listener);
    return () => {
      listeners.current.get(name)?.delete(listener);
    };
  }, []);

  const reconnect = useCallback(() => {
    setState({ kind: "connecting" });
    setAttempt((n) => n + 1);
  }, []);

  const value = useMemo(() => ({ state, subscribe, reconnect }), [state, subscribe, reconnect]);
  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}

export function useSocialHub(): HubContextValue {
  const value = useContext(HubContext);
  if (!value) throw new Error("useSocialHub is used outside SocialHubProvider.");
  return value;
}

/** Calls the handler for every message of this name, with the latest handler each time. */
export function useHubEvent(name: HubEventName, handler: (body: unknown) => void) {
  const { subscribe } = useSocialHub();
  const onEvent = useEffectEvent(handler);
  useEffect(() => subscribe(name, (body) => onEvent(body)), [subscribe, name]);
}
