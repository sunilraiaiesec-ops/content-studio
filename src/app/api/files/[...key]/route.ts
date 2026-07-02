import { NextResponse } from "next/server";

import { readStoredFile } from "@/lib/storage/local";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ key: string[] }> };

export async function GET(_req: Request, context: RouteContext) {
  const segments = (await context.params).key;
  const storageKey = segments.join("/");

  const media =
    (await prisma.originalMedia.findFirst({ where: { storageKey } })) ??
    (await prisma.generatedContent.findFirst({ where: { storageKey } }));

  try {
    const buffer = await readStoredFile(storageKey);
    const mimeType = media?.mimeType ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
