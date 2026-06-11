import yt_dlp
from typing import Optional
import random

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
]


def get_ydl_opts(extract_flat: bool = False, use_cookies: bool = False) -> dict:
    import os
    opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": extract_flat,
        "socket_timeout": 30,
        "extractor_args": {
            "youtube": {
                "player_client": ["web_creator", "android", "web"],
                "player_skip": [],
            }
        },
        "http_headers": {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    }

    # Use cookies file if it exists
    cookies_path = "/app/cookies.txt"
    if os.path.exists(cookies_path):
        opts["cookiefile"] = cookies_path

    return opts


def extract_info(url: str, download: bool = False, extract_flat: bool = False) -> Optional[dict]:
    opts = get_ydl_opts(extract_flat=extract_flat)
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=download)
        return ydl.sanitize_info(info)


def format_filesize(bytes_val: Optional[int]) -> str:
    if not bytes_val:
        return "Unknown"
    for unit in ["B", "KB", "MB", "GB"]:
        if bytes_val < 1024:
            return f"{bytes_val:.1f} {unit}"
        bytes_val /= 1024
    return f"{bytes_val:.1f} TB"


def parse_formats(formats: list) -> list:
    """Parse and clean up format list for video+audio options."""
    seen = set()
    result = []

    # Combined video+audio formats first
    for f in formats:
        height = f.get("height")
        vcodec = f.get("vcodec", "none")
        acodec = f.get("acodec", "none")
        ext = f.get("ext", "mp4")
        url = f.get("url")

        if not url or vcodec == "none":
            continue

        if acodec != "none" and height:
            label = f"{height}p"
            if label not in seen:
                seen.add(label)
                result.append({
                    "format_id": f.get("format_id"),
                    "label": label,
                    "ext": ext,
                    "filesize": format_filesize(f.get("filesize") or f.get("filesize_approx")),
                    "url": url,
                    "has_audio": True,
                })

    # Sort by quality descending
    result.sort(key=lambda x: int(x["label"].replace("p", "")), reverse=True)

    # If no combined formats found, add best available
    if not result:
        for f in formats:
            url = f.get("url")
            height = f.get("height")
            if url and height:
                has_audio = f.get("acodec", "none") != "none"
                result.append({
                    "format_id": f.get("format_id"),
                    "label": f"{height}p",
                    "ext": f.get("ext", "mp4"),
                    "filesize": format_filesize(f.get("filesize")),
                    "url": url,
                    "has_audio": has_audio,
                })
                break

    return result
