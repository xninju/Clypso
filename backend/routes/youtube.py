from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.extractor import extract_info, parse_formats
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


def is_playlist(url: str) -> bool:
    return "list=" in url and "watch?v=" not in url


def is_short(url: str) -> bool:
    return "/shorts/" in url


@router.post("/info")
async def get_youtube_info(req: URLRequest):
    url = req.url.strip()

    # ── Playlist ────────────────────────────────────────────────────────────
    if is_playlist(url):
        # Try yt-dlp first
        try:
            info = extract_info(url, extract_flat=True)
            if info:
                entries = info.get("entries", [])
                videos = []
                for entry in entries[:50]:
                    if entry:
                        videos.append({
                            "id": entry.get("id"),
                            "title": entry.get("title", "Unknown"),
                            "url": f"https://www.youtube.com/watch?v={entry.get('id')}",
                            "thumbnail": entry.get("thumbnail") or f"https://img.youtube.com/vi/{entry.get('id')}/hqdefault.jpg",
                            "duration": entry.get("duration"),
                        })
                return {
                    "type": "playlist",
                    "title": info.get("title", "Playlist"),
                    "channel": info.get("uploader", "Unknown"),
                    "thumbnail": info.get("thumbnail"),
                    "video_count": len(entries),
                    "videos": videos,
                }
        except Exception:
            pass

        # Invidious fallback for playlists
        playlist_id = extract_playlist_id(url)
        if playlist_id:
            data = await fetch_playlist(playlist_id)
            if data:
                videos = []
                for v in (data.get("videos") or [])[:50]:
                    vid_id = v.get("videoId", "")
                    videos.append({
                        "id": vid_id,
                        "title": v.get("title", "Unknown"),
                        "url": f"https://www.youtube.com/watch?v={vid_id}",
                        "thumbnail": f"https://img.youtube.com/vi/{vid_id}/hqdefault.jpg",
                        "duration": v.get("lengthSeconds"),
                    })
                return {
                    "type": "playlist",
                    "title": data.get("title", "Playlist"),
                    "channel": data.get("author", "Unknown"),
                    "thumbnail": data.get("playlistThumbnail") or (
                        f"https://img.youtube.com/vi/{videos[0]['id']}/hqdefault.jpg" if videos else None
                    ),
                    "video_count": data.get("videoCount", len(videos)),
                    "videos": videos,
                }

        raise HTTPException(status_code=400, detail="Could not fetch playlist info")

    # ── Single video / short ─────────────────────────────────────────────────
    yt_error = None
    try:
        info = extract_info(url)
        if info:
            formats = parse_formats(info.get("formats", []))
            if formats:
                return {
                    "type": "short" if is_short(url) else "video",
                    "title": info.get("title", "Unknown"),
                    "channel": info.get("uploader", "Unknown"),
                    "thumbnail": info.get("thumbnail"),
                    "duration": info.get("duration"),
                    "view_count": info.get("view_count"),
                    "formats": formats,
                }
    except Exception as e:
        yt_error = e

    # Invidious fallback for single videos
    video_id = extract_video_id(url)
    if video_id:
        data = await fetch_video(video_id)
        if data:
            formats = parse_video_formats(data)
            if formats:
                return {
                    "type": "short" if is_short(url) else "video",
                    "title": data.get("title", "Unknown"),
                    "channel": data.get("author", "Unknown"),
                    "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                    "duration": data.get("lengthSeconds"),
                    "view_count": data.get("viewCount"),
                    "formats": formats,
                }

    detail = str(yt_error) if yt_error else "Could not fetch video info"
    raise HTTPException(status_code=500, detail=detail)


@router.post("/playlist-video")
async def get_playlist_video_formats(req: URLRequest):
    """Get download formats for a single video from a playlist."""
    url = req.url.strip()

    # Try yt-dlp first
    try:
        info = extract_info(url)
        if info:
            formats = parse_formats(info.get("formats", []))
            if formats:
                return {
                    "title": info.get("title", "Unknown"),
                    "thumbnail": info.get("thumbnail"),
                    "formats": formats,
                }
    except Exception:
        pass

    # Invidious fallback
    video_id = extract_video_id(url)
    if video_id:
        data = await fetch_video(video_id)
        if data:
            formats = parse_video_formats(data)
            if formats:
                return {
                    "title": data.get("title", "Unknown"),
                    "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                    "formats": formats,
                }

    raise HTTPException(status_code=400, detail="Could not fetch video info")
