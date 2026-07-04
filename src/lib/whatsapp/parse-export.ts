import { parseWhatsAppDateTime } from "./parse-datetime";
import type {
  MessageDirection,
  ParsedWhatsAppExport,
  ParsedWhatsAppMessage,
  ParseWhatsAppExportOptions,
  WhatsAppMediaKind,
  WhatsAppParseStats,
} from "./types";

const MESSAGE_HEADER =
  /^\u200e?\[([^\]]+)\]\s([\s\S]+)$/;
const USER_MESSAGE = /^([^:\n]+):\s([\s\S]*)$/;
const ENCRYPTION_NOTICE =
  /messages and calls are end-to-end encrypted/i;

const DEFAULT_SELF_LABELS = ["You", "Tu", "Vous", "Du", "Tú", "você", "你"];

const MEDIA_PATTERNS: Array<{ kind: WhatsAppMediaKind; pattern: RegExp }> = [
  { kind: "image", pattern: /^<Media omitted>$/i },
  { kind: "image", pattern: /^image omitted$/i },
  { kind: "video", pattern: /^video omitted$/i },
  { kind: "video", pattern: /^<Video omitted>$/i },
  { kind: "audio", pattern: /^audio omitted$/i },
  { kind: "audio", pattern: /^<Audio omitted>$/i },
  { kind: "sticker", pattern: /^sticker omitted$/i },
  { kind: "document", pattern: /^document omitted$/i },
  { kind: "contact", pattern: /^contact card omitted$/i },
  {
    kind: "unknown",
    pattern: /^.+\.(jpg|jpeg|png|gif|webp|heic|mp4|pdf|opus|ogg|m4a|mp3)\s+\(file attached\)$/i,
  },
  { kind: "image", pattern: /^IMG-\d+-WA\d+\.(jpg|jpeg|png)\s+\(file attached\)$/i },
  { kind: "audio", pattern: /^PTT-\d+-WA\d+\.opus\s+\(file attached\)$/i },
  { kind: "video", pattern: /^VID-\d+-WA\d+\.mp4\s+\(file attached\)$/i },
];

const DELETED_PATTERNS = [
  /^this message was deleted\.?$/i,
  /^you deleted this message\.?$/i,
  /^this message was deleted for everyone\.?$/i,
];

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function isSelfSender(sender: string, selfLabels: string[]): boolean {
  const normalized = sender.trim().toLowerCase();
  return selfLabels.some((label) => label.trim().toLowerCase() === normalized);
}

function detectMedia(body: string): {
  isMedia: boolean;
  mediaKind?: WhatsAppMediaKind;
} {
  const trimmed = body.trim();
  for (const entry of MEDIA_PATTERNS) {
    if (entry.pattern.test(trimmed)) {
      return { isMedia: true, mediaKind: entry.kind };
    }
  }
  return { isMedia: false };
}

function detectDeleted(body: string): boolean {
  return DELETED_PATTERNS.some((pattern) => pattern.test(body.trim()));
}

function detectEdited(body: string): { body: string; isEdited: boolean } {
  const editedSuffix = " <This message was edited>";
  if (body.endsWith(editedSuffix)) {
    return {
      body: body.slice(0, -editedSuffix.length),
      isEdited: true,
    };
  }
  return { body, isEdited: false };
}

function resolveDirection(
  sender: string | null,
  selfLabels: string[],
): MessageDirection {
  if (!sender) return "system";
  if (isSelfSender(sender, selfLabels)) return "out";
  return "in";
}

function shouldSkipLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.length === 0 || ENCRYPTION_NOTICE.test(trimmed);
}

function buildMessage(
  index: number,
  rawDateTime: string,
  sender: string | null,
  rawBody: string,
  selfLabels: string[],
  dateOrder: ParseWhatsAppExportOptions["dateOrder"],
): ParsedWhatsAppMessage | null {
  const sentAt = parseWhatsAppDateTime(rawDateTime, dateOrder);
  if (!sentAt) return null;

  const edited = detectEdited(rawBody.trimEnd());
  const body = edited.body;
  const media = detectMedia(body);
  const direction = resolveDirection(sender, selfLabels);

  return {
    index,
    sentAt,
    sender,
    body,
    direction,
    isMedia: media.isMedia,
    mediaKind: media.mediaKind,
    isDeleted: detectDeleted(body),
    isEdited: edited.isEdited,
    rawDateTime,
  };
}

function collectParticipants(messages: ParsedWhatsAppMessage[]): string[] {
  const names = new Set<string>();
  for (const message of messages) {
    if (!message.sender || message.direction !== "in") continue;
    names.add(message.sender.trim());
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

export function parseWhatsAppExport(
  rawText: string,
  options: ParseWhatsAppExportOptions = {},
): ParsedWhatsAppExport {
  const selfLabels = [...DEFAULT_SELF_LABELS, ...(options.selfLabels ?? [])];
  const dateOrder = options.dateOrder ?? "auto";
  const lines = normalizeLineEndings(stripBom(rawText)).split("\n");

  const messages: ParsedWhatsAppMessage[] = [];
  const stats: WhatsAppParseStats = {
    totalLines: lines.length,
    parsedMessages: 0,
    systemMessages: 0,
    continuationLines: 0,
    skippedLines: 0,
  };

  let current: ParsedWhatsAppMessage | null = null;

  for (const line of lines) {
    if (shouldSkipLine(line)) {
      stats.skippedLines += 1;
      continue;
    }

    const headerMatch = line.match(MESSAGE_HEADER);
    if (headerMatch) {
      const rawDateTime = headerMatch[1]?.trim() ?? "";
      const remainder = headerMatch[2] ?? "";
      const userMatch = remainder.match(USER_MESSAGE);

      if (userMatch) {
        const sender = userMatch[1]?.trim() ?? null;
        const body = userMatch[2] ?? "";
        const parsed = buildMessage(
          messages.length,
          rawDateTime,
          sender,
          body,
          selfLabels,
          dateOrder,
        );

        if (parsed) {
          messages.push(parsed);
          current = parsed;
          stats.parsedMessages += 1;
        } else {
          current = null;
          stats.skippedLines += 1;
        }
        continue;
      }

      const parsed = buildMessage(
        messages.length,
        rawDateTime,
        null,
        remainder.trim(),
        selfLabels,
        dateOrder,
      );

      if (parsed) {
        messages.push(parsed);
        current = parsed;
        stats.parsedMessages += 1;
        stats.systemMessages += 1;
      } else {
        current = null;
        stats.skippedLines += 1;
      }
      continue;
    }

    if (current) {
      current.body = current.body.length > 0 ? `${current.body}\n${line}` : line;
      const media = detectMedia(current.body);
      current.isMedia = media.isMedia;
      current.mediaKind = media.mediaKind;
      current.isDeleted = detectDeleted(current.body);
      stats.continuationLines += 1;
      continue;
    }

    stats.skippedLines += 1;
  }

  return {
    messages,
    participants: collectParticipants(messages),
    stats,
  };
}
