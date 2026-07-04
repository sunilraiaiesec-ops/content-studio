import type { ContentStatus, Platform, PostFormat } from "@/generated/prisma/client";

export const DEFAULT_DAILY_TARGETS = {
  instagram: { story: 20, reel: 5, feed_post: 0 },
  tiktok: { video: 5 },
} as const;

export type DailyTargets = {
  instagram: { story: number; reel: number; feed_post: number };
  tiktok: { video: number };
};

export const STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: "Draft",
  NEEDS_REVIEW: "Needs Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SCHEDULED: "Scheduled",
  POSTED: "Posted",
};

export const STATUS_COLORS: Record<ContentStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  NEEDS_REVIEW: "bg-amber-50 text-amber-800 ring-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  REJECTED: "bg-red-50 text-red-800 ring-red-200",
  SCHEDULED: "bg-blue-50 text-blue-800 ring-blue-200",
  POSTED: "bg-violet-50 text-violet-800 ring-violet-200",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
};

export const FORMAT_LABELS: Record<PostFormat, string> = {
  FEED_POST: "Feed Post",
  REEL: "Reel",
  STORY: "Story",
  TIKTOK_VIDEO: "TikTok Video",
  CAROUSEL: "Carousel",
};

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "◉" },
  { href: "/media", label: "Media Library", icon: "▣" },
  { href: "/inspiration", label: "Inspiration", icon: "✦" },
  { href: "/prompts", label: "Prompts", icon: "⌘" },
  { href: "/content", label: "Content", icon: "◫" },
  { href: "/calendar", label: "Calendar", icon: "▦" },
  { href: "/queue", label: "Publish Queue", icon: "▶" },
  { href: "/settings/generation", label: "Generation", icon: "⚡" },
  { href: "/settings/notifications", label: "WhatsApp", icon: "💬" },
  { href: "/settings/accounts", label: "Accounts", icon: "⚙" },
] as const;
