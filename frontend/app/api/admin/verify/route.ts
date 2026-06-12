import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();
    const adminPin = process.env.ADMIN_PIN;

    if (!adminPin) {
      return NextResponse.json(
        { error: "ADMIN_PIN environment variable is not configured." },
        { status: 503 }
      );
    }

    if (!pin || pin !== adminPin) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
}
