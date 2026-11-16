import { WelcomeForms } from "@/app/welcome/WelcomeForms";
import { acceptAiTermsAction, createTenantAction } from "@/app/welcome/actions";
import { verifySession } from "@/lib/dal";
import { getTenant } from "@/lib/server/tenant";

/**
 * Where a person who has not signed up for GeekSocial lands, and where a tenant answers the AI terms. Rendered on
 * the server with the person's tenant already read, so the page arrives complete; its two forms are Server Actions.
 * It sits outside the app shell, which needs a tenant before it opens its live connection.
 */
export default async function WelcomePage() {
  const user = await verifySession();
  const tenant = await getTenant();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <p className="font-display text-3xl font-semibold tracking-tight text-foreground">GeekSocial</p>
      <h1 className="text-xl font-semibold text-foreground">{tenant ? `Welcome, ${tenant.name}` : "Set up your account"}</h1>
      <WelcomeForms tenant={tenant} suggestedName={user.name ?? ""} signUp={createTenantAction} acceptTerms={acceptAiTermsAction} />
    </main>
  );
}
