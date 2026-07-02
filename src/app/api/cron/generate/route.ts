import { NextResponse } from "next/server";

import { runAutoGenerationBatch } from "@/lib/higgsfield/runner";
import { isHiggsfieldConfigured } from "@/lib/higgsfield/config";
import { getDefaultTalent } from "@/lib/talent";

export const maxDuration = 600;

export async function POST(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isHiggsfieldConfigured()) {
    return NextResponse.json({ error: "Higgsfield not configured" }, { status: 400 });
  }

  const talent = await getDefaultTalent();
  const results = await runAutoGenerationBatch(talent.id, 1);

  return NextResponse.json({ results });
}
