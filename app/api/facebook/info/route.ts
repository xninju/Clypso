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

async function getFbKeys(): Promise<KeyRecord[]> {
  const now = Date.now();
  if (now - _keyCacheAt < KEY_TTL && _keyCache.length > 0) return _keyCache;

  const keys: KeyRecord[] = [];
  try {
    const rows = await prisma.fbApiKey.findMany({
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
    await prisma.fbApiKey.update({ where: { id }, data: { req_count: { increment: 1 } } });
  } catch {}
}

async function tryBravedownz(url: string, key: string): Promise<Record<string, unknown> | null> {
  try {
    const r = await fetch(
      `https://facebook-story-saver-and-video-downloader.p.rapidapi.com/?url=${encodeURIComponent(url)}`,
      {
        headers: {
          "x-rapidapi-key": key,
          "x-rapidapi-host": "facebook-story-saver-and-video-downloader.p.rapidapi.com",
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

function parseBravedownz(data: Record<string, unknown>): { title: string; thumbnail: string; items: unknown[] } | null {
  const title = (data.title as string) || (data.name as string) || "Facebook Video";
  const thumbnail = (data.thumbnail as string) || (data.image as string) || "";

  const items: { url: string; quality: string; ext: string; filesize: string }[] = [];

  const links = data.links as Record<string, string> | undefined;
  if (links && typeof links === "object") {
    const hd = links["Download High Quality"] || links["HD"] || links["hd"];
    const sd = links["Download Low Quality"] || links["SD"] || links["sd"];
    if (hd) items.push({ url: hd, quality: "HD", ext: "mp4", filesize: "Unknown" });
    if (sd) items.push({ url: sd, quality: "SD", ext: "mp4", filesize: "Unknown" });
  }

  if (data.hd) items.push({ url: data.hd as string, quality: "HD", ext: "mp4", filesize: "Unknown" });
  if (data.sd && data.sd !== data.hd) items.push({ url: data.sd as string, quality: "SD", ext: "mp4", filesize: "Unknown" });

  if (items.length === 0) {
    const url = (data.url as string) || (data.video as string) || (data.download as string);
    if (url) items.push({ url, quality: "Best", ext: "mp4", filesize: "Unknown" });
  }

  if (items.length === 0) return null;
  return { title, thumbnail, items };
}

const SERVICE_HANDLERS: Record<
  string,
  {
    fetch: (url: string, key: string) => Promise<Record<string, unknown> | null>;
    parse: (data: Record<string, unknown>) => { title: string; thumbnail: string; items: unknown[] } | null;
  }
> = {
  fb_bravedownz: { fetch: tryBravedownz, parse: parseBravedownz },
};

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ detail: "Missing URL" }, { status: 400 });
    }
    if (!url.includes("facebook.com") && !url.includes("fb.com") && !url.includes("fb.watch")) {
      return NextResponse.json({ detail: "Not a Facebook URL" }, { status: 400 });
    }

    const keys = await getFbKeys();
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

      return NextResponse.json({
        title: parsed.title,
        thumbnail: parsed.thumbnail,
        items: parsed.items,
      });
    }

    return NextResponse.json(
      { detail: "Could not fetch this Facebook video. Make sure it is a public post." },
      { status: 422 }
    );
  } catch (e: unknown) {
    return NextResponse.json({ detail: String(e) }, { status: 500 });
  }
}
