import { format } from "date-fns";

import { markPostedAction } from "@/app/actions/studio";
import { StatusBadge } from "@/components/content/StatusBadge";
import { FORMAT_LABELS, PLATFORM_LABELS } from "@/lib/constants";
import { getPublicUrl } from "@/lib/storage/local";
import { getDefaultTalent } from "@/lib/talent";
import { prisma } from "@/lib/prisma";

export default async function QueuePage() {
  const talent = await getDefaultTalent();
  const posts = await prisma.scheduledPost.findMany({
    where: {
      content: { talentId: talent.id },
      status: { in: ["SCHEDULED", "POSTED"] },
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      content: { include: { caption: true, hashtagSet: true } },
      account: true,
    },
  });

  const manual = posts.filter((p) => p.publishMode === "MANUAL" && p.status === "SCHEDULED");
  const auto = posts.filter((p) => p.publishMode === "AUTO" && p.status === "SCHEDULED");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Publishing Queue</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manual posting prep packs and automated publish slots (API integration in Phase 2).
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">
          Manual queue ({manual.length})
        </h2>
        <p className="text-sm text-zinc-500">
          Stories and overflow content — download asset, copy caption, post from phone.
        </p>
        <div className="mt-4 space-y-4">
          {manual.map((post) => (
            <QueueCard key={post.id} post={post} />
          ))}
          {!manual.length ? (
            <p className="text-sm text-zinc-500">No manual posts in queue.</p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">
          Automated queue ({auto.length})
        </h2>
        <p className="text-sm text-zinc-500">
          Ready for Instagram/TikTok API publishing once accounts are connected.
        </p>
        <div className="mt-4 space-y-4">
          {auto.map((post) => (
            <QueueCard key={post.id} post={post} />
          ))}
          {!auto.length ? (
            <p className="text-sm text-zinc-500">No automated posts in queue.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function QueueCard({
  post,
}: {
  post: {
    id: string;
    scheduledAt: Date;
    platform: "INSTAGRAM" | "TIKTOK";
    format: "FEED_POST" | "REEL" | "STORY" | "TIKTOK_VIDEO" | "CAROUSEL";
    status: "DRAFT" | "NEEDS_REVIEW" | "APPROVED" | "REJECTED" | "SCHEDULED" | "POSTED";
    publishMode: "AUTO" | "MANUAL";
    content: {
      title: string | null;
      fileName: string;
      storageKey: string;
      mimeType: string;
      caption: { text: string } | null;
      hashtagSet: { tags: string[] } | null;
    };
    account: { handle: string } | null;
  };
}) {
  const caption = [
    post.content.caption?.text ?? "",
    post.content.hashtagSet?.tags.map((t) => `#${t}`).join(" ") ?? "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={post.status} />
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
              {post.publishMode}
            </span>
          </div>
          <h3 className="mt-2 font-semibold text-zinc-900">
            {PLATFORM_LABELS[post.platform]} · {FORMAT_LABELS[post.format]}
          </h3>
          <p className="text-sm text-zinc-500">
            {format(post.scheduledAt, "EEE, MMM d · h:mm a")}
            {post.account ? ` · @${post.account.handle}` : ""}
          </p>
          <p className="mt-1 text-sm text-zinc-700">
            {post.content.title ?? post.content.fileName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={getPublicUrl(post.content.storageKey)}
            download
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
          >
            Download asset
          </a>
          <form action={markPostedAction}>
            <input type="hidden" name="postId" value={post.id} />
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium"
            >
              Mark posted
            </button>
          </form>
        </div>
      </div>
      {caption ? (
        <div className="mt-4 rounded-xl bg-zinc-50 p-4">
          <p className="text-xs font-medium uppercase text-zinc-400">Caption pack</p>
          <pre className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">{caption}</pre>
        </div>
      ) : (
        <p className="mt-4 text-sm text-amber-700">Add a caption on the Content page before posting.</p>
      )}
    </article>
  );
}
