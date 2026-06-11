import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { platform, url, media_type } = body;

    await prisma.downloadLog.create({
      data: { platform, url, media_type },
    });

    // Also increment the download counter
    const updateData: Record<string, unknown> =
      platform === "youtube"
        ? { yt_downloads: { increment: 1 } }
        : { ig_downloads: { increment: 1 } };

    await prisma.stats.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        total_visits: 0,
        yt_downloads: platform === "youtube" ? 1 : 0,
        ig_downloads: platform === "instagram" ? 1 : 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to log download" }, { status: 500 });
  }
}
