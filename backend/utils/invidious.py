import httpx
import re
from typing import Optional

INVIDIOUS_INSTANCES = [
    "https://inv.nadeko.net",
    "https://invidious.privacydev.net",
    "https://yt.artemislena.eu",
    "https://invidious.nerdvpn.de",
    "https://vid.puffyan.us",
]

_VIDEO_ID_RE = re.compile(
    r"(?:v=|youtu\.be/|/shorts/)([a-zA-Z0-9_-]{11})"
)
_PLAYLIST_ID_RE = re.compile(r"[?&]list=([a-zA-Z0-9_-]+)")


def extract_video_id(url: str) -> Optional[str]:
    m = _VIDEO_ID_RE.search(url)
    return m.group(1) if m else None


def extract_playlist_id(url: str) -> Optional[str]:
    m = _PLAYLIST_ID_RE.search(url)
    return m.group(1) if m else None


async def _get(path: str) -> Optional[dict]:
    """Try each Invidious instance until one responds."""
    async with httpx.AsyncClient(timeout=12) as client:
        for instance in INVIDIOUS_INSTANCES:
            try:
                r = await client.get(f"{instance}{path}")
                if r.status_code == 200:
                    return r.json()
            except Exception:
                continue
    return None


async def fetch_video(video_id: str) -> Optional[dict]:
    return await _get(f"/api/v1/videos/{video_id}")


async def fetch_playlist(playlist_id: str) -> Optional[dict]:
    return await _get(f"/api/v1/playlists/{playlist_id}")


def parse_video_formats(data: dict) -> list:
    """Extract combined (video+audio) formats from Invidious video data."""
    formats = []
    seen = set()

    for f in data.get("formatStreams", []):
        res = f.get("resolution", "")
        height = res.replace("p", "").strip()
        if not height or not height.isdigit():
            continue
        label = f"{height}p"
        if label in seen:
            continue
        seen.add(label)
        url = f.get("url")
        if not url:
            continue
        formats.append({
            "format_id": str(f.get("itag", height)),
            "label": label,
            "ext": "mp4",
            "filesize": "Unknown",
            "url": url,
            "has_audio": True,
        })

    formats.sort(key=lambda x: int(x["label"].replace("p", "")), reverse=True)
    return formats
