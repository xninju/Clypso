import { NextRequest } from "next/server";

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const title = (searchParams.get("title") || "video").replace(/[^a-zA-Z0-9 ._-]/g, "_").slice(0, 100);
  const ext = searchParams.get("ext") || "mp4";

  if (!url) return new Response("Missing url", { status: 400 });

  const ytUserAgent = "com.google.android.youtube/17.36.4 (Linux; U; Android 12; GB) gzip";

  try {
    const r = await fetch(decodeURIComponent(url), {
      headers: { "User-Agent": ytUserAgent },
      signal: AbortSignal.timeout(90000),
    });

    if (!r.ok || !r.body) return new Response("Upstream failed", { status: 502 });

    return new Response(r.body, {
      status: 200,
      headers: {
        "Content-Type": r.headers.get("content-type") || "video/mp4",
        "Content-Disposition": `attachment; filename="${title}.${ext}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Download proxy error", { status: 502 });
  }
}
