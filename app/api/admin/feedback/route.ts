import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_PIN = process.env.ADMIN_PIN || "admin123";

function auth(req: NextRequest) {
  return req.headers.get("x-admin-pin") === ADMIN_PIN;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const feedbacks = await prisma.feedback.findMany({
    orderBy: { created_at: "desc" },
    take: 100,
  });

  return NextResponse.json({ feedbacks });
}

export async function DELETE(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.feedback.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
