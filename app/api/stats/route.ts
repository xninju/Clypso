import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/stats — fetch current stats
export async function GET() {
  try {
    const stats = await prisma.stats.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        total_visits: 0,
        yt_downloads: 0,
        ig_downloads: 0,
      },
    });
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

// POST /api/stats — increment a counter
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type } = body; // "visit" | "youtube" | "instagram"

    const updateData: Record<string, unknown> = {};
    if (type === "visit") updateData.total_visits = { increment: 1 };
    if (type === "youtube") updateData.yt_downloads = { increment: 1 };
    if (type === "instagram") updateData.ig_downloads = { increment: 1 };

    const stats = await prisma.stats.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        total_visits: type === "visit" ? 1 : 0,
        yt_downloads: type === "youtube" ? 1 : 0,
        ig_downloads: type === "instagram" ? 1 : 0,
      },
    });

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update stats" }, { status: 500 });
  }
}
