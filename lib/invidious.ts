const FALLBACK_INSTANCES = [
  "https://inv.thepixora.com",
  "https://invidious.incogniweb.net",
  "https://invidious.reallyaweso.me",
  "https://inv.makerlab.tech",
  "https://invidious.privacyredirect.com",
  "https://iv.datura.network",
  "https://invidious.fdn.fr",
];

const VIDEO_ID_RE = /(?:v=|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/;
const PLAYLIST_ID_RE = /[?&]list=([a-zA-Z0-9_-]+)/;

let _liveInstances: string[] = [];
let _instancesFetched = false;

async function refreshInstances(): Promise<void> {
  try {
    const r = await fetch("https://api.invidious.io/instances.json?sort_by=health", {
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const data = await r.json();
      const instances: string[] = [];
      for (const item of data) {
        const [name, info] = item;
        if (info.api && info.type === "https") instances.push(`https://${name}`);
      }
      if (instances.length) {
        _liveInstances = instances.slice(0, 10);
        _instancesFetched = true;
        return;
      }
    }
  } catch {}
  _liveInstances = FALLBACK_INSTANCES;
  _instancesFetched = true;
}

async function getInstances(): Promise<string[]> {
  if (!_instancesFetched) await refreshInstances();
  return _liveInstances.length ? _liveInstances : FALLBACK_INSTANCES;
}

export function extractVideoId(url: string): string | null {
  const m = VIDEO_ID_RE.exec(url);
  return m ? m[1] : null;
}

export function extractPlaylistId(url: string): string | null {
  const m = PLAYLIST_ID_RE.exec(url);
  return m ? m[1] : null;
}

async function invGet(path: string): Promise<Record<string, unknown> | null> {
  const instances = await getInstances();
  for (const instance of instances) {
    try {
      const r = await fetch(`${instance}${path}`, { signal: AbortSignal.timeout(10000) });
      if (r.ok) {
        const data = await r.json();
        if (data) return data;
      }
    } catch {}
  }
  return null;
}

export async function fetchInvidiousVideo(videoId: string) {
  return invGet(`/api/v1/videos/${videoId}`);
}

export async function fetchInvidiousPlaylist(playlistId: string) {
  return invGet(`/api/v1/playlists/${playlistId}`);
}

export interface FormatItem {
  format_id: string;
  label: string;
  ext: string;
  filesize: string;
  url: string;
  has_audio: boolean;
}

export function parseInvidiousFormats(data: Record<string, unknown>): FormatItem[] {
  const formats: FormatItem[] = [];
  const seen = new Set<string>();
  for (const f of (data.formatStreams as Record<string, unknown>[] || [])) {
    const res = (f.resolution as string) || "";
    const height = res.replace("p", "").trim();
    if (!height || isNaN(Number(height))) continue;
    const label = `${height}p`;
    if (seen.has(label)) continue;
    seen.add(label);
    const url = f.url as string;
    if (!url) continue;
    formats.push({ format_id: String(f.itag || height), label, ext: "mp4", filesize: "Unknown", url, has_audio: true });
  }
  return formats.sort((a, b) => parseInt(b.label) - parseInt(a.label));
}
