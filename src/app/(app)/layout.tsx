import { AppShell } from "@/components/AppShell";
import { verifySession } from "@/lib/dal";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await verifySession();

  return <AppShell>{children}</AppShell>;
}
