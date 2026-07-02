import type { DailyTargets } from "@/lib/constants";
import { FORMAT_LABELS, PLATFORM_LABELS } from "@/lib/constants";
import type { Platform, PostFormat } from "@/generated/prisma/client";

type Gap = {
  platform: Platform;
  format: PostFormat;
  needed: number;
  scheduled: number;
};

export function DailyTargetTracker({
  target,
  filled,
  posted,
  scheduled,
  gapCount,
  gaps,
}: {
  target: number;
  filled: number;
  posted: number;
  scheduled: number;
  gapCount: number;
  gaps: Gap[];
}) {
  const pct = target > 0 ? Math.min(100, Math.round((filled / target) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Today&apos;s Targets</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {filled} of {target} slots filled · {posted} posted · {scheduled} scheduled
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-violet-600">{pct}%</p>
          <p className="text-xs text-zinc-500">daily progress</p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-violet-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {gapCount > 0 ? (
        <div className="mt-4 rounded-xl bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">
            {gapCount} slot{gapCount === 1 ? "" : "s"} still needed today
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {gaps.map((g, i) => (
              <li key={i}>
                {PLATFORM_LABELS[g.platform]} {FORMAT_LABELS[g.format]} — {g.scheduled}/{g.needed}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm text-emerald-700">All daily slots are filled.</p>
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = "violet",
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: "violet" | "blue" | "emerald" | "amber";
}) {
  const accents = {
    violet: "text-violet-600",
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accents[accent]}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-400">{hint}</p> : null}
    </div>
  );
}
