import { NextResponse } from "next/server";
import { fetchVideoInfo, fetchPlaylistInfo } from "@/lib/rapidapi";
import { extractVideoId, extractPlaylistId, fetchInvidiousVideo, fetchInvidiousPlaylist, parseInvidiousFormats } from "@/lib/invidious";

function isPlaylist(url: string) {
  return url.includes("list=") && !url.includes("watch?v=");
}

function isShort(url: string) {
  return url.includes("/shorts/");
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });
    const trimmed = url.trim();

    if (isPlaylist(trimmed)) {
      const playlistId = extractPlaylistId(trimmed);

      if (playlistId) {
        const data = await fetchPlaylistInfo(playlistId);
        if (data) return NextResponse.json(data);
      }

      if (playlistId) {
        const data = await fetchInvidiousPlaylist(playlistId) as Record<string, unknown> | null;
        if (data) {
          const videos = ((data.videos as Record<string, unknown>[]) || []).slice(0, 50).map((v) => {
            const vid_id = v.videoId as string;
            return {
              id: vid_id,
              title: (v.title as string) || "Unknown",
              url: `https://www.youtube.com/watch?v=${vid_id}`,
              thumbnail: `https://img.youtube.com/vi/${vid_id}/hqdefault.jpg`,
              duration: v.lengthSeconds,
            };
          });
          return NextResponse.json({
            type: "playlist",
            title: (data.title as string) || "Playlist",
            channel: (data.author as string) || "Unknown",
            thumbnail: (data.playlistThumbnail as string) || (videos[0] ? `https://img.youtube.com/vi/${videos[0].id}/hqdefault.jpg` : null),
            video_count: (data.videoCount as number) || videos.length,
            videos,
          });
        }
      }

      return NextResponse.json({ error: "Could not fetch playlist info" }, { status: 400 });
    }

    const videoId = extractVideoId(trimmed);
    const contentType = isShort(trimmed) ? "short" : "video";

    if (videoId) {
      const data = await fetchVideoInfo(videoId);
      if (data) {
        return NextResponse.json({
          type: contentType,
          title: data.title,
          channel: data.channel,
          thumbnail: data.thumbnail,
          duration: data.duration,
          view_count: data.view_count,
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
            type: contentType,
            title: (data.title as string) || "Unknown",
            channel: (data.author as string) || "Unknown",
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            duration: data.lengthSeconds,
            view_count: data.viewCount,
            formats,
          });
        }
      }
    }

    return NextResponse.json({ error: "Could not fetch video info" }, { status: 500 });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
