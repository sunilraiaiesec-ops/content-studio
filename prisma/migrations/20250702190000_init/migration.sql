-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'NEEDS_REVIEW', 'APPROVED', 'REJECTED', 'SCHEDULED', 'POSTED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('PHOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('INSTAGRAM', 'TIKTOK');

-- CreateEnum
CREATE TYPE "PostFormat" AS ENUM ('FEED_POST', 'REEL', 'STORY', 'TIKTOK_VIDEO', 'CAROUSEL');

-- CreateEnum
CREATE TYPE "PromptKind" AS ENUM ('IMAGE', 'VIDEO', 'CAPTION', 'HASHTAGS', 'STORY_IDEA');

-- CreateEnum
CREATE TYPE "PublishMode" AS ENUM ('AUTO', 'MANUAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_profiles" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "notes" TEXT,
    "higgsfieldSoulId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "talent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "original_media" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "outfitTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "poseTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "locationTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "moodTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationSec" DOUBLE PRECISION,
    "capturedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "original_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspiration_links" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "platform" "Platform",
    "creator" TEXT,
    "caption" TEXT,
    "notes" TEXT,
    "outfitStyle" TEXT,
    "pose" TEXT,
    "cameraAngle" TEXT,
    "transition" TEXT,
    "background" TEXT,
    "mood" TEXT,
    "music" TEXT,
    "editingStyle" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspiration_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outfits" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "season" TEXT,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "fileName" TEXT,
    "sourceMediaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outfits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_prompts" (
    "id" TEXT NOT NULL,
    "kind" "PromptKind" NOT NULL DEFAULT 'VIDEO',
    "promptText" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "model" TEXT,
    "parameters" JSONB,
    "inspirationId" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_media_refs" (
    "id" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "prompt_media_refs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_content" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "promptId" TEXT,
    "title" TEXT,
    "type" "MediaType" NOT NULL,
    "format" "PostFormat",
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "storageKey" TEXT NOT NULL,
    "thumbnailKey" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationSec" DOUBLE PRECISION,
    "rejectionNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "captions" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "cta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "captions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hashtag_sets" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hashtag_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "handle" TEXT NOT NULL,
    "externalId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpires" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posting_calendars" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '60-Day Growth Sprint',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "targets" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posting_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_posts" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT,
    "contentId" TEXT NOT NULL,
    "accountId" TEXT,
    "platform" "Platform" NOT NULL,
    "format" "PostFormat" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "publishedAt" TIMESTAMP(3),
    "externalPostId" TEXT,
    "publishMode" "PublishMode" NOT NULL DEFAULT 'MANUAL',
    "manualNotes" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_analytics" (
    "id" TEXT NOT NULL,
    "scheduledPostId" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "saves" INTEGER,
    "reach" INTEGER,
    "raw" JSONB,

    CONSTRAINT "performance_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "talent_profiles_slug_key" ON "talent_profiles"("slug");

-- CreateIndex
CREATE INDEX "original_media_talentId_createdAt_idx" ON "original_media"("talentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "inspiration_links_url_key" ON "inspiration_links"("url");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_media_refs_promptId_mediaId_role_key" ON "prompt_media_refs"("promptId", "mediaId", "role");

-- CreateIndex
CREATE INDEX "generated_content_talentId_status_idx" ON "generated_content"("talentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "captions_contentId_key" ON "captions"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "hashtag_sets_contentId_key" ON "hashtag_sets"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "social_accounts_talentId_platform_handle_key" ON "social_accounts"("talentId", "platform", "handle");

-- CreateIndex
CREATE INDEX "scheduled_posts_scheduledAt_status_idx" ON "scheduled_posts"("scheduledAt", "status");

-- CreateIndex
CREATE INDEX "scheduled_posts_platform_format_idx" ON "scheduled_posts"("platform", "format");

-- CreateIndex
CREATE INDEX "performance_analytics_scheduledPostId_fetchedAt_idx" ON "performance_analytics"("scheduledPostId", "fetchedAt");

-- AddForeignKey
ALTER TABLE "original_media" ADD CONSTRAINT "original_media_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "talent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfits" ADD CONSTRAINT "outfits_sourceMediaId_fkey" FOREIGN KEY ("sourceMediaId") REFERENCES "original_media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_prompts" ADD CONSTRAINT "generated_prompts_inspirationId_fkey" FOREIGN KEY ("inspirationId") REFERENCES "inspiration_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_media_refs" ADD CONSTRAINT "prompt_media_refs_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "generated_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompt_media_refs" ADD CONSTRAINT "prompt_media_refs_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "original_media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_content" ADD CONSTRAINT "generated_content_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "talent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_content" ADD CONSTRAINT "generated_content_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "generated_prompts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_content" ADD CONSTRAINT "generated_content_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "captions" ADD CONSTRAINT "captions_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "generated_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hashtag_sets" ADD CONSTRAINT "hashtag_sets_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "generated_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "talent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posting_calendars" ADD CONSTRAINT "posting_calendars_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "talent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "posting_calendars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "generated_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "social_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_analytics" ADD CONSTRAINT "performance_analytics_scheduledPostId_fkey" FOREIGN KEY ("scheduledPostId") REFERENCES "scheduled_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

