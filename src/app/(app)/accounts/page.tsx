import { AppAccountsView, AppConnectPanel } from "@/components/social/AccountsPanels";
import { PageFrame } from "@/components/ui";
import { readAccounts } from "@/lib/server/social-api";

/**
 * Connected accounts, read on the server: connect a Facebook Page, set auto-send and the send pause, and resync. Saving,
 * resyncing and connecting are Server Actions. A read that fails throws, and the error page says what failed.
 */
export default async function AccountsPage() {
  const accounts = await readAccounts();

  return (
    <PageFrame
      title="Accounts"
      intro="The Pages GeekSocial watches and replies from. Settings change only when you press Save."
    >
      <AppConnectPanel />
      <AppAccountsView accounts={accounts} />
    </PageFrame>
  );
}
