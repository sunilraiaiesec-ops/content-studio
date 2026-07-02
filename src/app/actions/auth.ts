"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export async function loginAction(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return;
  }

  await createSession({ userId: user.id, email: user.email, name: user.name });
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function ensureSeedUser() {
  const count = await prisma.user.count();
  if (count > 0) return;

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@contentstudio.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  const name = process.env.SEED_ADMIN_NAME ?? "Studio Admin";
  const talentName = process.env.SEED_TALENT_NAME ?? "Talent";

  const passwordHash = await hashPassword(password);
  const slug = talentName.toLowerCase().replace(/\s+/g, "-");

  const { addDays, startOfDay } = await import("date-fns");
  const { DEFAULT_DAILY_TARGETS } = await import("@/lib/constants");

  await prisma.$transaction(async (tx) => {
    await tx.user.create({ data: { email, name, passwordHash, role: "ADMIN" } });
    const talent = await tx.talentProfile.create({
      data: { displayName: talentName, slug },
    });
    const start = startOfDay(new Date());
    await tx.postingCalendar.create({
      data: {
        talentId: talent.id,
        name: "60-Day Growth Sprint",
        startDate: start,
        endDate: addDays(start, 59),
        targets: DEFAULT_DAILY_TARGETS,
      },
    });
  });
}
