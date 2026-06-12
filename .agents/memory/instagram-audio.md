---
name: Instagram audio fix
description: Why Instagram videos had no audio and how it was fixed.
---

# Instagram Audio Fix

**Problem:** `_pick_best_media` sorted by height and picked the highest-resolution video format, which was often a video-only DASH stream (acodec = "none").

**Fix:** In `backend/routes/instagram.py` `_pick_best_media()`, first try "combined" formats where BOTH `vcodec != "none"` AND `acodec != "none"`. Only fall back to video-only if no combined format exists.

**Why DASH is an issue:** Instagram (via yt-dlp) returns separate video and audio DASH streams at high quality + a combined MP4 at native resolution. The combined MP4 has both tracks — always prefer it.
