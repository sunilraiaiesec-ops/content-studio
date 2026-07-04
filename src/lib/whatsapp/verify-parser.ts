#!/usr/bin/env tsx
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parseWhatsAppExport } from "./index";

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, "__fixtures__");

function runFixture(name: string) {
  const text = readFileSync(join(fixturesDir, name), "utf8");
  const result = parseWhatsAppExport(text, {
    dateOrder: name.includes("ios") ? "mdy" : "dmy",
  });

  console.log(`\n=== ${name} ===`);
  console.log("participants:", result.participants.join(", ") || "(none)");
  console.log("stats:", result.stats);
  for (const message of result.messages) {
    const sender = message.sender ?? "system";
    const preview = message.body.replace(/\n/g, "\\n").slice(0, 60);
    console.log(
      `[${message.index}] ${message.sentAt.toISOString()} ${sender} (${message.direction}) ${preview}`,
    );
  }
}

for (const fixture of ["android-24h.txt", "ios-12h.txt"]) {
  runFixture(fixture);
}
