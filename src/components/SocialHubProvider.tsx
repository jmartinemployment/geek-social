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
import { errorText } from "@/lib/errors";
import { HUB_MESSAGES, createSocialHubConnection, type HubMessageName } from "@/services/social-hub";

/**
 * The one live connection: SignalR to GeekAPI's /hubs/social-realtime.
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
    // Set when this connection is torn down (unmount, or a manual reconnect replacing it). Anything
    // it reports after that belongs to a connection nobody is looking at.
    let disposed = false;

    const connection = createSocialHubConnection({
      // Each failed attempt says why it failed, not only the first drop.
      onAttemptFailed: (reason) => {
        if (!disposed) setState({ kind: "reconnecting", reason });
      },
      // A refusal retrying cannot fix (the session ended, the permission is missing) stops here with
      // its own reason, which the generic close below must not overwrite.
      onGiveUp: (reason) => {
        if (!disposed) setState({ kind: "off", reason });
      },
    });

    for (const name of HUB_MESSAGES) {
      connection.on(name, (body: unknown) => {
        if (!disposed) emit(name, body);
      });
    }
    connection.onreconnecting((err) => {
      if (!disposed) setState({ kind: "reconnecting", reason: err ? errorText(err) : null });
    });
    connection.onreconnected(() => {
      if (disposed) return;
      setState({ kind: "live" });
      emit("resync", null);
    });
    connection.onclose((err) => {
      if (disposed) return;
      setState((current) =>
        current.kind === "off"
          ? current
          : {
              kind: "off",
              reason: err ? errorText(err) : "The live connection closed and could not reconnect.",
            },
      );
    });

    connection.start().then(
      () => {
        if (disposed) return;
        setState({ kind: "live" });
        emit("resync", null);
      },
      (err: unknown) => {
        if (disposed) return;
        setState({ kind: "off", reason: errorText(err) });
      },
    );

    return () => {
      disposed = true;
      connection.stop().catch((err: unknown) => {
        console.error("GeekSocial live connection did not stop cleanly:", errorText(err));
      });
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
