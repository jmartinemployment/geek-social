"use client";

import { inputClass } from "@/components/ui";
import type { SocialAccount } from "@/lib/social/types";
import { platformWords } from "@/lib/social/words";

/**
 * Narrows a list to one account. The accounts list failing to load is said next to the control; the
 * list it filters still loads for all accounts.
 */
export function AccountFilter({
  accounts,
  accountsError,
  value,
  onChange,
  allowAll = true,
}: {
  accounts: SocialAccount[] | null;
  accountsError: string | null;
  value: string | null;
  onChange: (accountId: string | null) => void;
  /** False for a list GeekAPI only gives for one account: there is no "All accounts" choice. */
  allowAll?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2 text-sm text-muted">
        Account
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
          className={`${inputClass} w-auto py-1.5`}
        >
          {allowAll ? <option value="">All accounts</option> : null}
          {(accounts ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.displayName} ({platformWords(a.platform)})
            </option>
          ))}
        </select>
      </label>
      {accountsError ? (
        <span className="text-xs text-red-600">Accounts did not load: {accountsError}</span>
      ) : null}
    </div>
  );
}
