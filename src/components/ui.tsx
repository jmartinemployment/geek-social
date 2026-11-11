"use client";

/**
 * The building blocks every page shares, styled as Content Creator styles its own: the ink page
 * with a masthead, white `bg-surface` panels, underlined tabs, and the accent kept for the one
 * primary action in view.
 */

export const inputClass =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm font-normal text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export const labelClass = "flex flex-col gap-1 text-sm font-medium text-foreground";

export const primaryButton =
  "rounded-md bg-[#C83803] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#8C2703] disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButton =
  "rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50";

export const quietButton =
  "text-sm font-medium text-[#C83803] hover:underline disabled:cursor-not-allowed disabled:opacity-50";

export const checkboxClass =
  "h-4 w-4 rounded border-border text-[#C83803] focus:ring-2 focus:ring-brand/20";

export function PageFrame({
  title,
  intro,
  children,
}: {
  title: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-ink py-5">
      <div className="mx-auto w-full max-w-[1400px] px-4 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C83803]">
          GeekSocial
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold leading-tight text-white lg:text-3xl">
          {title}
        </h1>
        <span className="mt-2 block h-[3px] w-12 rounded-full bg-brand lg:w-14" />
        <div className="mt-2 max-w-3xl text-sm text-line">{intro}</div>
        <div className="mt-6 flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}

export function Panel({
  title,
  aside,
  children,
}: {
  title?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      {title || aside ? (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          {title ? <h2 className="text-lg font-semibold text-foreground">{title}</h2> : <span />}
          {aside ? <div className="flex flex-wrap items-center gap-3">{aside}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Tabs<T extends string>({
  label,
  tabs,
  selected,
  onSelect,
}: {
  label: string;
  tabs: readonly { id: T; label: string }[];
  selected: T;
  onSelect: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-6 border-b border-border" role="tablist" aria-label={label}>
      {tabs.map((tab) => {
        const isSelected = tab.id === selected;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(tab.id)}
            className={
              "-mb-px border-b-2 px-1 pb-2.5 pt-1 text-sm transition-colors " +
              (isSelected
                ? "border-brand font-semibold text-foreground"
                : "border-transparent font-medium text-muted hover:border-border hover:text-foreground")
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/** A failure, shown with its own message. Never replaced by an empty list. */
export function ErrorNote({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <p className="whitespace-pre-wrap break-words">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-2 text-sm font-semibold text-red-700 underline">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function Notice({
  tone,
  children,
  onDismiss,
}: {
  tone: "good" | "warn" | "info";
  children: React.ReactNode;
  onDismiss?: () => void;
}) {
  const toneClass =
    tone === "good"
      ? "border-green-200 bg-green-50 text-green-800"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-border bg-surface-muted text-foreground";
  return (
    <div className={`flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm ${toneClass}`}>
      <div className="min-w-0 break-words">{children}</div>
      {onDismiss ? (
        <button type="button" onClick={onDismiss} className="shrink-0 text-xs font-semibold underline">
          Dismiss
        </button>
      ) : null}
    </div>
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: "neutral" | "good" | "warn" | "bad" | "brand";
  children: React.ReactNode;
}) {
  const toneClass = {
    neutral: "bg-background text-muted",
    good: "bg-green-100 text-green-800",
    warn: "bg-amber-100 text-amber-800",
    bad: "bg-red-100 text-red-700",
    brand: "bg-brand/10 text-[#C83803]",
  }[tone];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${toneClass}`}>{children}</span>;
}

export function Loading({ what }: { what: string }) {
  return <p className="text-sm text-muted">Loading {what}…</p>;
}

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** An ISO time from GeekAPI in the viewer's local time. A value that does not parse is shown as it came. */
export function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return timeFormat.format(date);
}
