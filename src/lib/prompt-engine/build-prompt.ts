import type { InspirationLink, OriginalMedia, PostFormat } from "@/generated/prisma/client";

export type PromptBuildInput = {
  inspiration: InspirationLink | null;
  identityMedia: OriginalMedia[];
  outfitMedia: OriginalMedia[];
  locationMedia: OriginalMedia[];
  format: PostFormat;
  talentName: string;
  customNotes?: string;
};

export type BuiltPrompt = {
  promptText: string;
  negativePrompt: string;
  model: string;
  parameters: Record<string, unknown>;
};

const ORIGINALITY_RULES = [
  "Create entirely original content inspired by style only — never replicate exact poses, outfits, choreography, or compositions.",
  "Preserve the subject's identity consistently from reference photos.",
  "Do not mention or imitate any specific creator by name.",
];

export function buildPrompt(input: PromptBuildInput): BuiltPrompt {
  const { inspiration, identityMedia, outfitMedia, locationMedia, format, talentName, customNotes } =
    input;

  const styleParts: string[] = [];
  if (inspiration) {
    if (inspiration.mood) styleParts.push(`mood: ${inspiration.mood}`);
    if (inspiration.outfitStyle) styleParts.push(`outfit style inspiration: ${inspiration.outfitStyle}`);
    if (inspiration.pose) styleParts.push(`pose energy (original variation): ${inspiration.pose}`);
    if (inspiration.cameraAngle) styleParts.push(`camera angle inspiration: ${inspiration.cameraAngle}`);
    if (inspiration.transition) styleParts.push(`transition feel: ${inspiration.transition}`);
    if (inspiration.background) styleParts.push(`background vibe: ${inspiration.background}`);
    if (inspiration.editingStyle) styleParts.push(`editing style: ${inspiration.editingStyle}`);
    if (inspiration.music) styleParts.push(`music energy: ${inspiration.music}`);
  }

  const refParts: string[] = [];
  if (identityMedia.length) refParts.push(`${identityMedia.length} identity reference photo(s)`);
  if (outfitMedia.length) refParts.push(`${outfitMedia.length} outfit reference(s)`);
  if (locationMedia.length) refParts.push(`${locationMedia.length} location reference(s)`);

  const formatLabel =
    format === "REEL" || format === "TIKTOK_VIDEO"
      ? "short-form vertical video"
      : format === "STORY"
        ? "vertical story clip"
        : "photo";

  const promptText = [
    `Original ${formatLabel} featuring ${talentName}.`,
    styleParts.length ? `Style inspiration (do not copy): ${styleParts.join("; ")}.` : "",
    refParts.length ? `Reference assets: ${refParts.join(", ")}.` : "",
    customNotes ? `Additional direction: ${customNotes}.` : "",
    ORIGINALITY_RULES.join(" "),
    "Cinematic lighting, natural skin tones, high quality, social-media ready.",
  ]
    .filter(Boolean)
    .join("\n");

  const negativePrompt =
    "copying exact choreography, watermark, logo, duplicate creator content, distorted face, extra limbs, blurry, low quality, text overlay";

  const isVideo = format === "REEL" || format === "STORY" || format === "TIKTOK_VIDEO";

  return {
    promptText,
    negativePrompt,
    model: isVideo ? "dop-turbo" : "seedream-v4",
    parameters: {
      aspect_ratio: format === "FEED_POST" ? "1:1" : "9:16",
      format,
      identity_refs: identityMedia.map((m) => m.id),
      outfit_refs: outfitMedia.map((m) => m.id),
      location_refs: locationMedia.map((m) => m.id),
    },
  };
}

export async function buildPromptWithOptionalLLM(input: PromptBuildInput): Promise<BuiltPrompt> {
  const base = buildPrompt(input);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return base;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You refine image/video generation prompts for Higgsfield. Output JSON with keys: promptText, negativePrompt. Keep content original and identity-safe.",
          },
          {
            role: "user",
            content: `Refine this prompt:\n${base.promptText}\nNegative: ${base.negativePrompt}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!res.ok) return base;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return base;

    const parsed = JSON.parse(content) as { promptText?: string; negativePrompt?: string };
    return {
      ...base,
      promptText: parsed.promptText ?? base.promptText,
      negativePrompt: parsed.negativePrompt ?? base.negativePrompt,
    };
  } catch {
    return base;
  }
}
