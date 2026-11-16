import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { verifySession } from "@/lib/dal";
import { getTenant } from "@/lib/server/tenant";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await verifySession();

  // Every GeekAPI route answers 403 until the person has signed up, and the live connection is refused, so they
  // are sent to sign up before the app shell opens. A failure to read the tenant throws and the error page says so.
  if (!(await getTenant())) redirect("/welcome");

  return <AppShell>{children}</AppShell>;
}
