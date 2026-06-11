import yt_dlp
from typing import Optional


def get_ydl_opts(extract_flat: bool = False) -> dict:
    return {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": extract_flat,
        "socket_timeout": 30,
    }


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

        # Only include formats that have both video and audio
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
                result.append({
                    "format_id": f.get("format_id"),
                    "label": f"{height}p",
                    "ext": f.get("ext", "mp4"),
                    "filesize": format_filesize(f.get("filesize")),
                    "url": url,
                    "has_audio": True,
                })
                break

    return result
