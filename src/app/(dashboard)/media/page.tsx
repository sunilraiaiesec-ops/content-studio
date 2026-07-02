import { format } from "date-fns";

import { uploadOriginalMediaAction } from "@/app/actions/studio";
import { getPublicUrl } from "@/lib/storage/local";
import { getDefaultTalent } from "@/lib/talent";
import { prisma } from "@/lib/prisma";

export default async function MediaPage() {
  const talent = await getDefaultTalent();
  const items = await prisma.originalMedia.findMany({
    where: { talentId: talent.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Original Media Library</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Upload photos and videos for identity, outfits, poses, and locations.
        </p>
      </div>

      <form
        action={uploadOriginalMediaAction}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-zinc-900">Upload media</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            type="file"
            name="file"
            accept="image/*,video/*"
            required
            className="text-sm"
          />
          <input
            name="title"
            placeholder="Title"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="tags"
            placeholder="Tags (comma separated)"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="outfitTags"
            placeholder="Outfit tags"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="poseTags"
            placeholder="Pose tags"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="locationTags"
            placeholder="Location tags"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="moodTags"
            placeholder="Mood tags"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            placeholder="Description"
            rows={2}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
          />
        </div>
        <button
          type="submit"
          className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
        >
          Upload
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
          >
            {item.type === "PHOTO" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getPublicUrl(item.storageKey)}
                alt={item.title ?? item.fileName}
                className="aspect-[4/5] w-full object-cover"
              />
            ) : (
              <video
                src={getPublicUrl(item.storageKey)}
                controls
                className="aspect-[4/5] w-full object-cover"
              />
            )}
            <div className="p-4">
              <p className="font-medium text-zinc-900">{item.title ?? item.fileName}</p>
              <p className="text-xs text-zinc-500">{item.type} · {format(item.createdAt, "MMM d, yyyy")}</p>
              {item.tags.length ? (
                <p className="mt-2 text-xs text-zinc-600">{item.tags.join(", ")}</p>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {!items.length ? (
        <p className="text-sm text-zinc-500">No media uploaded yet.</p>
      ) : null}
    </div>
  );
}
