-- AlterTable
ALTER TABLE "talent_profiles" ADD COLUMN "whatsappPhone" TEXT,
ADD COLUMN "whatsappNotifyOnReview" BOOLEAN NOT NULL DEFAULT true;
