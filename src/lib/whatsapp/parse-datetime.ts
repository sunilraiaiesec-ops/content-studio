import type { WhatsAppDateOrder } from "./types";

const TWENTY_FOUR_HOUR_TIME = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
const TWELVE_HOUR_TIME = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i;
const SLASH_DATE = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/;
const ISO_DATE = /^(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})$/;

function normalizeYear(year: number): number {
  return year < 100 ? year + 2000 : year;
}

function buildUtcDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
): Date | null {
  const candidate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

function parseTwentyFourHourTime(timePart: string): {
  hour: number;
  minute: number;
  second: number;
} | null {
  const match = timePart.match(TWENTY_FOUR_HOUR_TIME);
  if (!match) return null;

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
    second: Number(match[3] ?? 0),
  };
}

function parseTwelveHourTime(timePart: string): {
  hour: number;
  minute: number;
  second: number;
} | null {
  const match = timePart.match(TWELVE_HOUR_TIME);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? 0);
  const meridiem = match[4].toUpperCase();

  if (meridiem === "AM") {
    if (hour === 12) hour = 0;
  } else if (hour !== 12) {
    hour += 12;
  }

  return { hour, minute, second };
}

function resolveDayMonth(
  first: number,
  second: number,
  dateOrder: WhatsAppDateOrder,
): { day: number; month: number } | null {
  if (first > 12 && second > 12) return null;

  if (first > 12) return { day: first, month: second };
  if (second > 12) return { month: first, day: second };

  if (dateOrder === "dmy") return { day: first, month: second };
  if (dateOrder === "mdy") return { month: first, day: second };

  // Ambiguous dates default to day-first (common in WhatsApp exports outside the US).
  return { day: first, month: second };
}

function parseSlashDate(
  datePart: string,
  dateOrder: WhatsAppDateOrder,
): { day: number; month: number; year: number } | null {
  const match = datePart.match(SLASH_DATE);
  if (!match) return null;

  const first = Number(match[1]);
  const second = Number(match[2]);
  const year = normalizeYear(Number(match[3]));
  const resolved = resolveDayMonth(first, second, dateOrder);
  if (!resolved) return null;

  return { day: resolved.day, month: resolved.month, year };
}

function parseIsoDate(
  datePart: string,
): { day: number; month: number; year: number } | null {
  const match = datePart.match(ISO_DATE);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function parseWhatsAppDateTime(
  raw: string,
  dateOrder: WhatsAppDateOrder = "auto",
): Date | null {
  const normalized = raw
    .replace(/\u202f/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();

  const parts = normalized.split(/,\s*/);
  if (parts.length < 2) return null;

  const datePart = parts[0]?.trim();
  const timePart = parts.slice(1).join(", ").trim();
  if (!datePart || !timePart) return null;

  const time =
    parseTwentyFourHourTime(timePart) ?? parseTwelveHourTime(timePart);
  if (!time) return null;

  const slashDate = parseSlashDate(datePart, dateOrder);
  if (slashDate) {
    return buildUtcDate(
      slashDate.year,
      slashDate.month,
      slashDate.day,
      time.hour,
      time.minute,
      time.second,
    );
  }

  const isoDate = parseIsoDate(datePart);
  if (isoDate) {
    return buildUtcDate(
      isoDate.year,
      isoDate.month,
      isoDate.day,
      time.hour,
      time.minute,
      time.second,
    );
  }

  return null;
}
