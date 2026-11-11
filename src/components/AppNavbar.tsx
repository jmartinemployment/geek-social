"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSocialHub, type HubState } from "@/components/SocialHubProvider";

const nav: { href: string; label: string }[] = [
  { href: "/", label: "Inbox" },
  { href: "/comments", label: "Comments" },
  { href: "/accounts", label: "Accounts" },
  { href: "/posts", label: "Posts" },
  { href: "/activity", label: "Activity" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function hubLabel(state: HubState): { text: string; dot: string } {
  switch (state.kind) {
    case "live":
      return { text: "Live updates on", dot: "bg-green-500" };
    case "connecting":
      return { text: "Connecting live updates", dot: "bg-amber-400" };
    case "reconnecting":
      return { text: "Reconnecting live updates", dot: "bg-amber-400" };
    case "off":
      return { text: "Live updates off", dot: "bg-red-500" };
  }
}

/** Content Creator's navbar, carrying the parent property's logo, with GeekSocial's pages. */
export function AppNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { state } = useSocialHub();
  const hub = hubLabel(state);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-white text-foreground">
      <div className="mx-auto flex h-16 w-full max-w-[1800px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Geek @ Your Spot">
          <Image
            src="/GeekAtYourSpot.svg"
            alt="Geek @ Your Spot logo"
            width={124}
            height={51}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={`-mb-px border-b-2 px-3 py-[1.3rem] text-sm font-medium transition-colors ${
                isActive(pathname, item.href)
                  ? "border-brand text-[#C83803]"
                  : "border-transparent text-muted hover:border-border hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-4 lg:flex">
          <span className="flex items-center gap-2 text-xs text-muted" role="status">
            <span className={`h-2 w-2 rounded-full ${hub.dot}`} aria-hidden="true" />
            {hub.text}
          </span>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Menu"
          className="ml-auto rounded-md p-2 text-muted hover:bg-surface-muted hover:text-foreground lg:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {open ? (
        <nav className="border-t border-border px-4 pb-3 sm:px-6 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={`block rounded-md px-3 py-2.5 text-sm font-medium ${
                isActive(pathname, item.href) ? "bg-surface-muted text-[#C83803]" : "text-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <span className="flex items-center gap-2 px-3 py-2 text-xs text-muted">
              <span className={`h-2 w-2 rounded-full ${hub.dot}`} aria-hidden="true" />
              {hub.text}
            </span>
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="px-3 py-2 text-sm text-muted">
                Sign out
              </button>
            </form>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
