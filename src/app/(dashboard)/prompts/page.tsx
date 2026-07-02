import { format } from "date-fns";

import { generatePromptAction } from "@/app/actions/studio";
import { StatusBadge } from "@/components/content/StatusBadge";
import { FORMAT_LABELS } from "@/lib/constants";
import { getDefaultTalent } from "@/lib/talent";
import { prisma } from "@/lib/prisma";

export default async function PromptsPage() {
  const talent = await getDefaultTalent();
  const [prompts, inspirations, media] = await Promise.all([
    prisma.generatedPrompt.findMany({
      orderBy: { createdAt: "desc" },
      include: { inspiration: true, mediaRefs: { include: { media: true } } },
    }),
    prisma.inspirationLink.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.originalMedia.findMany({
      where: { talentId: talent.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Prompt Studio</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Generate original Higgsfield-ready prompts from inspiration and reference media.
        </p>
      </div>

      <form
        action={generatePromptAction}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-zinc-900">Generate prompt</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="block text-sm">
            <span className="text-zinc-600">Inspiration link</span>
            <select name="inspirationId" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2">
              <option value="">None</option>
              {inspirations.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.creator ?? i.url.slice(0, 48)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-zinc-600">Target format</span>
            <select name="format" required className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2">
              {Object.entries(FORMAT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm lg:col-span-2">
            <span className="text-zinc-600">Identity reference media</span>
            <select
              name="identityMediaIds"
              multiple
              className="mt-1 h-32 w-full rounded-lg border border-zinc-300 px-3 py-2"
            >
              {media.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title ?? m.fileName}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-zinc-600">Outfit references</span>
            <select
              name="outfitMediaIds"
              multiple
              className="mt-1 h-24 w-full rounded-lg border border-zinc-300 px-3 py-2"
            >
              {media.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title ?? m.fileName}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-zinc-600">Location references</span>
            <select
              name="locationMediaIds"
              multiple
              className="mt-1 h-24 w-full rounded-lg border border-zinc-300 px-3 py-2"
            >
              {media.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title ?? m.fileName}
                </option>
              ))}
            </select>
          </label>
          <textarea
            name="customNotes"
            placeholder="Additional creative direction"
            rows={3}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm lg:col-span-2"
          />
        </div>
        <button type="submit" className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white">
          Generate prompt
        </button>
      </form>

      <div className="space-y-4">
        {prompts.map((prompt) => (
          <article key={prompt.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={prompt.status} />
              <span className="text-xs text-zinc-500">{format(prompt.createdAt, "MMM d, yyyy h:mm a")}</span>
              {prompt.model ? <span className="text-xs text-zinc-400">Model: {prompt.model}</span> : null}
            </div>
            {prompt.inspiration ? (
              <p className="mt-2 text-sm text-violet-700">
                Inspired by: {prompt.inspiration.creator ?? prompt.inspiration.url}
              </p>
            ) : null}
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-zinc-50 p-4 text-sm text-zinc-800">
              {prompt.promptText}
            </pre>
            {prompt.negativePrompt ? (
              <p className="mt-2 text-xs text-zinc-500">Negative: {prompt.negativePrompt}</p>
            ) : null}
          </article>
        ))}
      </div>

      {!prompts.length ? <p className="text-sm text-zinc-500">No prompts generated yet.</p> : null}
    </div>
  );
}
