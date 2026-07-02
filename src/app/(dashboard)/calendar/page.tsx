import { startOfWeek } from "date-fns";

import { fillScheduleAction, fillWeekScheduleAction } from "@/app/actions/studio";
import { CalendarView } from "@/components/calendar/CalendarView";
import type { DailyTargets } from "@/lib/constants";
import { getActiveCalendar } from "@/lib/scheduler";
import { getDefaultTalent } from "@/lib/talent";
import { prisma } from "@/lib/prisma";

export default async function CalendarPage() {
  const talent = await getDefaultTalent();
  const calendar = await getActiveCalendar(talent.id);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const posts = await prisma.scheduledPost.findMany({
    where: { content: { talentId: talent.id } },
    orderBy: { scheduledAt: "asc" },
    include: {
      content: { select: { title: true, fileName: true } },
    },
  });

  const serialized = posts.map((p) => ({
    ...p,
    scheduledAt: p.scheduledAt.toISOString(),
  }));

  const targets = (calendar?.targets ?? {}) as DailyTargets;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Content Calendar</h1>
          <p className="mt-1 text-sm text-zinc-500">
            60-day sprint scheduling with drag-free rescheduling via datetime picker.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={fillScheduleAction}>
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
            >
              Auto-fill today
            </button>
          </form>
          <form action={fillWeekScheduleAction}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium"
            >
              Auto-fill week
            </button>
          </form>
        </div>
      </div>

      {calendar ? (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
          Active calendar: <strong>{calendar.name}</strong> · Daily targets: IG Stories{" "}
          {targets.instagram?.story ?? 0}, Reels {targets.instagram?.reel ?? 0}, TikTok{" "}
          {targets.tiktok?.video ?? 0}
        </div>
      ) : null}

      <CalendarView posts={serialized} weekStart={weekStart.toISOString()} />
    </div>
  );
}
