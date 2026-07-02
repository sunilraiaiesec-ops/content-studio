import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads";

export function getUploadDir(): string {
  return path.join(/* turbopackIgnore: true */ process.cwd(), UPLOAD_DIR);
}

export function getPublicUrl(storageKey: string): string {
  const base = process.env.PUBLIC_BASE_URL ?? "http://localhost:3000";
  return `${base}/api/files/${storageKey}`;
}

export async function saveUploadedFile(
  file: File,
  subdir: string,
): Promise<{ storageKey: string; fileName: string; fileSize: number; mimeType: string }> {
  const ext = path.extname(file.name) || "";
  const storageKey = `${subdir}/${randomUUID()}${ext}`;
  const fullPath = path.join(getUploadDir(), storageKey);
  await mkdir(path.dirname(fullPath), { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);

  return {
    storageKey,
    fileName: file.name,
    fileSize: buffer.length,
    mimeType: file.type || "application/octet-stream",
  };
}

export async function readStoredFile(storageKey: string): Promise<Buffer> {
  const fullPath = path.join(getUploadDir(), storageKey);
  return readFile(fullPath);
}

export async function deleteStoredFile(storageKey: string): Promise<void> {
  const fullPath = path.join(getUploadDir(), storageKey);
  try {
    await unlink(fullPath);
  } catch {
    // file may already be gone
  }
}

export function inferMediaType(mimeType: string): "PHOTO" | "VIDEO" {
  return mimeType.startsWith("video/") ? "VIDEO" : "PHOTO";
}
