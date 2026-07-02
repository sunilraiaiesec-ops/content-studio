import { format } from "date-fns";

import {
  createInspirationAction,
  deleteInspirationAction,
} from "@/app/actions/studio";
import { PLATFORM_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function InspirationPage() {
  const items = await prisma.inspirationLink.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Inspiration Library</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Save creator links for style inspiration only — never copy content directly.
        </p>
      </div>

      <form
        action={createInspirationAction}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-zinc-900">Add inspiration link</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            name="url"
            type="url"
            required
            placeholder="Instagram / TikTok / Pinterest / YouTube URL"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
          />
          <select name="platform" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            <option value="">Auto-detect platform</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="TIKTOK">TikTok</option>
          </select>
          <input name="creator" placeholder="Creator" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="outfitStyle" placeholder="Outfit style" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="pose" placeholder="Pose" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="cameraAngle" placeholder="Camera angle" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="transition" placeholder="Transition style" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="background" placeholder="Background" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="mood" placeholder="Mood" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="music" placeholder="Music" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="editingStyle" placeholder="Editing style" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="tags" placeholder="Tags" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <textarea name="caption" placeholder="Caption notes" rows={2} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <textarea name="notes" placeholder="Your notes" rows={2} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white">
          Save inspiration
        </button>
      </form>

      <div className="space-y-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-violet-700 hover:underline"
                >
                  {item.creator ?? item.url}
                </a>
                <p className="mt-1 text-xs text-zinc-500">
                  {item.platform ? PLATFORM_LABELS[item.platform] : "Link"} ·{" "}
                  {format(item.createdAt, "MMM d, yyyy")}
                </p>
              </div>
              <form action={deleteInspirationAction.bind(null, item.id)}>
                <button type="submit" className="text-sm text-red-600 hover:underline">
                  Delete
                </button>
              </form>
            </div>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Outfit", item.outfitStyle],
                ["Pose", item.pose],
                ["Camera", item.cameraAngle],
                ["Transition", item.transition],
                ["Background", item.background],
                ["Mood", item.mood],
                ["Music", item.music],
                ["Editing", item.editingStyle],
              ].map(([label, value]) =>
                value ? (
                  <div key={label as string}>
                    <dt className="text-zinc-400">{label}</dt>
                    <dd className="text-zinc-800">{value}</dd>
                  </div>
                ) : null,
              )}
            </dl>
            {item.notes ? <p className="mt-3 text-sm text-zinc-600">{item.notes}</p> : null}
          </article>
        ))}
      </div>

      {!items.length ? <p className="text-sm text-zinc-500">No inspiration links yet.</p> : null}
    </div>
  );
}
