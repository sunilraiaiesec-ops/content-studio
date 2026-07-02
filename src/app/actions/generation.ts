"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/current";
import { getDefaultTalent } from "@/lib/talent";
import { prisma } from "@/lib/prisma";

export async function saveSoulIdAction(formData: FormData): Promise<void> {
  await requireSession();
  const talent = await getDefaultTalent();
  const soulId = (formData.get("higgsfieldSoulId") as string)?.trim() || null;

  await prisma.talentProfile.update({
    where: { id: talent.id },
    data: { higgsfieldSoulId: soulId },
  });

  revalidatePath("/settings/generation");
  revalidatePath("/");
}
