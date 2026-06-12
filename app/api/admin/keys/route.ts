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
    const keys = await prisma.apiKey.findMany({
      orderBy: [{ priority: "asc" }, { id: "asc" }],
    });
    return NextResponse.json({ keys });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!verifyPin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { service, label, key, priority, enabled } = body;

    if (!service || !key) {
      return NextResponse.json({ error: "service and key are required" }, { status: 400 });
    }

    const created = await prisma.apiKey.create({
      data: {
        service,
        label: label || "",
        key,
        priority: priority ?? 1,
        enabled: enabled ?? true,
      },
    });
    return NextResponse.json({ key: created }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
