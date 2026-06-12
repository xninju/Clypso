from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.extractor import extract_info, format_filesize

router = APIRouter()


class URLRequest(BaseModel):
    url: str


def get_post_type(url: str) -> str:
    if "/reel/" in url:
        return "reel"
    if "/stories/" in url:
        return "story"
    return "post"


@router.post("/info")
async def get_instagram_info(req: URLRequest):
    url = req.url.strip()
    try:
        info = extract_info(url)
        if not info:
            raise HTTPException(status_code=400, detail="Could not fetch Instagram content")

        post_type = get_post_type(url)

        entries = info.get("entries")
        if entries:
            items = []
            for entry in entries:
                if not entry:
                    continue
                media = _pick_best_media(entry.get("formats", []), entry)
                if media:
                    items.append(media)
            return {
                "type":       "carousel",
                "post_type":  post_type,
                "title":      info.get("title", "Instagram Post"),
                "thumbnail":  info.get("thumbnail"),
                "item_count": len(items),
                "items":      items,
            }

        formats = info.get("formats", [])
        media = _pick_best_media(formats, info)
        if not media:
            raise HTTPException(status_code=400, detail="No downloadable media found")

        return {
            "type":       "single",
            "post_type":  post_type,
            "title":      info.get("title", "Instagram Post"),
            "thumbnail":  info.get("thumbnail"),
            "item_count": 1,
            "items":      [media],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _pick_best_media(formats: list, info: dict) -> dict | None:
    thumbnail = info.get("thumbnail")

    # 1. Combined video + audio (most important fix: prefer these over video-only DASH streams)
    combined = [
        f for f in formats
        if f.get("vcodec", "none") != "none"
        and f.get("acodec", "none") != "none"
        and f.get("url")
    ]
    if combined:
        combined.sort(key=lambda x: x.get("height") or 0, reverse=True)
        best = combined[0]
        return {
            "media_type": "video",
            "url":        best["url"],
            "thumbnail":  thumbnail,
            "quality":    f"{best.get('height', '?')}p",
            "ext":        best.get("ext", "mp4"),
            "filesize":   format_filesize(best.get("filesize") or best.get("filesize_approx")),
        }

    # 2. Any video format as fallback (video-only — no audio, but better than nothing)
    video_formats = [
        f for f in formats
        if f.get("vcodec", "none") != "none" and f.get("url")
    ]
    if video_formats:
        video_formats.sort(key=lambda x: x.get("height") or 0, reverse=True)
        best = video_formats[0]
        return {
            "media_type": "video",
            "url":        best["url"],
            "thumbnail":  thumbnail,
            "quality":    f"{best.get('height', '?')}p",
            "ext":        best.get("ext", "mp4"),
            "filesize":   format_filesize(best.get("filesize") or best.get("filesize_approx")),
        }

    # 3. Image formats
    image_formats = [
        f for f in formats
        if f.get("vcodec", "none") == "none"
        and f.get("acodec", "none") == "none"
        and f.get("url")
    ]
    if image_formats:
        image_formats.sort(
            key=lambda x: (x.get("width") or 0) * (x.get("height") or 0),
            reverse=True,
        )
        best = image_formats[0]
        return {
            "media_type": "image",
            "url":        best["url"],
            "thumbnail":  thumbnail or best["url"],
            "quality":    "Original",
            "ext":        best.get("ext", "jpg"),
            "filesize":   format_filesize(best.get("filesize")),
        }

    # 4. Thumbnail as last resort
    if thumbnail:
        return {
            "media_type": "image",
            "url":        thumbnail,
            "thumbnail":  thumbnail,
            "quality":    "Original",
            "ext":        "jpg",
            "filesize":   "Unknown",
        }

    return None
