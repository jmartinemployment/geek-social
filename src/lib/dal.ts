import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";

/**
 * The data access layer: the one place a Server Component or Server Action learns who is signed in. It
 * returns claims only, never a token, so nothing it hands out can leak one into rendered output.
 * `proxy.ts` checks the same cookie ahead of the request; this is the check that cannot be skipped by
 * a route the proxy's matcher does not list.
 */

export interface VerifiedSession {
  userId: string;
  name: string | null;
  email: string | null;
  roles: string[];
}

/** The signed-in person, or a redirect to sign-in. Memoised for the duration of one render. */
export const verifySession = cache(async (): Promise<VerifiedSession> => {
  const session = await readSession(await cookies());
  if (!session) redirect("/api/auth/login");
  return {
    userId: session.user.sub,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    roles: session.user.roles,
  };
});

/** The signed-in person, who must hold `role`. Anyone else gets a thrown error, shown by the error boundary. */
export async function requireRole(role: string): Promise<VerifiedSession> {
  const user = await verifySession();
  if (!user.roles.includes(role)) {
    throw new Error(`This page needs the ${role} role, which this account does not have.`);
  }
  return user;
}
