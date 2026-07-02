import { addDays, startOfDay, isWithinInterval } from "date-fns";

import type { DailyTargets } from "@/lib/constants";
import { DEFAULT_DAILY_TARGETS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { Platform, PostFormat } from "@/generated/prisma/client";

export type ScheduleSlot = {
  platform: Platform;
  format: PostFormat;
  count: number;
};

export function getDailySlots(targets: DailyTargets = DEFAULT_DAILY_TARGETS): ScheduleSlot[] {
  return [
    ...Array.from({ length: targets.instagram.story }, () => ({
      platform: "INSTAGRAM" as Platform,
      format: "STORY" as PostFormat,
      count: 1,
    })),
    ...Array.from({ length: targets.instagram.reel }, () => ({
      platform: "INSTAGRAM" as Platform,
      format: "REEL" as PostFormat,
      count: 1,
    })),
    ...Array.from({ length: targets.instagram.feed_post }, () => ({
      platform: "INSTAGRAM" as Platform,
      format: "FEED_POST" as PostFormat,
      count: 1,
    })),
    ...Array.from({ length: targets.tiktok.video }, () => ({
      platform: "TIKTOK" as Platform,
      format: "TIKTOK_VIDEO" as PostFormat,
      count: 1,
    })),
  ];
}

export function totalDailySlots(targets: DailyTargets = DEFAULT_DAILY_TARGETS): number {
  return (
    targets.instagram.story +
    targets.instagram.reel +
    targets.instagram.feed_post +
    targets.tiktok.video
  );
}

type GapResult = {
  date: Date;
  platform: Platform;
  format: PostFormat;
  needed: number;
  scheduled: number;
};

export async function getGapsForDate(
  talentId: string,
  date: Date,
  targets: DailyTargets = DEFAULT_DAILY_TARGETS,
): Promise<GapResult[]> {
  const dayStart = startOfDay(date);
  const dayEnd = addDays(dayStart, 1);

  const scheduled = await prisma.scheduledPost.findMany({
    where: {
      scheduledAt: { gte: dayStart, lt: dayEnd },
      content: { talentId },
      status: { in: ["SCHEDULED", "POSTED"] },
    },
  });

  const gaps: GapResult[] = [];
  const groups: { platform: Platform; format: PostFormat; target: number }[] = [
    { platform: "INSTAGRAM", format: "STORY", target: targets.instagram.story },
    { platform: "INSTAGRAM", format: "REEL", target: targets.instagram.reel },
    { platform: "INSTAGRAM", format: "FEED_POST", target: targets.instagram.feed_post },
    { platform: "TIKTOK", format: "TIKTOK_VIDEO", target: targets.tiktok.video },
  ];

  for (const g of groups) {
    if (g.target === 0) continue;
    const count = scheduled.filter((s) => s.platform === g.platform && s.format === g.format).length;
    if (count < g.target) {
      gaps.push({
        date: dayStart,
        platform: g.platform,
        format: g.format,
        needed: g.target,
        scheduled: count,
      });
    }
  }

  return gaps;
}

export async function getDailyProgress(
  talentId: string,
  date: Date,
  targets: DailyTargets = DEFAULT_DAILY_TARGETS,
) {
  const dayStart = startOfDay(date);
  const dayEnd = addDays(dayStart, 1);

  const scheduled = await prisma.scheduledPost.findMany({
    where: {
      scheduledAt: { gte: dayStart, lt: dayEnd },
      content: { talentId },
    },
    include: { content: true },
  });

  const posted = scheduled.filter((s) => s.status === "POSTED").length;
  const scheduledCount = scheduled.filter((s) => s.status === "SCHEDULED").length;
  const target = totalDailySlots(targets);
  const gaps = await getGapsForDate(talentId, date, targets);

  return {
    date: dayStart,
    target,
    scheduled: scheduledCount,
    posted,
    filled: scheduled.length,
    gaps,
    gapCount: gaps.reduce((sum, g) => sum + (g.needed - g.scheduled), 0),
  };
}

function formatMatchesContent(format: PostFormat, contentFormat: PostFormat | null, type: string): boolean {
  if (!contentFormat) {
    if (format === "STORY" || format === "REEL" || format === "TIKTOK_VIDEO") return type === "VIDEO";
    return type === "PHOTO";
  }
  return contentFormat === format;
}

export async function fillScheduleForDate(
  talentId: string,
  calendarId: string,
  date: Date,
  targets: DailyTargets = DEFAULT_DAILY_TARGETS,
): Promise<number> {
  const dayStart = startOfDay(date);
  const gaps = await getGapsForDate(talentId, date, targets);
  if (!gaps.length) return 0;

  const recentPosts = await prisma.scheduledPost.findMany({
    where: {
      content: { talentId },
      scheduledAt: { gte: addDays(dayStart, -7) },
    },
    include: {
      content: {
        include: { prompt: { include: { inspiration: true } } },
      },
    },
  });

  const recentTags = {
    outfits: new Set<string>(),
    locations: new Set<string>(),
    moods: new Set<string>(),
  };
  for (const p of recentPosts) {
    const meta = p.content.metadata as { outfitTags?: string[]; locationTags?: string[]; moodTags?: string[] } | null;
    meta?.outfitTags?.forEach((t) => recentTags.outfits.add(t));
    meta?.locationTags?.forEach((t) => recentTags.locations.add(t));
    meta?.moodTags?.forEach((t) => recentTags.moods.add(t));
  }

  const usedContentIds = new Set(
    (
      await prisma.scheduledPost.findMany({
        where: { content: { talentId }, scheduledAt: { gte: dayStart, lt: addDays(dayStart, 1) } },
        select: { contentId: true },
      })
    ).map((s) => s.contentId),
  );

  const approved = await prisma.generatedContent.findMany({
    where: { talentId, status: "APPROVED" },
    orderBy: { createdAt: "asc" },
  });

  let created = 0;
  let slotIndex = 0;

  for (const gap of gaps) {
    const need = gap.needed - gap.scheduled;
    for (let i = 0; i < need; i++) {
      const candidates = approved
        .filter((c) => !usedContentIds.has(c.id))
        .filter((c) => formatMatchesContent(gap.format, c.format, c.type))
        .map((c) => {
          const meta = c.metadata as { outfitTags?: string[]; locationTags?: string[]; moodTags?: string[] } | null;
          let score = 100;
          meta?.outfitTags?.forEach((t) => {
            if (recentTags.outfits.has(t)) score -= 20;
          });
          meta?.locationTags?.forEach((t) => {
            if (recentTags.locations.has(t)) score -= 15;
          });
          meta?.moodTags?.forEach((t) => {
            if (recentTags.moods.has(t)) score -= 10;
          });
          return { content: c, score };
        })
        .sort((a, b) => b.score - a.score);

      const pick = candidates[0]?.content;
      if (!pick) break;

      const hour = 8 + Math.floor((slotIndex * 13) / Math.max(totalDailySlots(targets), 1));
      const scheduledAt = new Date(dayStart);
      scheduledAt.setHours(hour, (slotIndex * 7) % 60, 0, 0);

      await prisma.$transaction([
        prisma.scheduledPost.create({
          data: {
            calendarId,
            contentId: pick.id,
            platform: gap.platform,
            format: gap.format,
            scheduledAt,
            status: "SCHEDULED",
            publishMode: gap.format === "STORY" ? "MANUAL" : "AUTO",
          },
        }),
        prisma.generatedContent.update({
          where: { id: pick.id },
          data: { status: "SCHEDULED" },
        }),
      ]);

      usedContentIds.add(pick.id);
      created++;
      slotIndex++;
    }
  }

  return created;
}

export async function getActiveCalendar(talentId: string) {
  const today = startOfDay(new Date());
  return prisma.postingCalendar.findFirst({
    where: {
      talentId,
      startDate: { lte: today },
      endDate: { gte: today },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function isDateInCalendar(date: Date, start: Date, end: Date): boolean {
  return isWithinInterval(startOfDay(date), { start: startOfDay(start), end: startOfDay(end) });
}
