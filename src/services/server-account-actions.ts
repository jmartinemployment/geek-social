import { connectMetaAction, resyncAccountAction, saveAccountSettingsAction } from "@/app/(app)/accounts/actions";
import { unwrap } from "@/lib/social/action-result";
import type { AccountActions } from "@/services/account-actions";

/** The app: every change is a Server Action. */
export const serverAccountActions: AccountActions = {
  save: async (id, settings) => unwrap(await saveAccountSettingsAction(id, settings)),
  resync: async (id) => unwrap(await resyncAccountAction(id)),
  connect: async () => (await connectMetaAction()).error,
};
