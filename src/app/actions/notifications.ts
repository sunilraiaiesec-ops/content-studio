"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/current";
import { getDefaultTalent } from "@/lib/talent";
import { prisma } from "@/lib/prisma";
import { sendReviewReadyNotification, sendWhatsAppText } from "@/lib/notifications/whatsapp";

export async function saveWhatsAppSettingsAction(formData: FormData): Promise<void> {
  await requireSession();
  const talent = await getDefaultTalent();

  const phone = (formData.get("whatsappPhone") as string)?.trim() || null;
  const notifyOnReview = formData.get("whatsappNotifyOnReview") === "on";

  await prisma.talentProfile.update({
    where: { id: talent.id },
    data: {
      whatsappPhone: phone,
      whatsappNotifyOnReview: notifyOnReview,
    },
  });

  revalidatePath("/settings/notifications");
}

export async function testWhatsAppAction(): Promise<{ ok: boolean; message: string }> {
  await requireSession();
  const talent = await getDefaultTalent();

  if (!talent.whatsappPhone?.trim()) {
    return { ok: false, message: "Add a WhatsApp phone number first (E.164 format, e.g. 15551234567)." };
  }

  const base = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3010";
  const result = await sendWhatsAppText(
    talent.whatsappPhone,
    `Content Studio test message — WhatsApp notifications are working for ${talent.displayName}.\n\nReview page: ${base}/content`,
  );

  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  return { ok: true, message: `Test message sent (id: ${result.messageId}).` };
}

export async function testReviewNotificationAction(): Promise<{ ok: boolean; message: string }> {
  await requireSession();
  const talent = await getDefaultTalent();

  if (!talent.whatsappPhone?.trim()) {
    return { ok: false, message: "Add a WhatsApp phone number first (E.164 format, e.g. 15551234567)." };
  }

  const base = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3010";
  const result = await sendReviewReadyNotification({
    to: talent.whatsappPhone,
    talentName: talent.displayName,
    contentTitle: "Sample auto-generated reel",
    contentFormat: "Reel",
    reviewUrl: `${base}/content?status=NEEDS_REVIEW`,
  });

  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  return { ok: true, message: `Review notification sent (id: ${result.messageId}).` };
}
