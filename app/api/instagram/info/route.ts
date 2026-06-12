import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface KeyRecord {
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
    const rows = await prisma.apiKey.findMany({
      where: { enabled: true, service: { startsWith: "ig" } },
      orderBy: [{ priority: "asc" }],
    });
    for (const r of rows) keys.push({ service: r.service, key: r.key });
  } catch {}

  const envKey = process.env.RAPIDAPI_IG_KEY || "";
  if (envKey && !keys.find((k) => k.service === "ig_downloader")) {
    keys.push({ service: "ig_downloader", key: envKey });
  }

  _keyCache = keys;
  _keyCacheAt = now;
  return keys;
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

async function tryIgDownloaderV3(url: string, key: string) {
  const r = await fetch(
    `https://instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com/get-info-rapidapi?url=${encodeURIComponent(url)}`,
    {
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host":
          "instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com",
      },
      signal: AbortSignal.timeout(15000),
    }
  );
  if (!r.ok) return null;
  return r.json();
}

async function tryIgSocialDownloader(url: string, key: string) {
  const r = await fetch(
    `https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=${encodeURIComponent(url)}`,
    {
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "social-media-video-downloader.p.rapidapi.com",
      },
      signal: AbortSignal.timeout(15000),
    }
  );
  if (!r.ok) return null;
  return r.json();
}

function parseIgResult(data: Record<string, unknown>, postType: string) {
  const items: unknown[] = [];
  const medias = (data.medias || data.media || data.links || []) as Record<string, unknown>[];

  if (Array.isArray(medias) && medias.length) {
    for (const m of medias) {
      const url = (m.url || m.link || m.src) as string;
      if (!url) continue;
      const isVideo =
        postType === "reel" ||
        String(m.type || "").toLowerCase().includes("video") ||
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
    return items;
  }

  const videoUrl = (data.video_url || data.videoUrl || data.url) as string;
  const imageUrl = (data.image_url || data.imageUrl || data.thumbnail) as string;

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
      return NextResponse.json(
        {
          detail: "NO_API_KEY",
        },
        { status: 503 }
      );
    }

    for (const rec of keys) {
      try {
        let result: Record<string, unknown> | null = null;

        if (rec.service === "ig_downloader" || rec.service === "ig_v3") {
          result = await tryIgDownloaderV3(trimmed, rec.key);
        } else if (rec.service === "ig_snapsave" || rec.service === "ig_social") {
          result = await tryIgSocialDownloader(trimmed, rec.key);
        }

        if (!result) continue;

        const items = parseIgResult(result, postType);
        if (items.length) {
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
