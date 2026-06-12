import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function verifyPin(req: Request): boolean {
  const pin = req.headers.get("x-admin-pin");
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin || !pin) return false;
  return pin === adminPin;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyPin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    const { service, label, key, priority, enabled } = await req.json();
    const updated = await prisma.ytApiKey.update({
      where: { id },
      data: {
        ...(service !== undefined && { service }),
        ...(label !== undefined && { label }),
        ...(key !== undefined && { key }),
        ...(priority !== undefined && { priority }),
        ...(enabled !== undefined && { enabled }),
      },
    });
    return NextResponse.json({ key: updated });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyPin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    await prisma.ytApiKey.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
