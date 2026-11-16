"use client";

import { AccountsView, ConnectPanel } from "@/components/social/AccountsView";
import type { SocialAccount } from "@/lib/social/types";
import { serverAccountActions } from "@/services/server-account-actions";

/** The Accounts screen's interactive panels with the app's own Server Actions behind their buttons. The page renders these. */
export function AppConnectPanel() {
  return <ConnectPanel actions={serverAccountActions} />;
}

export function AppAccountsView({ accounts }: { accounts: SocialAccount[] }) {
  return <AccountsView accounts={accounts} actions={serverAccountActions} />;
}
