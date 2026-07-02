import { requireSession } from "@/lib/auth/current";
import { getDefaultTalent } from "@/lib/talent";
import { AppShell } from "@/components/layout/AppShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const talent = await getDefaultTalent();

  return (
    <AppShell userName={session.name} talentName={talent.displayName}>
      {children}
    </AppShell>
  );
}
