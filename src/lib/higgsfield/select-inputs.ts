import type { InspirationLink, OriginalMedia, PostFormat } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const ARCHIVE_TAG_PATTERN = /archive|age-0|age-1|age-2|family/i;

export async function pickInspiration(talentId: string): Promise<InspirationLink | null> {
  const recentJobInspirationIds = (
    await prisma.generationJob.findMany({
      where: { talentId, inspirationId: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { inspirationId: true },
    })
  ).map((j) => j.inspirationId as string);

  const candidates = await prisma.inspirationLink.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (!candidates.length) return null;

  const fresh = candidates.filter((c) => !recentJobInspirationIds.includes(c.id));
  return fresh[0] ?? candidates[0];
}

export async function pickIdentityMedia(talentId: string, limit = 3): Promise<OriginalMedia[]> {
  const all = await prisma.originalMedia.findMany({
    where: { talentId, type: "PHOTO" },
    orderBy: { createdAt: "desc" },
  });

  const solo = all.filter((m) => {
    const tagBlob = [...m.tags, ...m.moodTags].join(" ");
    return !ARCHIVE_TAG_PATTERN.test(tagBlob);
  });

  return solo.slice(0, limit);
}

export function defaultFormatForOutput(type: "PHOTO" | "VIDEO", requested?: PostFormat): PostFormat {
  if (requested) return requested;
  return type === "VIDEO" ? "REEL" : "FEED_POST";
}
