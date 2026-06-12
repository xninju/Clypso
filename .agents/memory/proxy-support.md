---
name: Proxy / WARP support
description: How to enable WARP or any proxy for yt-dlp.
---

# Proxy Support

**Implementation:** `backend/utils/extractor.py` `get_ydl_opts()` checks `PROXY_URL` env var. If set, passes `opts["proxy"] = proxy` to yt-dlp.

**Supported formats:** Any yt-dlp-compatible proxy string — `socks5://host:port`, `http://host:port`, `https://host:port`.

**For Cloudflare WARP:** Install `warp-cli` on the server, run `warp-cli connect`, it creates a SOCKS5 proxy on `localhost:40000` (or similar). Set `PROXY_URL=socks5://127.0.0.1:40000`.

**Why not bundled:** WARP daemon requires system-level access not available in Replit/Render containers without Docker. The env var approach lets users plug in any proxy (residential, WARP, etc.) without app changes.
