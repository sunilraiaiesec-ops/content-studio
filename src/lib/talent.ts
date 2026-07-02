import { prisma } from "@/lib/prisma";

export async function getDefaultTalent() {
  const talent = await prisma.talentProfile.findFirst({ orderBy: { createdAt: "asc" } });
  if (!talent) {
    throw new Error("No talent profile configured. Run npm run db:seed.");
  }
  return talent;
}
