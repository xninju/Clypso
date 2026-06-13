# Clypso 🎬

**Free video downloader** supporting YouTube, Instagram, TikTok, and Facebook. No login required. No watermarks.

**Stack:** Next.js 15 · Prisma 5 · Neon PostgreSQL · Tailwind CSS · TypeScript · pnpm

---

## Features

| Feature | Supported |
|---------|-----------|
| YouTube videos (all qualities) | ✅ |
| YouTube Shorts | ✅ |
| YouTube Playlists (up to 50 videos) | ✅ |
| Instagram single posts | ✅ |
| Instagram Reels | ✅ |
| Instagram Carousels (multi-photo/video) | ✅ |
| TikTok videos (no watermark) | ✅ |
| Facebook videos & reels | ✅ |
| Visit + download counter (per platform) | ✅ |
| Admin panel with API key management | ✅ |
| No login required | ✅ |
| No watermarks | ✅ |

---

## Architecture

Single Next.js 15 app — no separate backend needed. All API calls are server-side Route Handlers.

```
clypso/
├── app/
│   ├── page.tsx                  — Unified URL bar, platform auto-detection
│   ├── admin/page.tsx            — Admin panel (PIN-protected)
│   └── api/
│       ├── youtube/info/         — YouTube downloader (RapidAPI cascade)
│       ├── instagram/info/       — Instagram downloader (RapidAPI)
│       ├── tiktok/info/          — TikTok downloader (RapidAPI)
│       ├── facebook/info/        — Facebook downloader (RapidAPI)
│       └── stats/                — Download stats endpoint
├── components/                   — UI components
├── prisma/schema.prisma          — Neon DB schema
└── lib/prisma.ts                 — Prisma client
```

---

## Database (Neon)

Uses Neon PostgreSQL. Tables:

| Table | Purpose |
|-------|---------|
| `YtApiKey` | YouTube RapidAPI keys |
| `IgApiKey` | Instagram RapidAPI keys |
| `TtApiKey` | TikTok RapidAPI keys |
| `FbApiKey` | Facebook RapidAPI keys |
| `Stats` | Visit + download counters |
| `DownloadLog` | Per-download log |
| `ApiKey` | Legacy key table |
| `Feedback` | User feedback |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `ADMIN_PIN` | PIN to access the admin panel at `/admin` |
| `PROXY_URL` | (Optional) SOCKS5/HTTP proxy for yt-dlp |

---

## API Keys Setup

All RapidAPI keys are managed via the admin panel at `/admin`.

### Recommended Free APIs (no credit card)

**YouTube** — cascade of 3 APIs (priority order):
1. `yt_api` — [YouTube Data API](https://rapidapi.com/h0p3rwe/api/youtube138)
2. `yt_media_dl` — [YouTube Media Downloader](https://rapidapi.com/ugoBoy/api/social-media-video-downloader)
3. `ytstream` — [YtStream](https://rapidapi.com/ytjar/api/ytstream-download-yt-videos)

**Instagram:**
- `ig_diyorbekkanal` — [Instagram Post/Reels/Stories Downloader](https://rapidapi.com/diyorbekkanal/api/instagram-post-reels-stories-downloader-api) · 100 req/month free

**TikTok:**
- `tt_7scorp` — [TikTok Downloader No Watermark](https://rapidapi.com/7scorp-7scorp-default/api/tiktok-downloader-download-tiktok-videos-without-watermark) · 400 req/month free

**Facebook:**
- `fb_3205` — [facebook (by 3205)](https://rapidapi.com/3205/api/facebook17) · **1,000 req/month free · no card required** ⭐ Recommended
- `fb_bravedownz` — [Facebook Story Saver](https://rapidapi.com/bravedownz/api/facebook-story-saver-and-video-downloader) · requires card

---

## Local Development

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Add DATABASE_URL and ADMIN_PIN to .env.local

# Push Prisma schema to DB
pnpm prisma db push

# Start dev server
pnpm dev
# App runs at http://localhost:3000
```

---

## Admin Panel

Visit `/admin` and enter your `ADMIN_PIN`. From there you can:
- Add / remove / enable / disable API keys per platform
- View request counts per key
- Monitor key health

---

## Notes

- Only **public** posts can be downloaded (Instagram, Facebook)
- For personal use only — respect content creators' rights
- RapidAPI keys are stored in the Neon DB and cached for 60 seconds
