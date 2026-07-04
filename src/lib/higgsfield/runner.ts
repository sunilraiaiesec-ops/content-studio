import { createHiggsfieldClient } from "@higgsfield/client/v2";
import { InputImage, SoulQuality, SoulSize } from "@higgsfield/client";
import type { PostFormat } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

import { buildPromptWithOptionalLLM } from "@/lib/prompt-engine/build-prompt";
import {
  getHiggsfieldCredentials,
  HIGGSFIELD_I2V_ENDPOINT,
  HIGGSFIELD_SOUL_ENDPOINT,
  HIGGSFIELD_TEXT_ENDPOINT,
  isPublicMediaUrlAvailable,
} from "@/lib/higgsfield/config";
import { downloadRemoteAsset } from "@/lib/higgsfield/download";
import { defaultFormatForOutput, pickIdentityMedia, pickInspiration } from "@/lib/higgsfield/select-inputs";
import { prisma } from "@/lib/prisma";
import { getPublicUrl } from "@/lib/storage/local";

export type RunGenerationOptions = {
  format?: PostFormat;
  inspirationId?: string;
};

export type RunGenerationResult = {
  jobId: string;
  contentId?: string;
  status: "COMPLETED" | "FAILED";
  errorMessage?: string;
};

function getClient() {
  const credentials = getHiggsfieldCredentials();
  if (!credentials) {
    throw new Error("Higgsfield credentials not configured. Add HIGGSFIELD_CREDENTIALS to .env");
  }
  return createHiggsfieldClient({ credentials, maxPollTime: 600_000 });
}

export async function runAutoGeneration(
  talentId: string,
  options: RunGenerationOptions = {},
): Promise<RunGenerationResult> {
  const talent = await prisma.talentProfile.findUniqueOrThrow({ where: { id: talentId } });
  const format = options.format ?? "REEL";

  const inspiration =
    (options.inspirationId
      ? await prisma.inspirationLink.findUnique({ where: { id: options.inspirationId } })
      : null) ?? (await pickInspiration(talentId));

  const identityMedia = await pickIdentityMedia(talentId, 3);
  if (!identityMedia.length) {
    throw new Error("Upload at least one photo in Media Library before generating.");
  }

  const job = await prisma.generationJob.create({
    data: {
      talentId,
      inspirationId: inspiration?.id,
      status: "RUNNING",
      format,
      metadata: { phase: "A", mode: "auto" },
    },
  });

  try {
    const built = await buildPromptWithOptionalLLM({
      inspiration,
      identityMedia,
      outfitMedia: [],
      locationMedia: [],
      format,
      talentName: talent.displayName,
      customNotes: "Kid-appropriate, joyful, natural. Preserve subject identity from references.",
    });

    const prompt = await prisma.generatedPrompt.create({
      data: {
        kind: format === "FEED_POST" ? "IMAGE" : "VIDEO",
        promptText: built.promptText,
        negativePrompt: built.negativePrompt,
        model: built.model,
        parameters: built.parameters as Prisma.InputJsonValue,
        inspirationId: inspiration?.id,
        status: "NEEDS_REVIEW",
        mediaRefs: {
          create: identityMedia.map((m) => ({ mediaId: m.id, role: "identity" })),
        },
      },
    });

    await prisma.generationJob.update({
      where: { id: job.id },
      data: { promptId: prompt.id },
    });

    const client = getClient();
    const primaryImage = identityMedia[0];
    const publicRefUrl = getPublicUrl(primaryImage.storageKey);
    const canUseImageRef = isPublicMediaUrlAvailable();

    let resultUrl: string | undefined;
    let resultType: "PHOTO" | "VIDEO" = "PHOTO";
    let higgsfieldRequestId: string | undefined;
    let mode = "text-to-image";

    if (canUseImageRef && format !== "FEED_POST") {
      mode = "image-to-video";
      const response = await client.subscribe(HIGGSFIELD_I2V_ENDPOINT, {
        input: {
          model: "dop-turbo",
          prompt: built.promptText,
          input_images: [InputImage.fromUrl(publicRefUrl)],
          enhance_prompt: true,
        },
        withPolling: true,
      });

      higgsfieldRequestId = response.request_id;
      if (response.status === "failed" || response.status === "nsfw") {
        throw new Error(`Higgsfield generation ${response.status}`);
      }
      resultUrl = response.video?.url ?? response.images?.[0]?.url;
      resultType = response.video?.url ? "VIDEO" : "PHOTO";
    } else if (talent.higgsfieldSoulId) {
      mode = "soul-id";
      const response = await client.subscribe(HIGGSFIELD_SOUL_ENDPOINT, {
        input: {
          prompt: built.promptText,
          custom_reference_id: talent.higgsfieldSoulId,
          custom_reference_strength: 1,
          width_and_height: SoulSize.PORTRAIT_1152x2048,
          quality: SoulQuality.HD,
          batch_size: 1,
          enhance_prompt: true,
        },
        withPolling: true,
      });

      higgsfieldRequestId = response.request_id;
      if (response.status === "failed" || response.status === "nsfw") {
        throw new Error(`Higgsfield generation ${response.status}`);
      }
      resultUrl = response.images?.[0]?.url;
      resultType = "PHOTO";
    } else {
      mode = canUseImageRef ? "kontext-text-to-image" : "text-to-image-localhost";
      const input: Record<string, unknown> = {
        aspect_ratio: "9:16",
        prompt: built.promptText,
        safety_tolerance: 2,
      };

      if (canUseImageRef) {
        input.image_url = publicRefUrl;
      }

      const response = await client.subscribe(HIGGSFIELD_TEXT_ENDPOINT, {
        input,
        withPolling: true,
      });

      higgsfieldRequestId = response.request_id;
      if (response.status === "failed" || response.status === "nsfw") {
        throw new Error(`Higgsfield generation ${response.status}`);
      }
      resultUrl = response.images?.[0]?.url ?? response.video?.url;
      resultType = response.video?.url ? "VIDEO" : "PHOTO";
    }

    if (!resultUrl) {
      throw new Error("Higgsfield returned no media URL");
    }

    const asset = await downloadRemoteAsset(resultUrl, "generated");
    const contentFormat = defaultFormatForOutput(asset.type, format);

    const content = await prisma.generatedContent.create({
      data: {
        talentId,
        promptId: prompt.id,
        title: `Auto-generated ${contentFormat.replace("_", " ").toLowerCase()}`,
        type: asset.type,
        format: contentFormat,
        status: "NEEDS_REVIEW",
        storageKey: asset.storageKey,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
        metadata: {
          higgsfieldRequestId,
          mode,
          inspirationId: inspiration?.id,
          identityMediaIds: identityMedia.map((m) => m.id),
        },
      },
    });

    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        contentId: content.id,
        higgsfieldRequestId,
        completedAt: new Date(),
        metadata: {
          phase: "A",
          mode,
          publicRefUsed: canUseImageRef,
        },
      },
    });

    const { notifyContentNeedsReview } = await import("@/lib/notifications/review-ready");
    void notifyContentNeedsReview(content, talent);

    return { jobId: job.id, contentId: content.id, status: "COMPLETED" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorMessage: message,
        completedAt: new Date(),
      },
    });
    return { jobId: job.id, status: "FAILED", errorMessage: message };
  }
}

export async function runAutoGenerationBatch(
  talentId: string,
  count: number,
  options: RunGenerationOptions = {},
): Promise<RunGenerationResult[]> {
  const results: RunGenerationResult[] = [];
  for (let i = 0; i < count; i++) {
    results.push(await runAutoGeneration(talentId, options));
  }
  return results;
}
