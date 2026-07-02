"use client";

import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

import { StatusBadge } from "@/components/content/StatusBadge";
import { FORMAT_LABELS, PLATFORM_LABELS } from "@/lib/constants";
import { reschedulePostAction, deleteScheduledPostAction } from "@/app/actions/studio";

type CalendarPost = {
  id: string;
  scheduledAt: string;
  platform: "INSTAGRAM" | "TIKTOK";
  format: "FEED_POST" | "REEL" | "STORY" | "TIKTOK_VIDEO" | "CAROUSEL";
  status: "DRAFT" | "NEEDS_REVIEW" | "APPROVED" | "REJECTED" | "SCHEDULED" | "POSTED";
  publishMode: "AUTO" | "MANUAL";
  content: { title: string | null; fileName: string };
};

export function CalendarView({
  posts,
  weekStart,
}: {
  posts: CalendarPost[];
  weekStart: string;
}) {
  const start = startOfWeek(new Date(weekStart), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const [view, setView] = useState<"week" | "day">("week");
  const [selectedDay, setSelectedDay] = useState(start);

  const postsForDay = (day: Date) =>
    posts.filter((p) => isSameDay(new Date(p.scheduledAt), day));

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setView("week")}
          className={`rounded-lg px-3 py-1.5 text-sm ${view === "week" ? "bg-violet-100 text-violet-700" : "bg-zinc-100"}`}
        >
          Week
        </button>
        <button
          type="button"
          onClick={() => setView("day")}
          className={`rounded-lg px-3 py-1.5 text-sm ${view === "day" ? "bg-violet-100 text-violet-700" : "bg-zinc-100"}`}
        >
          Day
        </button>
      </div>

      {view === "week" ? (
        <div className="grid gap-3 lg:grid-cols-7">
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="min-h-48 rounded-xl border border-zinc-200 bg-white p-3"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedDay(day);
                  setView("day");
                }}
                className="mb-2 text-left"
              >
                <p className="text-xs font-medium uppercase text-zinc-400">
                  {format(day, "EEE")}
                </p>
                <p className="text-lg font-semibold text-zinc-900">{format(day, "d")}</p>
              </button>
              <div className="space-y-2">
                {postsForDay(day).slice(0, 4).map((post) => (
                  <div
                    key={post.id}
                    className="rounded-lg border border-zinc-100 bg-zinc-50 p-2 text-xs"
                  >
                    <p className="font-medium text-zinc-800">
                      {PLATFORM_LABELS[post.platform]} · {FORMAT_LABELS[post.format]}
                    </p>
                    <p className="truncate text-zinc-500">
                      {post.content.title ?? post.content.fileName}
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={post.status} />
                    </div>
                  </div>
                ))}
                {postsForDay(day).length > 4 ? (
                  <p className="text-xs text-zinc-400">+{postsForDay(day).length - 4} more</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h3 className="text-lg font-semibold">{format(selectedDay, "EEEE, MMM d")}</h3>
          <div className="mt-4 space-y-3">
            {postsForDay(selectedDay).map((post) => (
              <div
                key={post.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-100 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-zinc-900">
                    {format(new Date(post.scheduledAt), "h:mm a")} —{" "}
                    {PLATFORM_LABELS[post.platform]} {FORMAT_LABELS[post.format]}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {post.content.title ?? post.content.fileName} · {post.publishMode}
                  </p>
                  <StatusBadge status={post.status} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={reschedulePostAction}>
                    <input type="hidden" name="postId" value={post.id} />
                    <input
                      type="datetime-local"
                      name="scheduledAt"
                      defaultValue={format(new Date(post.scheduledAt), "yyyy-MM-dd'T'HH:mm")}
                      className="rounded-lg border border-zinc-200 px-2 py-1 text-sm"
                    />
                    <button
                      type="submit"
                      className="ml-2 rounded-lg bg-zinc-900 px-3 py-1 text-sm text-white"
                    >
                      Move
                    </button>
                  </form>
              <form action={deleteScheduledPostAction.bind(null, post.id)}>
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600"
                >
                  Remove
                </button>
              </form>
                </div>
              </div>
            ))}
            {!postsForDay(selectedDay).length ? (
              <p className="text-sm text-zinc-500">No posts scheduled for this day.</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
