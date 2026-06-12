---
name: RapidAPI cascade
description: How the 3-API YouTube cascade works and how keys are loaded.
---

# RapidAPI Cascade

**Services (in priority order):**
- `yt_api` → `yt-api.p.rapidapi.com/dl?id=VIDEO_ID` (supports video + playlist)
- `yt_media_dl` → `youtube-media-downloader.p.rapidapi.com/v2/video/details?videoId=VIDEO_ID` (supports video + playlist)
- `ytstream` → `ytstream-download-youtube-videos.p.rapidapi.com/dl?id=VIDEO_ID` (video only, no playlist)

**Key loading:** `backend/utils/rapidapi.py` → `_get_keys()` queries `"ApiKey"` table in Neon DB (asyncpg), supplements with env vars `RAPIDAPI_YT_API_KEY`, `RAPIDAPI_YT_MEDIA_KEY`, `RAPIDAPI_YTSTREAM_KEY`. Cache TTL = 60s.

**Why:** Free tiers (~500 req/month each), no cookies needed, permanent solution vs yt-dlp bot detection.

**How to apply:** When adding a new API provider, add a `_try_*` function and register it in `_VIDEO_FNS` / `_PLAYLIST_FNS`. The cascade auto-picks lowest-priority-number first.

**Request count:** Incremented async via `_bump_count()` which writes to `ApiKey.req_count` in DB.
