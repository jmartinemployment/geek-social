"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge, ErrorNote, Panel, primaryButton } from "@/components/ui";
import { metaRedirectUri } from "@/lib/social/connect";
import type { MetaConnectComplete } from "@/lib/social/types";
import { accountStatusWords, platformWords } from "@/lib/social/words";
import { completeMetaConnect, errorText } from "@/services/social-api";

/**
 * Finishes a Meta connect: Meta returns `?code=&state=` (or `?error=`), and the code is handed to
 * GeekAPI's complete route once. The code is single-use, so a second call would fail and hide a
 * connect that worked.
 */
export function MetaCallbackClient() {
  const params = useSearchParams();
  const [result, setResult] = useState<MetaConnectComplete | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const completed = useRef<string | null>(null);

  const code = params.get("code");
  const state = params.get("state");
  const metaError = params.get("error");
  const metaReason = params.get("error_reason");
  const metaDescription = params.get("error_description");

  const paramError = metaError
    ? `Meta did not connect the Page: ${metaDescription || metaReason || metaError}${
        metaReason === "user_denied" ? " (permission was declined on Meta's screen)" : ""
      }`
    : !code
      ? "Meta sent you back without a code, so nothing can be connected."
      : !state
        ? "Meta sent you back without the state GeekSocial gave it, so the connect cannot be checked."
        : null;

  useEffect(() => {
    if (paramError || !code || !state) return;
    if (completed.current === code) return;
    completed.current = code;

    void (async () => {
      try {
        setResult(await completeMetaConnect(code, state, metaRedirectUri()));
      } catch (err) {
        setCompleteError(errorText(err));
      }
    })();
  }, [paramError, code, state]);

  const error = paramError ?? (completeError ? `The connect was not completed: ${completeError}` : null);

  if (error) {
    return (
      <Panel>
        <ErrorNote message={error} />
        <p className="mt-3 text-sm text-muted">
          A connect is valid for 15 minutes and only for the person who started it.
        </p>
        <Link href="/accounts" className={`${primaryButton} mt-4 inline-block`}>
          Back to Accounts
        </Link>
      </Panel>
    );
  }

  if (!result) {
    return (
      <Panel>
        <p className="text-sm text-muted">Completing the connect with GeekAPI…</p>
      </Panel>
    );
  }

  return (
    <Panel title="Connected">
      {result.accounts.length === 0 ? (
        <ErrorNote message="GeekAPI completed the connect but returned no Pages. Nothing was connected; check which Pages were chosen on Meta's screen." />
      ) : (
        <ul className="flex flex-col gap-2">
          {result.accounts.map((account) => {
            const subscription = result.subscriptions.find((s) => s.accountId === account.id);
            return (
              <li key={account.id} className="rounded-lg border border-border bg-background px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{account.displayName}</span>
                  <Badge tone={account.status === "connected" ? "good" : "bad"}>
                    {accountStatusWords(account.status)}
                  </Badge>
                  <span className="text-xs text-muted">{platformWords(account.platform)}</span>
                </div>
                {subscription?.active ? (
                  <p className="mt-1 text-sm text-green-700">Comment updates are on for this Page.</p>
                ) : (
                  <p className="mt-1 text-sm text-red-600">
                    {subscription
                      ? "Comment updates are not on for this Page, so new comments will not arrive. Connect again to retry."
                      : "GeekAPI returned no comment-update subscription for this Page, so new comments may not arrive. Connect again to retry."}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Link href="/accounts" className={`${primaryButton} mt-4 inline-block`}>
        Back to Accounts
      </Link>
    </Panel>
  );
}
