import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function verifyPin(req: Request): boolean {
  const pin = req.headers.get("x-admin-pin");
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin || !pin) return false;
  return pin === adminPin;
}

export async function GET(req: Request) {
  if (!verifyPin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [stats, logs, ytKeys, igKeys, fbKeys, ttKeys] = await Promise.all([
      prisma.stats.findUnique({ where: { id: 1 } }),
      prisma.downloadLog.findMany({ orderBy: { created_at: "desc" }, take: 50 }),
      prisma.ytApiKey.findMany({ orderBy: [{ priority: "asc" }, { id: "asc" }] }),
      prisma.igApiKey.findMany({ orderBy: [{ priority: "asc" }, { id: "asc" }] }),
      prisma.fbApiKey.findMany({ orderBy: [{ priority: "asc" }, { id: "asc" }] }),
      prisma.ttApiKey.findMany({ orderBy: [{ priority: "asc" }, { id: "asc" }] }),
    ]);

    const keys = [
      ...ytKeys.map((k) => ({ ...k, platform: "yt" as const })),
      ...igKeys.map((k) => ({ ...k, platform: "ig" as const })),
      ...fbKeys.map((k) => ({ ...k, platform: "fb" as const })),
      ...ttKeys.map((k) => ({ ...k, platform: "tt" as const })),
    ];

    return NextResponse.json({ stats, logs, keys });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
