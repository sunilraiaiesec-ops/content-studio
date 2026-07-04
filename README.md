# Content Studio

A standalone platform for managing AI-assisted Instagram and TikTok content creation. Upload original media, collect style inspiration, generate prompts, review content, schedule a 60-day growth sprint, and manage manual/automated publishing queues.

This is an independent project with its own Git history, database, and deployment configuration.

## Features (MVP)

- **Authentication** — email/password with secure JWT sessions
- **Original media library** — upload and tag photos/videos
- **Inspiration library** — save creator links with rich metadata (outfit, pose, mood, etc.)
- **Prompt studio** — generate Higgsfield-ready prompts from inspiration + reference media
- **Generated content library** — upload AI outputs, captions, and hashtags
- **Approval workflow** — draft → needs review → approved/rejected → scheduled → posted
- **60-day calendar** — week/day views with rescheduling
- **Scheduler** — auto-fill daily slots with diversity rules (outfit/location/mood)
- **Daily target tracker** — IG Stories (20), Reels (5), TikTok videos (5) per day
- **Publishing queue** — manual prep packs + automated slot placeholders
- **Social account settings** — Instagram/TikTok account configuration (OAuth in Phase 2)
- **Higgsfield auto-generation (Phase A)** — one-click generate from inspiration + her photos → Needs Review

## Phase A — Auto-generation workflow

1. Upload her photos in **Media Library** (you control inputs)
2. Save **Inspiration** links when you find Reels you like
3. Add `HIGGSFIELD_CREDENTIALS=KEY_ID:KEY_SECRET` to `.env` ([cloud.higgsfield.ai](https://cloud.higgsfield.ai))
4. Dashboard → **Generate 1 for review** (takes 2–5 minutes)
5. Review in **Content** → Approve or Reject — **nothing posts without approval**

Optional: set **Soul ID** in **Generation** settings for better identity on localhost.

For video generation with photo references, set `PUBLIC_BASE_URL` to a public URL (ngrok or deployed host).

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Prisma 7 + PostgreSQL
- Local file storage (dev) with S3-ready adapter interface

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
npm run docker:up
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set a strong `AUTH_SECRET` (at least 32 characters).

### 4. Run migrations and seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3010](http://localhost:3010) and sign in with the seeded credentials from `.env.example`:

- Email: `admin@contentstudio.local`
- Password: `changeme123`

## Project structure

```
src/
├── app/
│   ├── (dashboard)/     # Authenticated studio pages
│   ├── actions/         # Server actions
│   ├── api/             # File serving + dashboard API
│   └── login/
├── components/          # UI components
├── generated/prisma/    # Prisma client (generated)
└── lib/                 # Auth, storage, scheduler, prompt engine
prisma/
├── schema.prisma
└── seed.ts
```

## Daily targets (60-day sprint)

Default per-day targets:

| Platform  | Format  | Target |
|-----------|---------|--------|
| Instagram | Stories | 20     |
| Instagram | Reels   | 5      |
| TikTok    | Videos  | 5      |

Use **Fill today's schedule** or **Fill next 7 days** on the dashboard to auto-assign approved content. Stories default to **manual** publish mode; Reels/TikTok default to **auto** (API-ready).

## Phase 2 roadmap

- Daily cron auto-generation (`POST /api/cron/generate` + CRON_SECRET)
- ~~Email/WhatsApp review notifications~~ — WhatsApp implemented; see **Settings → WhatsApp**
- Instagram Graph API publishing
- TikTok Content Posting API
- AI caption and hashtag generation
- Analytics sync from platform APIs
- Team collaboration

## Deployment

1. Provision PostgreSQL (Supabase, Neon, RDS, etc.)
2. Set environment variables from `.env.example`
3. Use cloud object storage (S3/R2) instead of local `uploads/` for production
4. Deploy to Vercel — `vercel.json` runs migrations on build

## License

Private — all rights reserved.
