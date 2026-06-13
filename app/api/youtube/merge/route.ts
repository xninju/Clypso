import { NextRequest } from "next/server";
import { spawn } from "child_process";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get("videoUrl");
  const audioUrl = searchParams.get("audioUrl");
  const title = (searchParams.get("title") || "video").replace(/[^a-zA-Z0-9 ._-]/g, "_").slice(0, 100);
  const ext = searchParams.get("ext") || "mp4";

  if (!videoUrl || !audioUrl) {
    return new Response("Missing videoUrl or audioUrl", { status: 400 });
  }

  const filename = `${title}.mp4`;
  const isWebm = ext === "webm";

  // YouTube CDN requires a YouTube-compatible User-Agent (same client that signed the URL)
  const ytUserAgent = "com.google.android.youtube/17.36.4 (Linux; U; Android 12; GB) gzip";
  const headerArg = `User-Agent: ${ytUserAgent}`;

  // For webm (VP9) video: copy video, re-encode audio to opus (required for webm container)
  // For mp4 (H.264) video: copy both streams directly — instant, no re-encoding
  const ffmpegArgs = isWebm
    ? ["-headers", headerArg, "-i", videoUrl,
       "-headers", headerArg, "-i", audioUrl,
       "-c:v", "copy", "-c:a", "libopus", "-b:a", "128k",
       "-movflags", "frag_keyframe+empty_moov", "-f", "webm", "pipe:1"]
    : ["-headers", headerArg, "-i", videoUrl,
       "-headers", headerArg, "-i", audioUrl,
       "-c:v", "copy", "-c:a", "copy",
       "-movflags", "frag_keyframe+empty_moov+default_base_moof", "-f", "mp4", "pipe:1"];

  const outputMime = isWebm ? "video/webm" : "video/mp4";
  const outputExt = isWebm ? "webm" : "mp4";
  const outputFilename = `${title}.${outputExt}`;

  const ffmpeg = spawn("ffmpeg", ffmpegArgs, { stdio: ["ignore", "pipe", "pipe"] });

  ffmpeg.stderr.on("data", (d: Buffer) => {
    const line = d.toString();
    if (line.includes("frame=") || line.includes("size=") || line.includes("time=")) return;
    console.log("[ffmpeg merge]", line.trim().split("\n")[0]);
  });

  const readable = new ReadableStream({
    start(controller) {
      ffmpeg.stdout.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      ffmpeg.stdout.on("end", () => {
        controller.close();
      });
      ffmpeg.on("error", (err: Error) => {
        console.error("[ffmpeg merge error]", err);
        controller.error(err);
      });
      ffmpeg.on("close", (code: number) => {
        if (code !== 0) console.warn("[ffmpeg merge] exited with code", code);
      });
    },
    cancel() {
      ffmpeg.kill("SIGTERM");
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": outputMime,
      "Content-Disposition": `attachment; filename="${outputFilename}"`,
      "Cache-Control": "no-store",
    },
  });
}
