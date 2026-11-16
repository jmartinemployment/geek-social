"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AccountFilter } from "@/components/AccountFilter";
import type { SocialAccount } from "@/lib/social/types";

/**
 * The account filter, kept in the address (`?account=`) so the page the server renders is the one the person
 * asked for and the link can be shared. Choosing an account changes the address; the server does the rest.
 */
export function UrlAccountFilter({ accounts, value }: { accounts: SocialAccount[]; value: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const current = useSearchParams();

  return (
    <AccountFilter
      accounts={accounts}
      accountsError={null}
      value={value}
      onChange={(accountId) => {
        const next = new URLSearchParams(current.toString());
        if (accountId) next.set("account", accountId);
        else next.delete("account");
        const query = next.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      }}
    />
  );
}
