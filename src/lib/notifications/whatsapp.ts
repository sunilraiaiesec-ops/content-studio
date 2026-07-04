const GRAPH_API_VERSION = "v21.0";

export type WhatsAppConfig = {
  accessToken: string;
  phoneNumberId: string;
  templateName?: string;
  templateLanguage?: string;
};

export function getWhatsAppConfig(): WhatsAppConfig | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!accessToken || !phoneNumberId) return null;

  return {
    accessToken,
    phoneNumberId,
    templateName: process.env.WHATSAPP_REVIEW_TEMPLATE_NAME?.trim() || undefined,
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || "en",
  };
}

export function isWhatsAppConfigured(): boolean {
  return getWhatsAppConfig() !== null;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

type SendResult = { ok: true; messageId: string } | { ok: false; error: string };

async function postMessage(
  config: WhatsAppConfig,
  body: Record<string, unknown>,
): Promise<SendResult> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${config.phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      ...body,
    }),
  });

  const data = (await response.json()) as {
    messages?: { id: string }[];
    error?: { message?: string };
  };

  if (!response.ok) {
    return { ok: false, error: data.error?.message ?? `HTTP ${response.status}` };
  }

  const messageId = data.messages?.[0]?.id;
  if (!messageId) {
    return { ok: false, error: "WhatsApp API returned no message id" };
  }

  return { ok: true, messageId };
}

export async function sendWhatsAppText(to: string, text: string): Promise<SendResult> {
  const config = getWhatsAppConfig();
  if (!config) {
    return { ok: false, error: "WhatsApp not configured" };
  }

  return postMessage(config, {
    to: normalizePhone(to),
    type: "text",
    text: { preview_url: true, body: text },
  });
}

export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  bodyParameters: string[],
  language = "en",
): Promise<SendResult> {
  const config = getWhatsAppConfig();
  if (!config) {
    return { ok: false, error: "WhatsApp not configured" };
  }

  return postMessage(config, {
    to: normalizePhone(to),
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      components: bodyParameters.length
        ? [
            {
              type: "body",
              parameters: bodyParameters.map((text) => ({ type: "text", text })),
            },
          ]
        : undefined,
    },
  });
}

export type ReviewNotificationPayload = {
  to: string;
  talentName: string;
  contentTitle: string;
  contentFormat: string;
  reviewUrl: string;
};

export async function sendReviewReadyNotification(
  payload: ReviewNotificationPayload,
): Promise<SendResult> {
  const config = getWhatsAppConfig();
  if (!config) {
    return { ok: false, error: "WhatsApp not configured" };
  }

  const summary = `${payload.contentTitle} (${payload.contentFormat})`;

  if (config.templateName) {
    return sendWhatsAppTemplate(
      payload.to,
      config.templateName,
      [payload.talentName, summary, payload.reviewUrl],
      config.templateLanguage,
    );
  }

  const text = [
    `New content ready for review — ${payload.talentName}`,
    "",
    summary,
    "",
    `Review now: ${payload.reviewUrl}`,
  ].join("\n");

  return sendWhatsAppText(payload.to, text);
}
