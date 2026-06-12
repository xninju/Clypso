import { NextResponse } from "next/server";
import { fetchVideoInfo } from "@/lib/rapidapi";
import { extractVideoId, fetchInvidiousVideo, parseInvidiousFormats } from "@/lib/invidious";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });
    const trimmed = url.trim();
    const videoId = extractVideoId(trimmed);

    if (videoId) {
      const data = await fetchVideoInfo(videoId);
      if (data) {
        return NextResponse.json({
          title: data.title,
          thumbnail: data.thumbnail,
          formats: data.formats,
        });
      }
    }

    if (videoId) {
      const data = await fetchInvidiousVideo(videoId) as Record<string, unknown> | null;
      if (data) {
        const formats = parseInvidiousFormats(data);
        if (formats.length) {
          return NextResponse.json({
            title: (data.title as string) || "Unknown",
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            formats,
          });
        }
      }
    }

    return NextResponse.json({ error: "Could not fetch video info" }, { status: 400 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
