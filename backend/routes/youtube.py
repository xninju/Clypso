from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from utils.extractor import extract_info, parse_formats
from utils.rapidapi import fetch_video_info, fetch_playlist_info
from utils.invidious import (
    fetch_video,
    fetch_playlist,
    extract_video_id,
    extract_playlist_id,
    parse_video_formats,
)

router = APIRouter()


class URLRequest(BaseModel):
    url: str


def _is_playlist(url: str) -> bool:
    return "list=" in url and "watch?v=" not in url


def _is_short(url: str) -> bool:
    return "/shorts/" in url


def _extract_video_id_from_url(url: str) -> str | None:
    return extract_video_id(url)


# ────────────────────────────────────────────────────────────────────────────
# POST /youtube/info
# ────────────────────────────────────────────────────────────────────────────
@router.post("/info")
async def get_youtube_info(req: URLRequest):
    url = req.url.strip()

    # ── Playlist ─────────────────────────────────────────────────────────────
    if _is_playlist(url):
        playlist_id = extract_playlist_id(url)

        # 1. RapidAPI cascade
        if playlist_id:
            data = await fetch_playlist_info(playlist_id)
            if data:
                return data

        # 2. yt-dlp
        try:
            info = extract_info(url, extract_flat=True)
            if info:
                entries = info.get("entries", [])
                videos = []
                for entry in entries[:50]:
                    if entry:
                        vid_id = entry.get("id")
                        videos.append({
                            "id":        vid_id,
                            "title":     entry.get("title", "Unknown"),
                            "url":       f"https://www.youtube.com/watch?v={vid_id}",
                            "thumbnail": (entry.get("thumbnail")
                                          or f"https://img.youtube.com/vi/{vid_id}/hqdefault.jpg"),
                            "duration":  entry.get("duration"),
                        })
                return {
                    "type":        "playlist",
                    "title":       info.get("title", "Playlist"),
                    "channel":     info.get("uploader", "Unknown"),
                    "thumbnail":   info.get("thumbnail"),
                    "video_count": len(entries),
                    "videos":      videos,
                }
        except Exception:
            pass

        # 3. Invidious fallback
        if playlist_id:
            data = await fetch_playlist(playlist_id)
            if data:
                videos = []
                for v in (data.get("videos") or [])[:50]:
                    vid_id = v.get("videoId", "")
                    videos.append({
                        "id":        vid_id,
                        "title":     v.get("title", "Unknown"),
                        "url":       f"https://www.youtube.com/watch?v={vid_id}",
                        "thumbnail": f"https://img.youtube.com/vi/{vid_id}/hqdefault.jpg",
                        "duration":  v.get("lengthSeconds"),
                    })
                return {
                    "type":        "playlist",
                    "title":       data.get("title", "Playlist"),
                    "channel":     data.get("author", "Unknown"),
                    "thumbnail":   data.get("playlistThumbnail") or (
                        f"https://img.youtube.com/vi/{videos[0]['id']}/hqdefault.jpg"
                        if videos else None
                    ),
                    "video_count": data.get("videoCount", len(videos)),
                    "videos":      videos,
                }

        raise HTTPException(status_code=400, detail="Could not fetch playlist info")

    # ── Single video / short ─────────────────────────────────────────────────
    video_id = extract_video_id(url)
    content_type = "short" if _is_short(url) else "video"

    # 1. RapidAPI cascade
    if video_id:
        data = await fetch_video_info(video_id)
        if data:
            return {
                "type":       content_type,
                "title":      data["title"],
                "channel":    data["channel"],
                "thumbnail":  data["thumbnail"],
                "duration":   data.get("duration"),
                "view_count": data.get("view_count"),
                "formats":    data["formats"],
            }

    # 2. yt-dlp
    yt_error = None
    try:
        info = extract_info(url)
        if info:
            formats = parse_formats(info.get("formats", []))
            if formats:
                return {
                    "type":       content_type,
                    "title":      info.get("title", "Unknown"),
                    "channel":    info.get("uploader", "Unknown"),
                    "thumbnail":  info.get("thumbnail"),
                    "duration":   info.get("duration"),
                    "view_count": info.get("view_count"),
                    "formats":    formats,
                }
    except Exception as e:
        yt_error = e

    # 3. Invidious fallback
    if video_id:
        data = await fetch_video(video_id)
        if data:
            formats = parse_video_formats(data)
            if formats:
                return {
                    "type":       content_type,
                    "title":      data.get("title", "Unknown"),
                    "channel":    data.get("author", "Unknown"),
                    "thumbnail":  f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                    "duration":   data.get("lengthSeconds"),
                    "view_count": data.get("viewCount"),
                    "formats":    formats,
                }

    detail = str(yt_error) if yt_error else "Could not fetch video info"
    raise HTTPException(status_code=500, detail=detail)


# ────────────────────────────────────────────────────────────────────────────
# POST /youtube/playlist-video
# ────────────────────────────────────────────────────────────────────────────
@router.post("/playlist-video")
async def get_playlist_video_formats(req: URLRequest):
    """Get download formats for a single video within a playlist."""
    url = req.url.strip()
    video_id = extract_video_id(url)

    # 1. RapidAPI cascade
    if video_id:
        data = await fetch_video_info(video_id)
        if data:
            return {
                "title":     data["title"],
                "thumbnail": data["thumbnail"],
                "formats":   data["formats"],
            }

    # 2. yt-dlp
    try:
        info = extract_info(url)
        if info:
            formats = parse_formats(info.get("formats", []))
            if formats:
                return {
                    "title":     info.get("title", "Unknown"),
                    "thumbnail": info.get("thumbnail"),
                    "formats":   formats,
                }
    except Exception:
        pass

    # 3. Invidious fallback
    if video_id:
        data = await fetch_video(video_id)
        if data:
            formats = parse_video_formats(data)
            if formats:
                return {
                    "title":     data.get("title", "Unknown"),
                    "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                    "formats":   formats,
                }

    raise HTTPException(status_code=400, detail="Could not fetch video info")
