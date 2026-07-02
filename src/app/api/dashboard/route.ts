import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getDefaultTalent } from "@/lib/talent";
import { getDailyProgress, getGapsForDate } from "@/lib/scheduler";
import type { DailyTargets } from "@/lib/constants";
import { startOfDay } from "date-fns";

export async function GET() {
  const talent = await getDefaultTalent();
  const calendar = await prisma.postingCalendar.findFirst({
    where: { talentId: talent.id },
    orderBy: { createdAt: "desc" },
  });

  const targets = (calendar?.targets ?? {}) as DailyTargets;
  const today = startOfDay(new Date());
  const progress = await getDailyProgress(talent.id, today, targets);

  const [approved, scheduled, posted, needsReview] = await Promise.all([
    prisma.generatedContent.count({ where: { talentId: talent.id, status: "APPROVED" } }),
    prisma.scheduledPost.count({
      where: { content: { talentId: talent.id }, status: "SCHEDULED" },
    }),
    prisma.generatedContent.count({ where: { talentId: talent.id, status: "POSTED" } }),
    prisma.generatedContent.count({ where: { talentId: talent.id, status: "NEEDS_REVIEW" } }),
  ]);

  const weekGaps = await Promise.all(
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return getGapsForDate(talent.id, d, targets);
    }),
  );

  return NextResponse.json({
    progress,
    counts: { approved, scheduled, posted, needsReview },
    weekGapDays: weekGaps.filter((g) => g.length > 0).length,
    calendar,
  });
}
