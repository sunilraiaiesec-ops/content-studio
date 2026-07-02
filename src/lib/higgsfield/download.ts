import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { getUploadDir } from "@/lib/storage/local";

export async function downloadRemoteAsset(
  url: string,
  subdir: string,
): Promise<{ storageKey: string; fileName: string; fileSize: number; mimeType: string; type: "PHOTO" | "VIDEO" }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download generated asset (${res.status})`);
  }

  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const isVideo = contentType.startsWith("video/") || url.includes(".mp4");
  const ext = isVideo ? ".mp4" : contentType.includes("png") ? ".png" : ".jpg";
  const storageKey = `${subdir}/${randomUUID()}${ext}`;
  const fullPath = path.join(getUploadDir(), storageKey);

  await mkdir(path.dirname(fullPath), { recursive: true });
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(fullPath, buffer);

  return {
    storageKey,
    fileName: path.basename(storageKey),
    fileSize: buffer.length,
    mimeType: contentType,
    type: isVideo ? "VIDEO" : "PHOTO",
  };
}
