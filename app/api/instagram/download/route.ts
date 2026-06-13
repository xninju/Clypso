import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const filename = searchParams.get("filename") || "instagram_video.mp4";

  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    const r = await fetch(decodeURIComponent(url), {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Referer: "https://www.instagram.com/",
        Accept: "*/*",
      },
      signal: AbortSignal.timeout(60000),
    });

    if (!r.ok) return NextResponse.json({ error: "Failed to fetch media" }, { status: 502 });

    const ct = r.headers.get("content-type") || "video/mp4";
    const buf = await r.arrayBuffer();

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buf.byteLength.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Download proxy error" }, { status: 502 });
  }
}
