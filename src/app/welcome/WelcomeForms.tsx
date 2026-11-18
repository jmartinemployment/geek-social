"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useToast } from "@/components/Toaster";
import { checkboxClass, inputClass, labelClass, primaryButton } from "@/components/ui";
import type { WelcomeState } from "@/app/welcome/actions";
import type { SocialTenant } from "@/lib/social/types";

type WelcomeAction = (previous: WelcomeState, formData: FormData) => Promise<WelcomeState>;

const INITIAL: WelcomeState = { error: null };

/** An error is said inline, where it happened, and also as a toast that stays until it is dismissed. */
function useReportedError(state: WelcomeState) {
  const toast = useToast();
  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state, toast]);
}

function SignUpForm({ action }: { action: WelcomeAction }) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  useReportedError(state);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className={labelClass}>
        Business name
        {/* React clears a form after its action runs, so what was typed comes back through the state or it would be lost.
            It starts empty: the sign-in knows nothing about the business, and its "name" is the login, an email address. */}
        <input name="name" required defaultValue={state.name ?? ""} autoComplete="organization" className={inputClass} />
      </label>
      {state.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={`${primaryButton} self-start`}>
        {pending ? "Signing up..." : "Sign up for GeekSocial"}
      </button>
    </form>
  );
}

function AiTermsForm({ action }: { action: WelcomeAction }) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  useReportedError(state);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <p className="text-sm text-foreground">
        GeekSocial can draft replies to the comments on your accounts with an AI provider. To do that, it sends the text of
        a comment, the commenter&apos;s name and the post it is under to the AI provider, for your business only. When you ask
        it to suggest a post, it sends the article&apos;s address, title and summary, and your business&apos;s name. A person on
        your team approves every reply before anything is posted, and comments are kept for at most 30 days. Until you
        agree, comments are held and nothing is sent to the AI provider, and you write the replies and posts yourself.
      </p>
      <label className="flex items-start gap-2 text-sm font-medium text-foreground">
        <input type="checkbox" name="agree" required className={`${checkboxClass} mt-0.5`} />
        <span>
          I agree that GeekSocial may send my comments, with the commenters&apos; names, and the articles I ask it to post
          about, to an AI provider to draft replies and posts for me.
        </span>
      </label>
      {state.error ? (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={`${primaryButton} self-start`}>
        {pending ? "Saving..." : "Agree"}
      </button>
    </form>
  );
}

/**
 * The welcome page's forms, the only client code on it. Each is a plain form whose action is a Server Action,
 * so it works the same with or without JavaScript and never reloads the page itself. The actions come in as
 * props from the Server Component that renders this.
 */
export function WelcomeForms({
  tenant,
  signUp,
  acceptTerms,
}: {
  tenant: SocialTenant | null;
  signUp: WelcomeAction;
  acceptTerms: WelcomeAction;
}) {
  if (!tenant) return <SignUpForm action={signUp} />;

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="ai-terms-heading" className="flex flex-col gap-3">
        <h2 id="ai-terms-heading" className="text-lg font-semibold text-foreground">
          Replies drafted by AI
        </h2>
        {tenant.aiConsentAcceptedAt ? (
          <p className="text-sm text-foreground">
            You agreed on {new Date(tenant.aiConsentAcceptedAt).toLocaleDateString("en-US", { dateStyle: "long" })}. Comments on your
            accounts are drafted for you to approve.
          </p>
        ) : (
          <AiTermsForm action={acceptTerms} />
        )}
      </section>
      <Link href="/" className={`${primaryButton} self-start`}>
        Open the inbox
      </Link>
    </div>
  );
}
