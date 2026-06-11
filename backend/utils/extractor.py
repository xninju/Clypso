import yt_dlp
import tempfile
import os
import random
from typing import Optional

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Safari/605.1.15",
]

_cookies_file: Optional[str] = None


def init_cookies() -> None:
    """Called once at startup — write COOKIES_CONTENT env var to a temp file."""
    global _cookies_file

    # 1. Env var takes priority (Render / production)
    content = os.getenv("COOKIES_CONTENT", "").strip()
    if content:
        tmp = tempfile.NamedTemporaryFile(
            mode="w", suffix=".txt", delete=False, prefix="yt_cookies_"
        )
        tmp.write(content)
        tmp.close()
        _cookies_file = tmp.name
        print(f"[cookies] Loaded from COOKIES_CONTENT env var → {_cookies_file}")
        return

    # 2. Local cookies.txt next to this repo (dev / local setup_cookies.py)
    local_path = os.path.join(os.path.dirname(__file__), "..", "cookies.txt")
    local_path = os.path.abspath(local_path)
    if os.path.exists(local_path):
        _cookies_file = local_path
        print(f"[cookies] Loaded from local file → {_cookies_file}")
        return

    # 3. Docker path
    if os.path.exists("/app/cookies.txt"):
        _cookies_file = "/app/cookies.txt"
        print("[cookies] Loaded from /app/cookies.txt")
        return

    print("[cookies] No cookies found — YouTube may block requests from this IP.")


def get_ydl_opts(extract_flat: bool = False) -> dict:
    opts = {
        "quiet": False,
        "no_warnings": False,
        "extract_flat": extract_flat,
        "socket_timeout": 30,
        "extractor_args": {
            "youtube": {
                "player_client": ["tv_embedded", "ios", "web"],
                "player_skip": [],
            }
        },
        "http_headers": {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    }

    if _cookies_file and os.path.exists(_cookies_file):
        opts["cookiefile"] = _cookies_file

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

    result.sort(key=lambda x: int(x["label"].replace("p", "")), reverse=True)

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
