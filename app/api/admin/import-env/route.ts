import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function verifyPin(req: Request): boolean {
  const pin = req.headers.get("x-admin-pin");
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin || !pin) return false;
  return pin === adminPin;
}

const ENV_MAP: Array<{ envVar: string; service: string; label: string; priority: number }> = [
  { envVar: "RAPIDAPI_YT_API_KEY",    service: "yt_api",        label: "YouTube API (env)",          priority: 1 },
  { envVar: "RAPIDAPI_YT_MEDIA_KEY",  service: "yt_media_dl",   label: "YouTube Media DL (env)",     priority: 2 },
  { envVar: "RAPIDAPI_YTSTREAM_KEY",  service: "ytstream",      label: "YTStream (env)",             priority: 3 },
  { envVar: "RAPIDAPI_IG_KEY",        service: "ig_downloader", label: "Instagram Downloader (env)", priority: 1 },
];

export async function POST(req: Request) {
  if (!verifyPin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.apiKey.findMany({ select: { service: true } });
    const existingServices = new Set(existing.map((r) => r.service));

    const imported: string[] = [];
    const skipped: string[] = [];
    const missing: string[] = [];

    for (const { envVar, service, label, priority } of ENV_MAP) {
      const key = process.env[envVar];
      if (!key) {
        missing.push(service);
        continue;
      }
      if (existingServices.has(service)) {
        skipped.push(service);
        continue;
      }
      await prisma.apiKey.create({
        data: { service, label, key, priority, enabled: true },
      });
      imported.push(service);
    }

    return NextResponse.json({ imported, skipped, missing });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
