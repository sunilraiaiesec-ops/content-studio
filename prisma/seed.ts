import "dotenv/config";
import { addDays, startOfDay } from "date-fns";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { hashPassword } from "../src/lib/auth/password";
import { DEFAULT_DAILY_TARGETS } from "../src/lib/constants";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function syncWhatsAppPhone(): Promise<void> {
  const whatsappPhone = process.env.SEED_WHATSAPP_PHONE?.trim();
  if (!whatsappPhone) return;

  const talent = await prisma.talentProfile.findFirst({ orderBy: { createdAt: "asc" } });
  if (!talent) return;

  await prisma.talentProfile.update({
    where: { id: talent.id },
    data: { whatsappPhone, whatsappNotifyOnReview: true },
  });

  console.log(`WhatsApp review alerts enabled for ${whatsappPhone}`);
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@contentstudio.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";
  const name = process.env.SEED_ADMIN_NAME ?? "Studio Admin";
  const talentName = process.env.SEED_TALENT_NAME ?? "Talent";
  const whatsappPhone = process.env.SEED_WHATSAPP_PHONE?.trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await syncWhatsAppPhone();
    console.log("Seed skipped — admin user already exists.");
    return;
  }

  const passwordHash = await hashPassword(password);
  const slug = talentName.toLowerCase().replace(/\s+/g, "-");
  const start = startOfDay(new Date());

  await prisma.$transaction(async (tx) => {
    await tx.user.create({ data: { email, name, passwordHash, role: "ADMIN" } });
    const talent = await tx.talentProfile.create({
      data: {
        displayName: talentName,
        slug,
        notes: "Primary talent profile",
        whatsappPhone: whatsappPhone ?? null,
        whatsappNotifyOnReview: Boolean(whatsappPhone),
      },
    });
    await tx.postingCalendar.create({
      data: {
        talentId: talent.id,
        name: "60-Day Growth Sprint",
        startDate: start,
        endDate: addDays(start, 59),
        targets: DEFAULT_DAILY_TARGETS,
      },
    });
  });

  console.log(`Seeded admin: ${email}`);
  console.log(`Seeded talent: ${talentName}`);
  if (whatsappPhone) {
    console.log(`WhatsApp review alerts enabled for ${whatsappPhone}`);
  }
  console.log("60-day calendar created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
