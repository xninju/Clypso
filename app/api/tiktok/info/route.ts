import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface KeyRecord {
  id: number | null;
  service: string;
  key: string;
}

let _keyCache: KeyRecord[] = [];
let _keyCacheAt = 0;
const KEY_TTL = 60_000;

async function getTtKeys(): Promise<KeyRecord[]> {
  const now = Date.now();
  if (now - _keyCacheAt < KEY_TTL && _keyCache.length > 0) return _keyCache;

  const keys: KeyRecord[] = [];
  try {
    const rows = await prisma.ttApiKey.findMany({
      where: { enabled: true },
      orderBy: [{ priority: "asc" }, { id: "asc" }],
    });
    for (const r of rows) keys.push({ id: r.id, service: r.service, key: r.key });
  } catch {}

  _keyCache = keys;
  _keyCacheAt = now;
  return keys;
}

async function bumpCount(id: number | null) {
  if (!id) return;
  try {
    await prisma.ttApiKey.update({ where: { id }, data: { req_count: { increment: 1 } } });
  } catch {}
}

async function try7scorp(url: string, key: string): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch(
      `https://tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com/index?url=${encodeURIComponent(url)}`,
      {
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host": "tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com",
        },
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!r.ok) return null;
    const d = await r.json();
    if (!d || typeof d !== "object") return null;
    return d as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function tryThucngv(url: string, key: string): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch(
      `https://tiktok-video-downloader.p.rapidapi.com/media?url=${encodeURIComponent(url)}`,
      {
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host": "tiktok-video-downloader.p.rapidapi.com",
        },
        signal: AbortSignal.timeout(15000),
      }
    );
    if (!r.ok) return null;
    const d = await r.json();
    if (!d || typeof d !== "object") return null;
    return d as Record<string, unknown>;
  } catch {
    return null;
  }
}

interface TtResult {
  title: string;
  thumbnail: string;
  author: string;
  items: { url: string; quality: string; ext: string; filesize: string; type: "video" | "audio" }[];
}

function parse7scorp(data: Record<string, unknown>): TtResult | null {
  const play = (data.play as string) || (data.nowm as string) || (data.nwm as string);
  if (!play) return null;
  const items: TtResult["items"] = [{ url: play, quality: "No Watermark", ext: "mp4", filesize: "Unknown", type: "video" }];
  const music = (data.music as string) || (data.music_url as string);
  if (music) items.push({ url: music, quality: "Audio", ext: "mp3", filesize: "Unknown", type: "audio" });
  return {
    title: (data.title as string) || (data.desc as string) || "TikTok Video",
    thumbnail: (data.cover as string) || (data.dynamic_cover as string) || "",
    author: (data.author as string) || "",
    items,
  };
}

function parseThucngv(data: Record<string, unknown>): TtResult | null {
  const play = (data.play as string) || (data.video as string);
  if (!play) return null;
  const items: TtResult["items"] = [{ url: play, quality: "No Watermark", ext: "mp4", filesize: "Unknown", type: "video" }];
  const music = (data.music as string) || (data.audio as string);
  if (music) items.push({ url: music, quality: "Audio", ext: "mp3", filesize: "Unknown", type: "audio" });
  return {
    title: (data.title as string) || (data.desc as string) || "TikTok Video",
    thumbnail: (data.cover as string) || (data.thumbnail as string) || "",
    author: (data.author as string) || "",
    items,
  };
}

const SERVICE_HANDLERS: Record<
  string,
  {
    fetch: (url: string, key: string) => Promise<Record<string, unknown> | null>;
    parse: (data: Record<string, unknown>) => TtResult | null;
  }
> = {
  tt_7scorp:  { fetch: try7scorp,   parse: parse7scorp  },
  tt_thucngv: { fetch: tryThucngv,  parse: parseThucngv },
};

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ detail: "Missing URL" }, { status: 400 });
    }
    if (!url.includes("tiktok.com") && !url.includes("vm.tiktok")) {
      return NextResponse.json({ detail: "Not a TikTok URL" }, { status: 400 });
    }

    const keys = await getTtKeys();
    if (keys.length === 0) {
      return NextResponse.json({ detail: "NO_API_KEY" }, { status: 503 });
    }

    for (const k of keys) {
      const handler = SERVICE_HANDLERS[k.service];
      if (!handler) continue;

      const raw = await handler.fetch(url, k.key);
      if (!raw) continue;

      const parsed = handler.parse(raw);
      if (!parsed || parsed.items.length === 0) continue;

      bumpCount(k.id);

      return NextResponse.json(parsed);
    }

    return NextResponse.json(
      { detail: "Could not fetch this TikTok video. Make sure the link is valid." },
      { status: 422 }
    );
  } catch (e: unknown) {
    return NextResponse.json({ detail: String(e) }, { status: 500 });
  }
}
