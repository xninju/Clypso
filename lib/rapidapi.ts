import { prisma } from "./prisma";

interface KeyRecord {
  id: number | null;
  service: string;
  key: string;
  priority: number;
}

let _keyCache: KeyRecord[] = [];
let _keyCacheAt = 0;
const KEY_TTL = 60_000;

async function getKeys(): Promise<KeyRecord[]> {
  const now = Date.now();
  if (now - _keyCacheAt < KEY_TTL && _keyCache.length > 0) return _keyCache;

  const keys: KeyRecord[] = [];

  try {
    const rows = await prisma.ytApiKey.findMany({
      where: { enabled: true },
      orderBy: [{ priority: "asc" }, { id: "asc" }],
    });
    for (const r of rows) {
      keys.push({ id: r.id, service: r.service, key: r.key, priority: r.priority });
    }
  } catch {}

  const envFallbacks: Record<string, string> = {
    yt_api: process.env.RAPIDAPI_YT_API_KEY || "",
    yt_media_dl: process.env.RAPIDAPI_YT_MEDIA_KEY || "",
    ytstream: process.env.RAPIDAPI_YTSTREAM_KEY || "",
  };
  const existing = new Set(keys.map((k) => k.service));
  for (const [service, key] of Object.entries(envFallbacks)) {
    if (key && !existing.has(service)) {
      keys.push({ id: null, service, key, priority: 99 });
    }
  }

  _keyCache = keys;
  _keyCacheAt = now;
  return keys;
}

async function bumpCount(id: number | null) {
  if (!id) return;
  try {
    await prisma.ytApiKey.update({ where: { id }, data: { req_count: { increment: 1 } } });
  } catch {}
}

function fmtSize(size: unknown): string {
  let n = Number(size);
  if (!n || n <= 0) return "Unknown";
  for (const unit of ["B", "KB", "MB", "GB"]) {
    if (n < 1024) return `${n.toFixed(1)} ${unit}`;
    n /= 1024;
  }
  return `${n.toFixed(1)} TB`;
}

function heightKey(label: string): number {
  try { return parseInt(label.toLowerCase().replace("p", "").split(" ")[0]); } catch { return 0; }
}

function parseYtApiFormats(data: Record<string, unknown>): FormatItem[] {
  const formats: FormatItem[] = [];
  const seen = new Set<string>();
  for (const f of (data.formats as Record<string, unknown>[] || [])) {
    const url = f.url as string;
    const label = f.qualityLabel as string;
    if (!url || !label || seen.has(label)) continue;
    seen.add(label);
    const mime = (f.mimeType as string) || "";
    formats.push({
      format_id: String(f.itag || label),
      label,
      ext: mime.includes("mp4") ? "mp4" : "webm",
      filesize: fmtSize(f.contentLength),
      url,
      has_audio: true,
    });
  }
  return formats.sort((a, b) => heightKey(b.label) - heightKey(a.label));
}

function parseYtMediaFormats(data: Record<string, unknown>): FormatItem[] {
  const formats: FormatItem[] = [];
  const seen = new Set<string>();
  const videos = data.videos as Record<string, unknown> || {};
  const items = (Array.isArray(videos) ? [] : (videos.items as Record<string, unknown>[] || []));
  for (const item of items) {
    const url = item.url as string;
    if (!url || !item.hasAudio) continue;
    const quality = (item.quality as string) || "";
    let label = "";
    if (quality.includes("x")) {
      try { label = `${parseInt(quality.split("x")[1])}p`; } catch { label = quality; }
    } else if (quality) {
      label = quality.includes("p") ? quality : `${quality}p`;
    } else continue;
    if (seen.has(label)) continue;
    seen.add(label);
    formats.push({
      format_id: label,
      label,
      ext: (item.extension as string) || "mp4",
      filesize: fmtSize(item.size),
      url,
      has_audio: true,
    });
  }
  return formats.sort((a, b) => heightKey(b.label) - heightKey(a.label));
}

export interface FormatItem {
  format_id: string;
  label: string;
  ext: string;
  filesize: string;
  url: string;
  has_audio: boolean;
}

export interface VideoInfo {
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
  view_count: number;
  formats: FormatItem[];
}

export interface PlaylistInfo {
  type: "playlist";
  title: string;
  channel: string;
  thumbnail: string | null;
  video_count: number;
  videos: PlaylistVideo[];
}

export interface PlaylistVideo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: number;
}

async function ytApiVideo(id: string, key: string): Promise<VideoInfo | null> {
  const r = await fetch(`https://yt-api.p.rapidapi.com/dl?id=${id}`, {
    headers: { "x-rapidapi-key": key, "x-rapidapi-host": "yt-api.p.rapidapi.com" },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) return null;
  const d = await r.json();
  if (d.status !== "OK") return null;
  const formats = parseYtApiFormats(d);
  if (!formats.length) return null;
  const thumbs = d.thumbnail || [];
  const thumb = thumbs[0]?.url || `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  return { title: d.title || "Unknown", channel: d.channel || "Unknown", thumbnail: thumb, duration: parseInt(d.lengthSeconds) || 0, view_count: parseInt(d.viewCount) || 0, formats };
}

async function ytApiPlaylist(id: string, key: string): Promise<PlaylistInfo | null> {
  const r = await fetch(`https://yt-api.p.rapidapi.com/playlist?id=${id}`, {
    headers: { "x-rapidapi-key": key, "x-rapidapi-host": "yt-api.p.rapidapi.com" },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) return null;
  const d = await r.json();
  if (d.status !== "OK") return null;
  const videos: PlaylistVideo[] = (d.data || []).slice(0, 50).map((v: Record<string, unknown>) => {
    const thumbs = (v.thumbnail as Record<string, unknown>[]) || [];
    return { id: v.id as string, title: (v.title as string) || "Unknown", url: `https://www.youtube.com/watch?v=${v.id}`, thumbnail: thumbs[0]?.url as string || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`, duration: parseInt(v.lengthSeconds as string) || 0 };
  });
  const thumbs = d.thumbnail || [];
  const thumb = thumbs[0]?.url || (videos[0] ? `https://img.youtube.com/vi/${videos[0].id}/hqdefault.jpg` : null);
  return { type: "playlist", title: d.title || "Playlist", channel: d.channel || "Unknown", thumbnail: thumb, video_count: parseInt(d.videoCount) || videos.length, videos };
}

async function ytStreamVideo(id: string, key: string): Promise<VideoInfo | null> {
  const r = await fetch(`https://ytstream-download-youtube-videos.p.rapidapi.com/dl?id=${id}`, {
    headers: { "x-rapidapi-key": key, "x-rapidapi-host": "ytstream-download-youtube-videos.p.rapidapi.com" },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) return null;
  const d = await r.json();
  if (d.status !== "OK") return null;
  const formats = parseYtApiFormats(d);
  if (!formats.length) return null;
  const thumbs = d.thumbnail || [];
  const thumb = thumbs[0]?.url || `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  return { title: d.title || "Unknown", channel: d.channel || "Unknown", thumbnail: thumb, duration: parseInt(d.lengthSeconds) || 0, view_count: parseInt(d.viewCount) || 0, formats };
}

async function ytMediaVideo(id: string, key: string): Promise<VideoInfo | null> {
  const r = await fetch(`https://youtube-media-downloader.p.rapidapi.com/v2/video/details?videoId=${id}`, {
    headers: { "x-rapidapi-key": key, "x-rapidapi-host": "youtube-media-downloader.p.rapidapi.com" },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) return null;
  const d = await r.json();
  if (!d.status) return null;
  const formats = parseYtMediaFormats(d);
  if (!formats.length) return null;
  const thumbs = d.thumbnails || [];
  const thumb = thumbs[0]?.url || `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  return { title: d.title || "Unknown", channel: d.channel || "Unknown", thumbnail: thumb, duration: parseInt(d.duration) || 0, view_count: parseInt(d.viewCount) || 0, formats };
}

async function ytMediaPlaylist(id: string, key: string): Promise<PlaylistInfo | null> {
  const r = await fetch(`https://youtube-media-downloader.p.rapidapi.com/v2/playlist/details?playlistId=${id}`, {
    headers: { "x-rapidapi-key": key, "x-rapidapi-host": "youtube-media-downloader.p.rapidapi.com" },
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) return null;
  const d = await r.json();
  if (!d.status) return null;
  const videosData = d.videos || {};
  const items: Record<string, unknown>[] = videosData.items || [];
  const videos: PlaylistVideo[] = items.slice(0, 50).map((v) => {
    const thumbs = (v.thumbnails as Record<string, unknown>[]) || [];
    return { id: v.id as string, title: (v.title as string) || "Unknown", url: `https://www.youtube.com/watch?v=${v.id}`, thumbnail: thumbs[0]?.url as string || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`, duration: parseInt(v.duration as string) || 0 };
  });
  const thumbs = d.thumbnails || [];
  const thumb = thumbs[0]?.url || null;
  return { type: "playlist", title: d.title || "Playlist", channel: d.channel || "Unknown", thumbnail: thumb, video_count: parseInt(d.videoCount) || videos.length, videos };
}

const VIDEO_FNS: Record<string, (id: string, key: string) => Promise<VideoInfo | null>> = {
  yt_api: ytApiVideo,
  ytstream: ytStreamVideo,
  yt_media_dl: ytMediaVideo,
};

const PLAYLIST_FNS: Record<string, (id: string, key: string) => Promise<PlaylistInfo | null>> = {
  yt_api: ytApiPlaylist,
  yt_media_dl: ytMediaPlaylist,
};

export async function fetchVideoInfo(videoId: string): Promise<VideoInfo | null> {
  for (const rec of await getKeys()) {
    const fn = VIDEO_FNS[rec.service];
    if (!fn) continue;
    try {
      const result = await fn(videoId, rec.key);
      if (result) { bumpCount(rec.id); return result; }
    } catch (e) {
      console.log(`[rapidapi] ${rec.service} failed: ${e}`);
    }
  }
  return null;
}

export async function fetchPlaylistInfo(playlistId: string): Promise<PlaylistInfo | null> {
  for (const rec of await getKeys()) {
    const fn = PLAYLIST_FNS[rec.service];
    if (!fn) continue;
    try {
      const result = await fn(playlistId, rec.key);
      if (result) { bumpCount(rec.id); return result; }
    } catch (e) {
      console.log(`[rapidapi] ${rec.service} playlist failed: ${e}`);
    }
  }
  return null;
}
