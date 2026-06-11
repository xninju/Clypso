import httpx
import re
import asyncio
from typing import Optional

_VIDEO_ID_RE = re.compile(
    r"(?:v=|youtu\.be/|/shorts/)([a-zA-Z0-9_-]{11})"
)
_PLAYLIST_ID_RE = re.compile(r"[?&]list=([a-zA-Z0-9_-]+)")

# Fallback list — refreshed dynamically at runtime
_FALLBACK_INSTANCES = [
    "https://inv.thepixora.com",
    "https://invidious.incogniweb.net",
    "https://invidious.reallyaweso.me",
    "https://inv.makerlab.tech",
    "https://invidious.privacyredirect.com",
    "https://iv.datura.network",
    "https://invidious.fdn.fr",
]

_live_instances: list[str] = []
_instances_fetched = False


async def _refresh_instances() -> None:
    """Fetch the live list of API-enabled Invidious instances."""
    global _live_instances, _instances_fetched
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(
                "https://api.invidious.io/instances.json?sort_by=health"
            )
            if r.status_code == 200:
                data = r.json()
                instances = []
                for item in data:
                    name, info = item[0], item[1]
                    if info.get("api") and info.get("type") == "https":
                        instances.append(f"https://{name}")
                if instances:
                    _live_instances = instances[:10]
                    _instances_fetched = True
                    return
    except Exception:
        pass
    _live_instances = _FALLBACK_INSTANCES
    _instances_fetched = True


async def _get_instances() -> list[str]:
    global _instances_fetched
    if not _instances_fetched:
        await _refresh_instances()
    return _live_instances or _FALLBACK_INSTANCES


def extract_video_id(url: str) -> Optional[str]:
    m = _VIDEO_ID_RE.search(url)
    return m.group(1) if m else None


def extract_playlist_id(url: str) -> Optional[str]:
    m = _PLAYLIST_ID_RE.search(url)
    return m.group(1) if m else None


async def _get(path: str) -> Optional[dict]:
    """Try each live Invidious instance until one responds."""
    instances = await _get_instances()
    async with httpx.AsyncClient(timeout=10) as client:
        for instance in instances:
            try:
                r = await client.get(f"{instance}{path}")
                if r.status_code == 200:
                    data = r.json()
                    if data:
                        return data
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
