import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { isHiggsfieldConfigured, isPublicMediaUrlAvailable } from "@/lib/higgsfield/config";
import { getDefaultTalent } from "@/lib/talent";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const talent = await getDefaultTalent();

  const [jobs, needsReview, running] = await Promise.all([
    prisma.generationJob.findMany({
      where: { talentId: talent.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        inspiration: { select: { creator: true, url: true } },
        content: { select: { id: true, title: true, status: true } },
      },
    }),
    prisma.generatedContent.count({
      where: { talentId: talent.id, status: "NEEDS_REVIEW" },
    }),
    prisma.generationJob.count({
      where: { talentId: talent.id, status: "RUNNING" },
    }),
  ]);

  return NextResponse.json({
    configured: isHiggsfieldConfigured(),
    publicUrls: isPublicMediaUrlAvailable(),
    soulId: talent.higgsfieldSoulId,
    needsReview,
    running,
    jobs: jobs.map((j) => ({
      ...j,
      createdAt: j.createdAt.toISOString(),
      completedAt: j.completedAt?.toISOString() ?? null,
    })),
  });
}
