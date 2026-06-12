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

async function getIgKeys(): Promise<KeyRecord[]> {
  const now = Date.now();
  if (now - _keyCacheAt < KEY_TTL && _keyCache.length > 0) return _keyCache;

  const keys: KeyRecord[] = [];
  try {
    const rows = await prisma.igApiKey.findMany({
      where: { enabled: true },
      orderBy: [{ priority: "asc" }, { id: "asc" }],
    });
    for (const r of rows) keys.push({ id: r.id, service: r.service, key: r.key });
  } catch {}

  // env var fallback — maps to diyorbek as default
  const envKey = process.env.RAPIDAPI_IG_KEY || "";
  if (envKey && !keys.find((k) => k.service === "ig_diyorbek")) {
    keys.push({ id: null, service: "ig_diyorbek", key: envKey });
  }

  _keyCache = keys;
  _keyCacheAt = now;
  return keys;
}

async function bumpCount(id: number | null) {
  if (!id) return;
  try {
    await prisma.igApiKey.update({ where: { id }, data: { req_count: { increment: 1 } } });
  } catch {}
}

function getPostType(url: string): string {
  if (url.includes("/reel/") || url.includes("/reels/")) return "reel";
  if (url.includes("/stories/")) return "story";
  return "post";
}

function extractShortcode(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
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

// ─── API 1: diyorbekkanal ─────────────────────────────────────────────────────
// GET https://instagram-post-reels-stories-downloader-api.p.rapidapi.com/instagram/?url=...
// Response shape: { result: [ { url, thumbnail, type } ] } or { result: { url, thumbnail } }

async function tryDiyorbek(url: string, key: string): Promise<Record<string, unknown> | null> {
  const r = await fetch(
    `https://instagram-post-reels-stories-downloader-api.p.rapidapi.com/instagram/?url=${encodeURIComponent(url)}`,
    {
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "instagram-post-reels-stories-downloader-api.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    }
  );
  if (!r.ok) return null;
  const data = await r.json();
  // must have some result
  if (!data || (Array.isArray(data.result) && data.result.length === 0)) return null;
  if (data.result === null || data.result === undefined) return null;
  return data;
}

// ─── API 2: safesite15 ────────────────────────────────────────────────────────
// GET https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert?url=...
// Response shape: { media: [ { url, thumbnail, type, quality } ] } or { url, thumbnail }

async function trySafesite(url: string, key: string): Promise<Record<string, unknown> | null> {
  const r = await fetch(
    `https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert?url=${encodeURIComponent(url)}`,
    {
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    }
  );
  if (!r.ok) return null;
  const data = await r.json();
  if (!data) return null;
  // reject empty responses
  if (Array.isArray(data.media) && data.media.length === 0) return null;
  if (!data.media && !data.url && !data.video_url) return null;
  return data;
}

// ─── Parse diyorbek response ──────────────────────────────────────────────────

function parseDiyorbek(data: Record<string, unknown>, postType: string) {
  const items: unknown[] = [];

  // result can be array or object
  const result = data.result;
  const arr: Record<string, unknown>[] = Array.isArray(result)
    ? result
    : result && typeof result === "object"
    ? [result as Record<string, unknown>]
    : [];

  for (const item of arr) {
    const url = (item.url || item.video_url || item.image_url) as string;
    if (!url) continue;
    const type = (item.type as string) || "";
    const isVideo =
      postType === "reel" ||
      type.toLowerCase().includes("video") ||
      url.includes(".mp4");
    items.push({
      media_type: isVideo ? "video" : "image",
      url,
      thumbnail: (item.thumbnail || item.thumb || url) as string,
      quality: (item.quality || item.resolution || "Original") as string,
      ext: isVideo ? "mp4" : "jpg",
      filesize: fmtSize(item.size),
    });
  }

  return items;
}

// ─── Parse safesite response ──────────────────────────────────────────────────

function parseSafesite(data: Record<string, unknown>, postType: string) {
  const items: unknown[] = [];

  // safesite returns { media: [...] } or flat { url, thumbnail }
  const mediaArr = Array.isArray(data.media)
    ? (data.media as Record<string, unknown>[])
    : [];

  if (mediaArr.length) {
    for (const m of mediaArr) {
      const url = (m.url || m.link) as string;
      if (!url) continue;
      const type = (m.type as string) || "";
      const isVideo =
        postType === "reel" ||
        type.toLowerCase().includes("video") ||
        url.includes(".mp4");
      items.push({
        media_type: isVideo ? "video" : "image",
        url,
        thumbnail: (m.thumbnail || m.thumb || data.thumbnail || url) as string,
        quality: (m.quality || m.resolution || "Original") as string,
        ext: isVideo ? "mp4" : "jpg",
        filesize: fmtSize(m.size),
      });
    }
    if (items.length) return items;
  }

  // flat response fallback
  const videoUrl = (data.video_url || data.url) as string;
  const imageUrl = (data.image_url || data.thumbnail) as string;

  if (videoUrl) {
    items.push({
      media_type: "video",
      url: videoUrl,
      thumbnail: (data.thumbnail || imageUrl || videoUrl) as string,
      quality: "HD",
      ext: "mp4",
      filesize: "Unknown",
    });
  } else if (imageUrl) {
    items.push({
      media_type: "image",
      url: imageUrl,
      thumbnail: imageUrl,
      quality: "Original",
      ext: "jpg",
      filesize: "Unknown",
    });
  }

  return items;
}

// ─── Service map ──────────────────────────────────────────────────────────────

const SERVICE_HANDLERS: Record<
  string,
  {
    fetch: (url: string, key: string) => Promise<Record<string, unknown> | null>;
    parse: (data: Record<string, unknown>, postType: string) => unknown[];
  }
> = {
  ig_diyorbek: { fetch: tryDiyorbek, parse: parseDiyorbek },
  ig_safesite:  { fetch: trySafesite,  parse: parseSafesite  },
};

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ detail: "URL is required" }, { status: 400 });
    const trimmed = url.trim();
    const postType = getPostType(trimmed);
    const shortcode = extractShortcode(trimmed);

    if (!shortcode) {
      return NextResponse.json({ detail: "Could not parse Instagram URL." }, { status: 400 });
    }

    const keys = await getIgKeys();
    if (keys.length === 0) {
      return NextResponse.json({ detail: "NO_API_KEY" }, { status: 503 });
    }

    for (const rec of keys) {
      const handler = SERVICE_HANDLERS[rec.service];
      if (!handler) continue;
      try {
        const result = await handler.fetch(trimmed, rec.key);
        if (!result) continue;

        const items = handler.parse(result, postType);
        if (items.length) {
          bumpCount(rec.id);
          const isCarousel = items.length > 1;
          const firstItem = items[0] as Record<string, unknown>;
          return NextResponse.json({
            type: isCarousel ? "carousel" : "single",
            post_type: postType,
            title: (result.title as string) || (result.caption as string) || "Instagram Post",
            thumbnail: (firstItem?.thumbnail as string) || null,
            item_count: items.length,
            items,
          });
        }
      } catch (e) {
        console.log(`[instagram] ${rec.service} failed: ${e}`);
      }
    }

    return NextResponse.json(
      { detail: "Could not fetch Instagram content. The post may be private or unavailable." },
      { status: 400 }
    );
  } catch (e: unknown) {
    return NextResponse.json({ detail: String(e) }, { status: 500 });
  }
}