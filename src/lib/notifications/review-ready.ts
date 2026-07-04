import type { GeneratedContent, TalentProfile } from "@/generated/prisma/client";
import { FORMAT_LABELS } from "@/lib/constants";
import { sendReviewReadyNotification } from "@/lib/notifications/whatsapp";

function getReviewUrl(): string {
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3010";
  return `${base}/content?status=NEEDS_REVIEW`;
}

export async function notifyContentNeedsReview(
  content: Pick<GeneratedContent, "id" | "title" | "format">,
  talent: Pick<TalentProfile, "displayName" | "whatsappPhone" | "whatsappNotifyOnReview">,
): Promise<void> {
  if (!talent.whatsappNotifyOnReview || !talent.whatsappPhone?.trim()) {
    return;
  }

  const formatLabel = content.format ? FORMAT_LABELS[content.format] : "Content";
  const title = content.title ?? "New generated content";

  try {
    const result = await sendReviewReadyNotification({
      to: talent.whatsappPhone,
      talentName: talent.displayName,
      contentTitle: title,
      contentFormat: formatLabel,
      reviewUrl: getReviewUrl(),
    });

    if (!result.ok) {
      console.error("[whatsapp] review notification failed:", result.error);
    }
  } catch (error) {
    console.error("[whatsapp] review notification error:", error);
  }
}
