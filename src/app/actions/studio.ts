"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/current";
import {
  inspirationSchema,
  parseTags,
  inferPlatformFromUrl,
  promptGenerateSchema,
  contentReviewSchema,
  captionSchema,
  socialAccountSchema,
} from "@/lib/validations";
import { buildPromptWithOptionalLLM } from "@/lib/prompt-engine/build-prompt";
import { fillScheduleForDate, getActiveCalendar } from "@/lib/scheduler";
import { inferMediaType, saveUploadedFile } from "@/lib/storage/local";
import { getDefaultTalent } from "@/lib/talent";
import { prisma } from "@/lib/prisma";
import type { DailyTargets } from "@/lib/constants";
import { startOfDay, addDays } from "date-fns";
import type { Prisma } from "@/generated/prisma/client";

export async function createInspirationAction(formData: FormData): Promise<void> {
  await requireSession();
  const parsed = inspirationSchema.safeParse({
    url: formData.get("url"),
    platform: formData.get("platform") || undefined,
    creator: formData.get("creator") || undefined,
    caption: formData.get("caption") || undefined,
    notes: formData.get("notes") || undefined,
    outfitStyle: formData.get("outfitStyle") || undefined,
    pose: formData.get("pose") || undefined,
    cameraAngle: formData.get("cameraAngle") || undefined,
    transition: formData.get("transition") || undefined,
    background: formData.get("background") || undefined,
    mood: formData.get("mood") || undefined,
    music: formData.get("music") || undefined,
    editingStyle: formData.get("editingStyle") || undefined,
    tags: formData.get("tags") || undefined,
  });

  if (!parsed.success) {
    return;
  }

  const platform = parsed.data.platform ?? inferPlatformFromUrl(parsed.data.url);

  await prisma.inspirationLink.create({
    data: {
      ...parsed.data,
      platform,
      tags: parseTags(parsed.data.tags),
    },
  });

  revalidatePath("/inspiration");
}

export async function deleteInspirationAction(id: string): Promise<void> {
  await requireSession();
  await prisma.inspirationLink.delete({ where: { id } });
  revalidatePath("/inspiration");
}

export async function uploadOriginalMediaAction(formData: FormData): Promise<void> {
  await requireSession();
  const talent = await getDefaultTalent();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;

  const saved = await saveUploadedFile(file, "original");
  const tags = parseTags(formData.get("tags") as string | null);

  await prisma.originalMedia.create({
    data: {
      talentId: talent.id,
      type: inferMediaType(saved.mimeType),
      title: (formData.get("title") as string) || file.name,
      description: (formData.get("description") as string) || undefined,
      tags,
      outfitTags: parseTags(formData.get("outfitTags") as string | null),
      poseTags: parseTags(formData.get("poseTags") as string | null),
      locationTags: parseTags(formData.get("locationTags") as string | null),
      moodTags: parseTags(formData.get("moodTags") as string | null),
      storageKey: saved.storageKey,
      mimeType: saved.mimeType,
      fileName: saved.fileName,
      fileSize: saved.fileSize,
    },
  });

  revalidatePath("/media");
}

export async function generatePromptAction(formData: FormData): Promise<void> {
  await requireSession();
  const talent = await getDefaultTalent();

  const identityMediaIds = formData.getAll("identityMediaIds") as string[];
  const outfitMediaIds = formData.getAll("outfitMediaIds") as string[];
  const locationMediaIds = formData.getAll("locationMediaIds") as string[];

  const parsed = promptGenerateSchema.safeParse({
    inspirationId: formData.get("inspirationId") || undefined,
    format: formData.get("format"),
    identityMediaIds,
    outfitMediaIds,
    locationMediaIds,
    customNotes: formData.get("customNotes") || undefined,
  });

  if (!parsed.success) return;

  const inspiration = parsed.data.inspirationId
    ? await prisma.inspirationLink.findUnique({ where: { id: parsed.data.inspirationId } })
    : null;

  const [identityMedia, outfitMedia, locationMedia] = await Promise.all([
    prisma.originalMedia.findMany({ where: { id: { in: parsed.data.identityMediaIds } } }),
    prisma.originalMedia.findMany({ where: { id: { in: parsed.data.outfitMediaIds } } }),
    prisma.originalMedia.findMany({ where: { id: { in: parsed.data.locationMediaIds } } }),
  ]);

  const built = await buildPromptWithOptionalLLM({
    inspiration,
    identityMedia,
    outfitMedia,
    locationMedia,
    format: parsed.data.format,
    talentName: talent.displayName,
    customNotes: parsed.data.customNotes,
  });

  await prisma.generatedPrompt.create({
    data: {
      kind: parsed.data.format === "FEED_POST" ? "IMAGE" : "VIDEO",
      promptText: built.promptText,
      negativePrompt: built.negativePrompt,
      model: built.model,
      parameters: built.parameters as Prisma.InputJsonValue,
      inspirationId: parsed.data.inspirationId,
      status: "NEEDS_REVIEW",
      mediaRefs: {
        create: [
          ...identityMedia.map((m) => ({ mediaId: m.id, role: "identity" })),
          ...outfitMedia.map((m) => ({ mediaId: m.id, role: "outfit" })),
          ...locationMedia.map((m) => ({ mediaId: m.id, role: "location" })),
        ],
      },
    },
  });

  revalidatePath("/prompts");
}

export async function uploadGeneratedContentAction(formData: FormData): Promise<void> {
  await requireSession();
  const talent = await getDefaultTalent();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;

  const saved = await saveUploadedFile(file, "generated");
  const promptId = (formData.get("promptId") as string) || undefined;
  const format = (formData.get("format") as string) || undefined;

  await prisma.generatedContent.create({
    data: {
      talentId: talent.id,
      promptId,
      title: (formData.get("title") as string) || file.name,
      type: inferMediaType(saved.mimeType),
      format: format as "REEL" | "STORY" | "TIKTOK_VIDEO" | "FEED_POST" | "CAROUSEL" | undefined,
      status: "NEEDS_REVIEW",
      storageKey: saved.storageKey,
      mimeType: saved.mimeType,
      fileName: saved.fileName,
      fileSize: saved.fileSize,
      metadata: {
        outfitTags: parseTags(formData.get("outfitTags") as string | null),
        locationTags: parseTags(formData.get("locationTags") as string | null),
        moodTags: parseTags(formData.get("moodTags") as string | null),
      },
    },
  });

  revalidatePath("/content");
}

export async function reviewContentAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = contentReviewSchema.safeParse({
    contentId: formData.get("contentId"),
    status: formData.get("status"),
    rejectionNote: formData.get("rejectionNote") || undefined,
  });

  if (!parsed.success) return;

  await prisma.generatedContent.update({
    where: { id: parsed.data.contentId },
    data: {
      status: parsed.data.status,
      rejectionNote: parsed.data.rejectionNote,
      reviewedById: session.userId,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/content");
  revalidatePath("/");
}

export async function saveCaptionAction(formData: FormData): Promise<void> {
  await requireSession();
  const parsed = captionSchema.safeParse({
    contentId: formData.get("contentId"),
    text: formData.get("text"),
    cta: formData.get("cta") || undefined,
    tags: formData.get("tags") || undefined,
  });

  if (!parsed.success) return;

  await prisma.$transaction([
    prisma.caption.upsert({
      where: { contentId: parsed.data.contentId },
      create: {
        contentId: parsed.data.contentId,
        text: parsed.data.text,
        cta: parsed.data.cta,
      },
      update: { text: parsed.data.text, cta: parsed.data.cta },
    }),
    prisma.hashtagSet.upsert({
      where: { contentId: parsed.data.contentId },
      create: {
        contentId: parsed.data.contentId,
        tags: parseTags(parsed.data.tags),
      },
      update: { tags: parseTags(parsed.data.tags) },
    }),
  ]);

  revalidatePath("/content");
  revalidatePath("/queue");
}

export async function saveSocialAccountAction(formData: FormData): Promise<void> {
  await requireSession();
  const talent = await getDefaultTalent();
  const parsed = socialAccountSchema.safeParse({
    platform: formData.get("platform"),
    handle: formData.get("handle"),
    externalId: formData.get("externalId") || undefined,
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) return;

  await prisma.socialAccount.upsert({
    where: {
      talentId_platform_handle: {
        talentId: talent.id,
        platform: parsed.data.platform,
        handle: parsed.data.handle,
      },
    },
    create: { talentId: talent.id, ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/settings/accounts");
}

export async function fillScheduleAction(formData: FormData): Promise<void> {
  await requireSession();
  const talent = await getDefaultTalent();
  const calendar = await getActiveCalendar(talent.id);
  if (!calendar) return;

  const dateStr = formData.get("date") as string;
  const date = dateStr ? startOfDay(new Date(dateStr)) : startOfDay(new Date());
  const targets = calendar.targets as DailyTargets;

  await fillScheduleForDate(talent.id, calendar.id, date, targets);
  revalidatePath("/calendar");
  revalidatePath("/queue");
  revalidatePath("/");
}

export async function fillWeekScheduleAction(): Promise<void> {
  await requireSession();
  const talent = await getDefaultTalent();
  const calendar = await getActiveCalendar(talent.id);
  if (!calendar) return;

  const targets = calendar.targets as DailyTargets;
  let total = 0;
  const start = startOfDay(new Date());

  for (let i = 0; i < 7; i++) {
    total += await fillScheduleForDate(talent.id, calendar.id, addDays(start, i), targets);
  }

  revalidatePath("/calendar");
  revalidatePath("/queue");
  revalidatePath("/");
}

export async function reschedulePostAction(formData: FormData): Promise<void> {
  await requireSession();
  const postId = formData.get("postId") as string;
  const scheduledAt = formData.get("scheduledAt") as string;
  if (!postId || !scheduledAt) return;

  await prisma.scheduledPost.update({
    where: { id: postId },
    data: { scheduledAt: new Date(scheduledAt) },
  });

  revalidatePath("/calendar");
  revalidatePath("/queue");
}

export async function markPostedAction(formData: FormData): Promise<void> {
  await requireSession();
  const postId = formData.get("postId") as string;
  if (!postId) return;

  const post = await prisma.scheduledPost.findUnique({ where: { id: postId } });
  if (!post) return;

  await prisma.$transaction([
    prisma.scheduledPost.update({
      where: { id: postId },
      data: { status: "POSTED", publishedAt: new Date() },
    }),
    prisma.generatedContent.update({
      where: { id: post.contentId },
      data: { status: "POSTED" },
    }),
  ]);

  revalidatePath("/queue");
  revalidatePath("/");
  revalidatePath("/calendar");
}

export async function deleteScheduledPostAction(postId: string): Promise<void> {
  await requireSession();
  const post = await prisma.scheduledPost.findUnique({ where: { id: postId } });
  if (!post) return;

  await prisma.$transaction([
    prisma.scheduledPost.delete({ where: { id: postId } }),
    prisma.generatedContent.update({
      where: { id: post.contentId },
      data: { status: "APPROVED" },
    }),
  ]);

  revalidatePath("/calendar");
  revalidatePath("/queue");
}
