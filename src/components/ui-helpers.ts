/**
 * Plain values the pages share: the class names for form controls and the time format. This file has no client
 * directive on purpose, so a Server Component can use them. Importing a value from a client module hands the server a
 * reference to it, not the value.
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

const utcFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

/** The same time in UTC, named as UTC. What the server can say, since it does not know the viewer's time zone. */
export function formatTimeUtc(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return utcFormat.format(date);
}
