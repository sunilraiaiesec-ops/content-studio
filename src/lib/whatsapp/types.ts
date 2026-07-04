export type MessageDirection = "in" | "out" | "system";

export type WhatsAppMediaKind =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "contact"
  | "sticker"
  | "unknown";

export interface ParsedWhatsAppMessage {
  /** Zero-based order in the export file */
  index: number;
  sentAt: Date;
  /** Raw sender label from the export, e.g. "You" or a contact name */
  sender: string | null;
  body: string;
  direction: MessageDirection;
  isMedia: boolean;
  mediaKind?: WhatsAppMediaKind;
  isDeleted: boolean;
  isEdited: boolean;
  /** Unparsed datetime string from the bracket prefix */
  rawDateTime: string;
}

export interface WhatsAppParseStats {
  totalLines: number;
  parsedMessages: number;
  systemMessages: number;
  continuationLines: number;
  skippedLines: number;
}

export interface ParsedWhatsAppExport {
  messages: ParsedWhatsAppMessage[];
  /** Unique non-system senders excluding "You" */
  participants: string[];
  stats: WhatsAppParseStats;
}

export type WhatsAppDateOrder = "auto" | "dmy" | "mdy";

export interface ParseWhatsAppExportOptions {
  /** IANA timezone used when the export omits offset info. Defaults to UTC. */
  timeZone?: string;
  /**
   * How to read ambiguous numeric dates like 03/04/2026.
   * `dmy` = 3 April, `mdy` = March 4, `auto` uses values > 12 when possible.
   */
  dateOrder?: WhatsAppDateOrder;
  /** Treat these sender labels as outgoing ("You" is always outgoing). */
  selfLabels?: string[];
}
