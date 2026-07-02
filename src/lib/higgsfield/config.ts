export function getHiggsfieldCredentials(): string | null {
  const creds = process.env.HIGGSFIELD_CREDENTIALS ?? process.env.HF_CREDENTIALS;
  if (!creds?.includes(":")) return null;
  return creds;
}

export function isHiggsfieldConfigured(): boolean {
  return getHiggsfieldCredentials() !== null;
}

export function isPublicMediaUrlAvailable(): boolean {
  const base = process.env.PUBLIC_BASE_URL ?? "http://localhost:3010";
  return !base.includes("localhost") && !base.includes("127.0.0.1");
}

export const HIGGSFIELD_TEXT_ENDPOINT = "flux-pro/kontext/max/text-to-image";
export const HIGGSFIELD_SOUL_ENDPOINT = "/v1/text2image/soul";
export const HIGGSFIELD_I2V_ENDPOINT = "/v1/image2video/dop";
