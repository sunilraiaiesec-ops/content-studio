-- CreateEnum
CREATE TYPE "GenerationJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "generation_jobs" (
    "id" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "inspirationId" TEXT,
    "promptId" TEXT,
    "contentId" TEXT,
    "status" "GenerationJobStatus" NOT NULL DEFAULT 'PENDING',
    "format" "PostFormat" NOT NULL DEFAULT 'REEL',
    "errorMessage" TEXT,
    "higgsfieldRequestId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "generation_jobs_contentId_key" ON "generation_jobs"("contentId");

-- CreateIndex
CREATE INDEX "generation_jobs_talentId_status_idx" ON "generation_jobs"("talentId", "status");

-- CreateIndex
CREATE INDEX "generation_jobs_createdAt_idx" ON "generation_jobs"("createdAt");

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_talentId_fkey" FOREIGN KEY ("talentId") REFERENCES "talent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_inspirationId_fkey" FOREIGN KEY ("inspirationId") REFERENCES "inspiration_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "generated_prompts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "generated_content"("id") ON DELETE SET NULL ON UPDATE CASCADE;
