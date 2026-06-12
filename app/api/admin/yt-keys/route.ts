import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function verifyPin(req: Request): boolean {
  const pin = req.headers.get("x-admin-pin");
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin || !pin) return false;
  return pin === adminPin;
}

export async function GET(req: Request) {
  if (!verifyPin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const keys = await prisma.ytApiKey.findMany({ orderBy: [{ priority: "asc" }, { id: "asc" }] });
    return NextResponse.json({ keys });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!verifyPin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { service, label, key, priority, enabled } = await req.json();
    if (!service || !key) return NextResponse.json({ error: "service and key are required" }, { status: 400 });
    const created = await prisma.ytApiKey.create({
      data: { service, label: label || "", key, priority: priority ?? 1, enabled: enabled ?? true },
    });
    return NextResponse.json({ key: created }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
