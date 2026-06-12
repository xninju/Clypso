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
    const [stats, logs, keys] = await Promise.all([
      prisma.stats.findUnique({ where: { id: 1 } }),
      prisma.downloadLog.findMany({
        orderBy: { created_at: "desc" },
        take: 50,
      }),
      prisma.apiKey.findMany({
        orderBy: [{ priority: "asc" }, { id: "asc" }],
      }),
    ]);

    return NextResponse.json({ stats, logs, keys });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
