import { redirect } from "next/navigation";

import { getSession, type SessionPayload } from "@/lib/auth/session";

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function getOptionalSession(): Promise<SessionPayload | null> {
  return getSession();
}
