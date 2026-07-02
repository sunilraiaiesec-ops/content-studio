import { format } from "date-fns";

import {
  uploadGeneratedContentAction,
  reviewContentAction,
  saveCaptionAction,
} from "@/app/actions/studio";
import { StatusBadge } from "@/components/content/StatusBadge";
import { FORMAT_LABELS } from "@/lib/constants";
import { getPublicUrl } from "@/lib/storage/local";
import { getDefaultTalent } from "@/lib/talent";
import { prisma } from "@/lib/prisma";

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const talent = await getDefaultTalent();
  const statusFilter = params.status?.toUpperCase();

  const [content, prompts] = await Promise.all([
    prisma.generatedContent.findMany({
      where: {
        talentId: talent.id,
        ...(statusFilter ? { status: statusFilter as never } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { caption: true, hashtagSet: true, prompt: true },
    }),
    prisma.generatedPrompt.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const statuses = ["NEEDS_REVIEW", "APPROVED", "REJECTED", "SCHEDULED", "POSTED"] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Generated Content</h1>
        <p className="mt-1 text-sm text-zinc-500">Review, approve, and prepare content for scheduling.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href="/content" className="rounded-full bg-zinc-900 px-3 py-1 text-sm text-white">
          All
        </a>
        {statuses.map((s) => (
          <a
            key={s}
            href={`/content?status=${s}`}
            className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-200"
          >
            {s.replace("_", " ")}
          </a>
        ))}
      </div>

      <form
        action={uploadGeneratedContentAction}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-zinc-900">Upload generated asset</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input type="file" name="file" accept="image/*,video/*" required className="text-sm" />
          <input name="title" placeholder="Title" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <select name="format" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            <option value="">Format</option>
            {Object.entries(FORMAT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select name="promptId" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            <option value="">Link to prompt (optional)</option>
            {prompts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.promptText.slice(0, 60)}…
              </option>
            ))}
          </select>
          <input name="outfitTags" placeholder="Outfit tags (scheduler diversity)" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="locationTags" placeholder="Location tags" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="moodTags" placeholder="Mood tags" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white">
          Upload content
        </button>
      </form>

      <div className="space-y-6">
        {content.map((item) => (
          <article key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
              {item.type === "PHOTO" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getPublicUrl(item.storageKey)}
                  alt={item.title ?? item.fileName}
                  className="aspect-[4/5] w-full rounded-xl object-cover"
                />
              ) : (
                <video
                  src={getPublicUrl(item.storageKey)}
                  controls
                  className="aspect-[4/5] w-full rounded-xl object-cover"
                />
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-zinc-900">{item.title ?? item.fileName}</h3>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {item.type}
                  {item.format ? ` · ${FORMAT_LABELS[item.format]}` : ""} ·{" "}
                  {format(item.createdAt, "MMM d, yyyy")}
                </p>
                {item.rejectionNote ? (
                  <p className="mt-2 text-sm text-red-600">Rejected: {item.rejectionNote}</p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {(["APPROVED", "NEEDS_REVIEW", "REJECTED"] as const).map((status) => (
                    <form key={status} action={reviewContentAction} className="inline">
                      <input type="hidden" name="contentId" value={item.id} />
                      <input type="hidden" name="status" value={status} />
                      {status === "REJECTED" ? (
                        <input
                          name="rejectionNote"
                          placeholder="Rejection reason"
                          className="mr-2 rounded border border-zinc-300 px-2 py-1 text-xs"
                        />
                      ) : null}
                      <button
                        type="submit"
                        className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-50"
                      >
                        Mark {status.replace("_", " ").toLowerCase()}
                      </button>
                    </form>
                  ))}
                </div>

                <form action={saveCaptionAction} className="mt-4 space-y-2">
                  <input type="hidden" name="contentId" value={item.id} />
                  <textarea
                    name="text"
                    defaultValue={item.caption?.text ?? ""}
                    placeholder="Caption"
                    rows={2}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <input
                    name="tags"
                    defaultValue={item.hashtagSet?.tags.map((t) => `#${t}`).join(" ") ?? ""}
                    placeholder="#hashtags"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <button type="submit" className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-white">
                    Save caption &amp; hashtags
                  </button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!content.length ? <p className="text-sm text-zinc-500">No content yet.</p> : null}
    </div>
  );
}
