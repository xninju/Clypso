import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { name, email, rating, message } = await req.json();

    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!message?.trim()) return NextResponse.json({ error: "Message is required" }, { status: 400 });
    if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });

    const feedback = await prisma.feedback.create({
      data: {
        name: name.trim().slice(0, 100),
        email: (email || "").trim().slice(0, 200),
        rating: Number(rating),
        message: message.trim().slice(0, 2000),
      },
    });

    return NextResponse.json({ ok: true, id: feedback.id });
  } catch (e) {
    console.error("[feedback POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
