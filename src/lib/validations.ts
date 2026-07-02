import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const inspirationSchema = z.object({
  url: z.string().url(),
  platform: z.enum(["INSTAGRAM", "TIKTOK"]).optional(),
  creator: z.string().optional(),
  caption: z.string().optional(),
  notes: z.string().optional(),
  outfitStyle: z.string().optional(),
  pose: z.string().optional(),
  cameraAngle: z.string().optional(),
  transition: z.string().optional(),
  background: z.string().optional(),
  mood: z.string().optional(),
  music: z.string().optional(),
  editingStyle: z.string().optional(),
  tags: z.string().optional(),
});

export const promptGenerateSchema = z.object({
  inspirationId: z.string().optional(),
  format: z.enum(["FEED_POST", "REEL", "STORY", "TIKTOK_VIDEO", "CAROUSEL"]),
  identityMediaIds: z.array(z.string()).default([]),
  outfitMediaIds: z.array(z.string()).default([]),
  locationMediaIds: z.array(z.string()).default([]),
  customNotes: z.string().optional(),
});

export const contentReviewSchema = z.object({
  contentId: z.string(),
  status: z.enum(["APPROVED", "REJECTED", "NEEDS_REVIEW"]),
  rejectionNote: z.string().optional(),
});

export const captionSchema = z.object({
  contentId: z.string(),
  text: z.string().min(1),
  cta: z.string().optional(),
  tags: z.string().optional(),
});

export const socialAccountSchema = z.object({
  platform: z.enum(["INSTAGRAM", "TIKTOK"]),
  handle: z.string().min(1),
  externalId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const scheduleRescheduleSchema = z.object({
  postId: z.string(),
  scheduledAt: z.string().datetime(),
});

export function parseTags(input?: string | null): string[] {
  if (!input?.trim()) return [];
  return input
    .split(/[,#]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function inferPlatformFromUrl(url: string): "INSTAGRAM" | "TIKTOK" | undefined {
  const lower = url.toLowerCase();
  if (lower.includes("instagram.com") || lower.includes("instagr.am")) return "INSTAGRAM";
  if (lower.includes("tiktok.com")) return "TIKTOK";
  return undefined;
}
