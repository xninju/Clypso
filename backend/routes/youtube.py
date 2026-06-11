from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.extractor import extract_info, parse_formats
import re

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

    try:
        # Handle playlists
        if is_playlist(url):
            info = extract_info(url, extract_flat=True)
            if not info:
                raise HTTPException(status_code=400, detail="Could not fetch playlist info")

            entries = info.get("entries", [])
            videos = []
            for entry in entries[:50]:  # Limit to 50 for performance
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

        # Single video or short
        info = extract_info(url)
        if not info:
            raise HTTPException(status_code=400, detail="Could not fetch video info")

        formats = parse_formats(info.get("formats", []))

        return {
            "type": "short" if is_short(url) else "video",
            "title": info.get("title", "Unknown"),
            "channel": info.get("uploader", "Unknown"),
            "thumbnail": info.get("thumbnail"),
            "duration": info.get("duration"),
            "view_count": info.get("view_count"),
            "formats": formats,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/playlist-video")
async def get_playlist_video_formats(req: URLRequest):
    """Get download formats for a single video from a playlist."""
    url = req.url.strip()
    try:
        info = extract_info(url)
        if not info:
            raise HTTPException(status_code=400, detail="Could not fetch video info")

        formats = parse_formats(info.get("formats", []))
        return {
            "title": info.get("title", "Unknown"),
            "thumbnail": info.get("thumbnail"),
            "formats": formats,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
