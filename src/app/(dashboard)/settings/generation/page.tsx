import Link from "next/link";

import { saveSoulIdAction } from "@/app/actions/generation";
import { isHiggsfieldConfigured, isPublicMediaUrlAvailable } from "@/lib/higgsfield/config";
import { getDefaultTalent } from "@/lib/talent";
import { prisma } from "@/lib/prisma";

export default async function GenerationSettingsPage() {
  const talent = await getDefaultTalent();
  const configured = isHiggsfieldConfigured();
  const publicUrls = isPublicMediaUrlAvailable();

  const recentJobs = await prisma.generationJob.findMany({
    where: { talentId: talent.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Generation Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Higgsfield auto-generation — all output requires your approval before scheduling or
          posting.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-zinc-900">Connection status</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Higgsfield API</dt>
            <dd className={configured ? "text-emerald-700" : "text-red-700"}>
              {configured ? "Configured in .env" : "Missing HIGGSFIELD_CREDENTIALS"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Public media URLs</dt>
            <dd className={publicUrls ? "text-emerald-700" : "text-amber-700"}>
              {publicUrls
                ? process.env.PUBLIC_BASE_URL
                : "localhost — video/image-ref limited; use ngrok or deploy for full quality"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Cron automation</dt>
            <dd className="text-zinc-700">
              POST /api/cron/generate with Bearer CRON_SECRET (optional)
            </dd>
          </div>
        </dl>
      </div>

      <form
        action={saveSoulIdAction}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-zinc-900">Higgsfield Soul ID (optional)</h2>
        <p className="mt-1 text-sm text-zinc-500">
          If you created a Soul character in Higgsfield from her photos, paste the ID here for
          better identity consistency — especially when running on localhost.
        </p>
        <input
          name="higgsfieldSoulId"
          defaultValue={talent.higgsfieldSoulId ?? ""}
          placeholder="Soul character ID from Higgsfield"
          className="mt-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
        >
          Save Soul ID
        </button>
      </form>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
        <h2 className="font-semibold text-zinc-900">How Phase A works</h2>
        <ol className="mt-3 list-inside list-decimal space-y-2">
          <li>You upload photos/videos anytime in Media Library.</li>
          <li>You add Inspiration links when you find Reels you like.</li>
          <li>Click Generate on the Dashboard — system picks inputs and calls Higgsfield.</li>
          <li>Output appears in Content with status Needs Review.</li>
          <li>You approve or reject — only approved content can be scheduled.</li>
        </ol>
        <p className="mt-4">
          <Link href="/" className="text-violet-700 underline">
            Back to Dashboard
          </Link>{" "}
          to run generation.
        </p>
      </div>

      {recentJobs.length ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-zinc-900">Recent generation jobs</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {recentJobs.map((job) => (
              <li key={job.id} className="text-zinc-600">
                {job.status} · {job.format} · {job.createdAt.toLocaleString()}
                {job.errorMessage ? ` — ${job.errorMessage}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
