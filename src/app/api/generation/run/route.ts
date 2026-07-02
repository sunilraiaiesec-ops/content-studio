import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { runAutoGenerationBatch } from "@/lib/higgsfield/runner";
import { isHiggsfieldConfigured } from "@/lib/higgsfield/config";
import { getDefaultTalent } from "@/lib/talent";

export const maxDuration = 600;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isHiggsfieldConfigured()) {
    return NextResponse.json(
      {
        error:
          "Higgsfield not configured. Add HIGGSFIELD_CREDENTIALS=KEY_ID:KEY_SECRET to your .env file.",
      },
      { status: 400 },
    );
  }

  let count = 1;
  try {
    const body = (await request.json()) as { count?: number };
    if (body.count && body.count >= 1 && body.count <= 3) {
      count = body.count;
    }
  } catch {
    // default count = 1
  }

  const talent = await getDefaultTalent();
  const results = await runAutoGenerationBatch(talent.id, count);

  const completed = results.filter((r) => r.status === "COMPLETED").length;
  const failed = results.filter((r) => r.status === "FAILED");

  return NextResponse.json({
    completed,
    failed: failed.length,
    results,
    reviewUrl: "/content?status=NEEDS_REVIEW",
  });
}
