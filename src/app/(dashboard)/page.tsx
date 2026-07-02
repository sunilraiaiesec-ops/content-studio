import { addDays, format, startOfDay } from "date-fns";

import { fillScheduleAction, fillWeekScheduleAction } from "@/app/actions/studio";
import { AutoGeneratePanel } from "@/components/dashboard/AutoGeneratePanel";
import { DailyTargetTracker, StatCard } from "@/components/dashboard/DailyTargetTracker";
import type { DailyTargets } from "@/lib/constants";
import { getDailyProgress, getActiveCalendar } from "@/lib/scheduler";
import { getDefaultTalent } from "@/lib/talent";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const talent = await getDefaultTalent();
  const calendar = await getActiveCalendar(talent.id);
  const targets = (calendar?.targets ?? {
    instagram: { story: 20, reel: 5, feed_post: 0 },
    tiktok: { video: 5 },
  }) as DailyTargets;

  const today = startOfDay(new Date());
  const progress = await getDailyProgress(talent.id, today, targets);

  const [approved, scheduled, posted, needsReview, inspirationCount, mediaCount] =
    await Promise.all([
      prisma.generatedContent.count({ where: { talentId: talent.id, status: "APPROVED" } }),
      prisma.scheduledPost.count({
        where: { content: { talentId: talent.id }, status: "SCHEDULED" },
      }),
      prisma.generatedContent.count({ where: { talentId: talent.id, status: "POSTED" } }),
      prisma.generatedContent.count({ where: { talentId: talent.id, status: "NEEDS_REVIEW" } }),
      prisma.inspirationLink.count(),
      prisma.originalMedia.count({ where: { talentId: talent.id } }),
    ]);

  const daysRemaining = calendar
    ? Math.max(0, Math.ceil((calendar.endDate.getTime() - today.getTime()) / 86400000))
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {calendar
              ? `${calendar.name} · ${daysRemaining} days remaining · ends ${format(calendar.endDate, "MMM d, yyyy")}`
              : "No active calendar"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={fillScheduleAction}>
            <input type="hidden" name="date" value={today.toISOString()} />
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              Fill today&apos;s schedule
            </button>
          </form>
          <form action={fillWeekScheduleAction}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Fill next 7 days
            </button>
          </form>
        </div>
      </div>

      <AutoGeneratePanel />

      <DailyTargetTracker
        target={progress.target}
        filled={progress.filled}
        posted={progress.posted}
        scheduled={progress.scheduled}
        gapCount={progress.gapCount}
        gaps={progress.gaps}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Approved backlog" value={approved} accent="emerald" />
        <StatCard label="Scheduled" value={scheduled} accent="blue" />
        <StatCard label="Posted total" value={posted} accent="violet" />
        <StatCard label="Needs review" value={needsReview} accent="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-zinc-900">Library snapshot</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-zinc-500">Original media</dt>
              <dd className="text-2xl font-bold text-zinc-900">{mediaCount}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Inspiration links</dt>
              <dd className="text-2xl font-bold text-zinc-900">{inspirationCount}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-zinc-900">60-day sprint targets</h2>
          <ul className="mt-4 space-y-2 text-sm text-zinc-600">
            <li>Instagram Stories: {targets.instagram.story}/day</li>
            <li>Instagram Reels: {targets.instagram.reel}/day</li>
            <li>TikTok videos: {targets.tiktok.video}/day</li>
          </ul>
          {calendar ? (
            <p className="mt-4 text-xs text-zinc-400">
              Sprint: {format(calendar.startDate, "MMM d")} –{" "}
              {format(calendar.endDate, "MMM d, yyyy")}
            </p>
          ) : null}
        </div>
      </div>

      {progress.gapCount > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-semibold text-amber-900">Content gaps today</h2>
          <p className="mt-2 text-sm text-amber-800">
            Approve more content or upload generated assets, then run &quot;Fill today&apos;s
            schedule&quot;.
          </p>
        </div>
      ) : null}
    </div>
  );
}
