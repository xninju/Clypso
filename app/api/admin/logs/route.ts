import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_PIN = process.env.ADMIN_PIN || "admin123";

function auth(req: NextRequest) {
  return req.headers.get("x-admin-pin") === ADMIN_PIN;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cursor = req.nextUrl.searchParams.get("cursor");
  const LIMIT = 50;

  const logs = await prisma.downloadLog.findMany({
    orderBy: { created_at: "desc" },
    take: LIMIT + 1,
    ...(cursor ? { where: { id: { lt: Number(cursor) } } } : {}),
  });

  const hasMore = logs.length > LIMIT;
  if (hasMore) logs.pop();

  return NextResponse.json({
    logs,
    nextCursor: hasMore ? logs[logs.length - 1].id : null,
  });
}
