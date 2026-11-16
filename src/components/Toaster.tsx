"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

/**
 * Non-blocking messages that stay out of the way of the page. A success disappears on its own; an
 * error never does, because a failure that vanishes unread is a failure nobody was told about. Anything
 * the person must act on or come back to (an uncertain send, a refused write) is shown inline where it
 * happened as well, so a toast is never the only place it is said.
 */

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

export interface Toasts {
  success: (message: string) => void;
  info: (message: string) => void;
  /** Stays until dismissed. */
  error: (message: string) => void;
}

const SUCCESS_VISIBLE_MS = 6000;
const MAX_VISIBLE = 5;

const ToastContext = createContext<Toasts | null>(null);

export function useToast(): Toasts {
  const toasts = useContext(ToastContext);
  if (!toasts) throw new Error("useToast was called outside a ToastProvider.");
  return toasts;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((current) => current.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (tone: ToastTone, message: string) => {
      const id = nextId.current++;
      setItems((current) => [...current, { id, tone, message }].slice(-MAX_VISIBLE));
      // A one-shot removal of a message that was shown, not a poll of anything.
      if (tone !== "error") setTimeout(() => dismiss(id), SUCCESS_VISIBLE_MS);
    },
    [dismiss],
  );

  const toasts = useMemo<Toasts>(
    () => ({
      success: (message) => push("success", message),
      info: (message) => push("info", message),
      error: (message) => push("error", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={toasts}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-end gap-2 p-4 sm:p-6">
        {items.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full max-w-sm items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm shadow-lg ${TONE_CLASS[toast.tone]}`}
          >
            <p className="min-w-0 whitespace-pre-wrap break-words">{toast.message}</p>
            <button type="button" onClick={() => dismiss(toast.id)} className="shrink-0 text-xs font-semibold underline">
              Dismiss
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const TONE_CLASS: Record<ToastTone, string> = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-700",
  info: "border-border bg-surface-muted text-foreground",
};
