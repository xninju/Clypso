"""
RapidAPI YouTube extraction cascade.
Tries up to 3 managed services in priority order from Neon DB (or env vars),
then falls back to yt-dlp / Invidious in the calling route.
"""
import asyncio
import os
import time
from typing import Optional

import httpx

_KEY_CACHE: dict = {}
_KEY_CACHE_AT: float = 0.0
_KEY_TTL: float = 60.0  # refresh every 60 s


async def _get_keys() -> list[dict]:
    """
    Load enabled API key records sorted by priority.
    Checks Neon DB first; falls back to env vars.
    Each record: {id, service, key, priority}
    """
    global _KEY_CACHE, _KEY_CACHE_AT

    now = time.time()
    if now - _KEY_CACHE_AT < _KEY_TTL and _KEY_CACHE:
        return _KEY_CACHE.get("keys", [])

    keys: list[dict] = []

    try:
        from utils.db import get_pool
        pool = await get_pool()
        if pool:
            rows = await pool.fetch(
                'SELECT id, service, key, priority FROM "ApiKey" '
                'WHERE enabled = true ORDER BY priority ASC, id ASC',
                timeout=5,
            )
            for row in rows:
                keys.append({
                    "id": row["id"],
                    "service": row["service"],
                    "key": row["key"],
                    "priority": row["priority"],
                })
    except Exception as e:
        print(f"[rapidapi] DB key load: {e}")

    env_fallbacks = {
        "yt_api":      os.getenv("RAPIDAPI_YT_API_KEY", ""),
        "yt_media_dl": os.getenv("RAPIDAPI_YT_MEDIA_KEY", ""),
        "ytstream":    os.getenv("RAPIDAPI_YTSTREAM_KEY", ""),
    }
    existing = {k["service"] for k in keys}
    for service, key in env_fallbacks.items():
        if key and service not in existing:
            keys.append({"id": None, "service": service, "key": key, "priority": 99})

    _KEY_CACHE = {"keys": keys}
    _KEY_CACHE_AT = now
    return keys


def invalidate_key_cache() -> None:
    global _KEY_CACHE_AT
    _KEY_CACHE_AT = 0.0


def _fmt_size(size) -> str:
    try:
        size = int(size)
    except (TypeError, ValueError):
        return "Unknown"
    if size <= 0:
        return "Unknown"
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} TB"


def _height_sort_key(label: str) -> int:
    try:
        return int(label.lower().replace("p", "").split(" ")[0])
    except Exception:
        return 0


def _parse_ytapi_formats(data: dict) -> list[dict]:
    """Parse YT-API / YTStream progressive (muxed video+audio) formats."""
    formats = []
    seen: set[str] = set()
    for f in data.get("formats", []):
        url = f.get("url", "")
        label = f.get("qualityLabel", "")
        if not url or not label or label in seen:
            continue
        seen.add(label)
        mime = f.get("mimeType", "")
        ext = "mp4" if "mp4" in mime else "webm"
        formats.append({
            "format_id": str(f.get("itag", label)),
            "label":     label,
            "ext":       ext,
            "filesize":  _fmt_size(f.get("contentLength")),
            "url":       url,
            "has_audio": True,
        })
    formats.sort(key=lambda x: _height_sort_key(x["label"]), reverse=True)
    return formats


def _parse_ytmedia_formats(data: dict) -> list[dict]:
    """Parse YouTube Media Downloader (DataFanatic) formats."""
    formats = []
    seen: set[str] = set()
    videos = data.get("videos", {})
    items = videos.get("items", []) if isinstance(videos, dict) else []
    for item in items:
        url = item.get("url", "")
        if not url or not item.get("hasAudio", True):
            continue
        quality = item.get("quality", "")
        if "x" in quality:
            try:
                label = f"{int(quality.split('x')[1])}p"
            except Exception:
                label = quality
        elif quality:
            label = quality if "p" in quality else f"{quality}p"
        else:
            continue
        if label in seen:
            continue
        seen.add(label)
        formats.append({
            "format_id": label,
            "label":     label,
            "ext":       item.get("extension", "mp4"),
            "filesize":  _fmt_size(item.get("size", 0)),
            "url":       url,
            "has_audio": True,
        })
    formats.sort(key=lambda x: _height_sort_key(x["label"]), reverse=True)
    return formats


async def _yt_api_video(video_id: str, key: str) -> Optional[dict]:
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(
            "https://yt-api.p.rapidapi.com/dl",
            params={"id": video_id},
            headers={"x-rapidapi-key": key, "x-rapidapi-host": "yt-api.p.rapidapi.com"},
        )
        r.raise_for_status()
        d = r.json()
    if d.get("status") != "OK":
        return None
    formats = _parse_ytapi_formats(d)
    if not formats:
        return None
    thumbs = d.get("thumbnail", [])
    thumb = thumbs[0].get("url") if thumbs else f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
    return {
        "title":      d.get("title", "Unknown"),
        "channel":    d.get("channel", "Unknown"),
        "thumbnail":  thumb,
        "duration":   int(d.get("lengthSeconds") or 0),
        "view_count": int(d.get("viewCount") or 0),
        "formats":    formats,
    }


async def _yt_api_playlist(playlist_id: str, key: str) -> Optional[dict]:
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(
            "https://yt-api.p.rapidapi.com/playlist",
            params={"id": playlist_id},
            headers={"x-rapidapi-key": key, "x-rapidapi-host": "yt-api.p.rapidapi.com"},
        )
        r.raise_for_status()
        d = r.json()
    if d.get("status") != "OK":
        return None
    videos = []
    for v in (d.get("data") or [])[:50]:
        vid_id = v.get("id", "")
        thumbs = v.get("thumbnail", [])
        thumb = (thumbs[0].get("url") if thumbs
                 else f"https://img.youtube.com/vi/{vid_id}/hqdefault.jpg")
        videos.append({
            "id":        vid_id,
            "title":     v.get("title", "Unknown"),
            "url":       f"https://www.youtube.com/watch?v={vid_id}",
            "thumbnail": thumb,
            "duration":  int(v.get("lengthSeconds") or 0),
        })
    thumbs = d.get("thumbnail", [])
    thumb = (thumbs[0].get("url") if thumbs
             else (f"https://img.youtube.com/vi/{videos[0]['id']}/hqdefault.jpg" if videos else None))
    return {
        "type":        "playlist",
        "title":       d.get("title", "Playlist"),
        "channel":     d.get("channel", "Unknown"),
        "thumbnail":   thumb,
        "video_count": int(d.get("videoCount") or len(videos)),
        "videos":      videos,
    }


async def _ytstream_video(video_id: str, key: str) -> Optional[dict]:
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(
            "https://ytstream-download-youtube-videos.p.rapidapi.com/dl",
            params={"id": video_id},
            headers={"x-rapidapi-key": key,
                     "x-rapidapi-host": "ytstream-download-youtube-videos.p.rapidapi.com"},
        )
        r.raise_for_status()
        d = r.json()
    if d.get("status") != "OK":
        return None
    formats = _parse_ytapi_formats(d)
    if not formats:
        return None
    thumbs = d.get("thumbnail", [])
    thumb = thumbs[0].get("url") if thumbs else f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
    return {
        "title":      d.get("title", "Unknown"),
        "channel":    d.get("channel", "Unknown"),
        "thumbnail":  thumb,
        "duration":   int(d.get("lengthSeconds") or 0),
        "view_count": int(d.get("viewCount") or 0),
        "formats":    formats,
    }


async def _ytmedia_video(video_id: str, key: str) -> Optional[dict]:
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get(
            "https://youtube-media-downloader.p.rapidapi.com/v2/video/details",
            params={"videoId": video_id},
            headers={"x-rapidapi-key": key,
                     "x-rapidapi-host": "youtube-media-downloader.p.rapidapi.com"},
        )
        r.raise_for_status()
        d = r.json()
    if not d.get("status"):
        return None
    formats = _parse_ytmedia_formats(d)
    if not formats:
        return None
    thumbs = d.get("thumbnails", [])
    thumb = (thumbs[0].get("url") if thumbs
             else f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg")
    return {
        "title":      d.get("title", "Unknown"),
        "channel":    d.get("channel", "Unknown"),
        "thumbnail":  thumb,
        "duration":   int(d.get("duration") or 0),
        "view_count": int(d.get("viewCount") or 0),
        "formats":    formats,
    }


async def _ytmedia_playlist(playlist_id: str, key: str) -> Optional[dict]:
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(
            "https://youtube-media-downloader.p.rapidapi.com/v2/playlist/details",
            params={"playlistId": playlist_id},
            headers={"x-rapidapi-key": key,
                     "x-rapidapi-host": "youtube-media-downloader.p.rapidapi.com"},
        )
        r.raise_for_status()
        d = r.json()
    if not d.get("status"):
        return None
    videos_data = d.get("videos", {})
    items = videos_data.get("items", []) if isinstance(videos_data, dict) else []
    videos = []
    for v in items[:50]:
        vid_id = v.get("id", "")
        thumbs = v.get("thumbnails", [])
        thumb = (thumbs[0].get("url") if thumbs
                 else f"https://img.youtube.com/vi/{vid_id}/hqdefault.jpg")
        videos.append({
            "id":        vid_id,
            "title":     v.get("title", "Unknown"),
            "url":       f"https://www.youtube.com/watch?v={vid_id}",
            "thumbnail": thumb,
            "duration":  int(v.get("duration") or 0),
        })
    thumbs = d.get("thumbnails", [])
    thumb = thumbs[0].get("url") if thumbs else None
    return {
        "type":        "playlist",
        "title":       d.get("title", "Playlist"),
        "channel":     d.get("channel", "Unknown"),
        "thumbnail":   thumb,
        "video_count": int(d.get("videoCount") or len(videos)),
        "videos":      videos,
    }


_VIDEO_FNS = {
    "yt_api":      _yt_api_video,
    "ytstream":    _ytstream_video,
    "yt_media_dl": _ytmedia_video,
}
_PLAYLIST_FNS = {
    "yt_api":      _yt_api_playlist,
    "yt_media_dl": _ytmedia_playlist,
}


async def _bump_count(key_id) -> None:
    if not key_id:
        return
    try:
        from utils.db import get_pool
        pool = await get_pool()
        if pool:
            await pool.execute(
                'UPDATE "ApiKey" SET req_count = req_count + 1, "updatedAt" = NOW() WHERE id = $1',
                key_id, timeout=5,
            )
    except Exception:
        pass


async def fetch_video_info(video_id: str) -> Optional[dict]:
    """Try all enabled API keys in priority order for a single video."""
    for rec in await _get_keys():
        fn = _VIDEO_FNS.get(rec["service"])
        if not fn:
            continue
        try:
            result = await fn(video_id, rec["key"])
            if result:
                print(f"[rapidapi] {rec['service']}: OK for {video_id}")
                asyncio.create_task(_bump_count(rec["id"]))
                return result
        except Exception as e:
            print(f"[rapidapi] {rec['service']}: failed ({e})")
    return None


async def fetch_playlist_info(playlist_id: str) -> Optional[dict]:
    """Try all enabled API keys for a playlist."""
    for rec in await _get_keys():
        fn = _PLAYLIST_FNS.get(rec["service"])
        if not fn:
            continue
        try:
            result = await fn(playlist_id, rec["key"])
            if result:
                print(f"[rapidapi] {rec['service']} playlist: OK for {playlist_id}")
                asyncio.create_task(_bump_count(rec["id"]))
                return result
        except Exception as e:
            print(f"[rapidapi] {rec['service']} playlist: failed ({e})")
    return None
