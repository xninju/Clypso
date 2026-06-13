"use client";
import { useState } from "react";
import axios from "axios";
import {
  Download, Search, X, List, Film, Zap,
  ChevronDown, ChevronUp, Clock, Eye,
} from "lucide-react";
import { VideoInfoSkeleton } from "./Skeleton";

interface Format {
  format_id: string;
  label: string;
  ext: string;
  filesize: string;
  url: string;
  has_audio: boolean;
  has_video: boolean;
  audio_url?: string;
}

interface VideoInfo {
  type: "video" | "short" | "playlist";
  title: string;
  channel: string;
  thumbnail?: string;
  duration?: number;
  view_count?: number;
  formats?: Format[];
  video_count?: number;
  videos?: PlaylistVideo[];
}

interface PlaylistVideo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration?: number;
}

function formatDuration(s?: number) {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatViews(n?: number) {
  if (!n) return "";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M views";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K views";
  return n + " views";
}

function qualityScore(label: string): number {
  const m = label.match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function getBestFormat(formats: Format[]): Format | null {
  const combined = formats.filter((f) => f.has_video && f.has_audio);
  if (combined.length > 0) {
    return combined.sort((a, b) => qualityScore(b.label) - qualityScore(a.label))[0];
  }
  const videoWithAudio = formats.filter((f) => f.has_video && f.audio_url);
  if (videoWithAudio.length > 0) {
    return videoWithAudio.sort((a, b) => qualityScore(b.label) - qualityScore(a.label))[0];
  }
  const anyVideo = formats.filter((f) => f.has_video);
  if (anyVideo.length > 0) {
    return anyVideo.sort((a, b) => qualityScore(b.label) - qualityScore(a.label))[0];
  }
  return null;
}

function DownloadButton({
  formats,
  title,
  onDownload,
}: {
  formats: Format[];
  title: string;
  onDownload: (fmt: Format, title: string) => void;
}) {
  const best = getBestFormat(formats);
  if (!best) return null;

  return (
    <button
      onClick={() => onDownload(best, title)}
      className="w-full bg-[#ff0000] hover:bg-[#cc0000] text-white font-medium px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
    >
      <Download size={15} />
      Download {best.label} {best.ext.toUpperCase()}
      {best.filesize !== "Unknown" && (
        <span className="text-white/60 text-xs">· {best.filesize}</span>
      )}
    </button>
  );
}

export default function YoutubeDownloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [playlistExpanded, setPlaylistExpanded] = useState(false);
  const [loadingFormats, setLoadingFormats] = useState<string | null>(null);
  const [videoFormats, setVideoFormats] = useState<Record<string, Format[]>>({});
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setInfo(null);
    try {
      const res = await axios.post(`/api/youtube/info`, { url }, { timeout: 45000 });
      setInfo(res.data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string; error?: string } } };
      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Failed to fetch video info. Check the URL and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const logDownload = async (platform: string, dlUrl: string, media_type: string) => {
    try {
      await fetch("/api/log-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, url: dlUrl, media_type }),
      });
    } catch {}
  };

  const fetchVideoFormats = async (video: PlaylistVideo) => {
    if (videoFormats[video.id]) return;
    setLoadingFormats(video.id);
    try {
      const res = await axios.post(`/api/youtube/playlist-video`, { url: video.url }, { timeout: 45000 });
      setVideoFormats((prev) => ({ ...prev, [video.id]: res.data.formats }));
    } catch {}
    setLoadingFormats(null);
  };

  const handleDownload = (fmt: Format, title: string) => {
    logDownload("youtube", url, info?.type || "video");
    const safeTitle = title.replace(/[^a-zA-Z0-9 ._-]/g, "_").slice(0, 100);
    setDownloading(fmt.format_id);

    let href: string;
    if (fmt.has_video && fmt.audio_url) {
      href = `/api/youtube/merge?videoUrl=${encodeURIComponent(fmt.url)}&audioUrl=${encodeURIComponent(fmt.audio_url)}&title=${encodeURIComponent(safeTitle)}&ext=${fmt.ext}`;
    } else {
      href = `/api/youtube/download?url=${encodeURIComponent(fmt.url)}&title=${encodeURIComponent(safeTitle)}&ext=${fmt.ext}`;
    }

    const a = document.createElement("a");
    a.href = href;
    a.download = `${safeTitle}.${fmt.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloading(null), 3000);
  };

  const clear = () => { setUrl(""); setInfo(null); setError(""); };

  return (
    <div>
      {/* URL Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            placeholder="Paste YouTube URL — video, short, or playlist"
            className="input-url w-full bg-[#212121] border border-[#3a3a3a] rounded-xl px-4 py-3 text-sm text-[#f1f1f1] placeholder-[#717171] pr-10"
          />
          {url && (
            <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717171] hover:text-[#f1f1f1]">
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={handleFetch}
          disabled={loading || !url.trim()}
          className="bg-[#ff0000] hover:bg-[#cc0000] disabled:bg-[#3a3a3a] disabled:text-[#717171] text-white font-medium px-5 py-3 rounded-xl flex items-center gap-2 text-sm transition-colors"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search size={16} />
          )}
          {loading ? "Fetching..." : "Fetch"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-[#2a1a1a] border border-[#5a2020] rounded-xl p-4 text-sm text-[#ff6b6b]">
          {error}
        </div>
      )}

      {/* Skeleton */}
      {loading && <VideoInfoSkeleton />}

      {/* Result */}
      {!loading && info && (
        <div className="mt-5 animate-fade-in">

          {/* Single video / short */}
          {(info.type === "video" || info.type === "short") && (
            <div className="bg-[#212121] rounded-xl overflow-hidden border border-[#3a3a3a]">
              <div className="flex gap-4 p-4">
                {info.thumbnail && (
                  <img
                    src={info.thumbnail}
                    alt={info.title}
                    className="w-36 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {info.type === "short" ? (
                      <span className="bg-[#ff0000] text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap size={10} /> Short
                      </span>
                    ) : (
                      <span className="bg-[#2a2a2a] text-[#aaa] text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Film size={10} /> Video
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-sm text-[#f1f1f1] line-clamp-2">{info.title}</p>
                  <p className="text-xs text-[#aaa] mt-1">{info.channel}</p>
                  <div className="flex gap-3 mt-1 text-xs text-[#717171]">
                    {info.duration && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {formatDuration(info.duration)}
                      </span>
                    )}
                    {info.view_count && (
                      <span className="flex items-center gap-1">
                        <Eye size={11} /> {formatViews(info.view_count)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {info.formats && info.formats.length > 0 && (
                <div className="px-4 pb-4">
                  {downloading ? (
                    <div className="w-full bg-[#2a2a2a] text-[#aaa] font-medium px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm">
                      <div className="w-4 h-4 border-2 border-[#ff0000] border-t-transparent rounded-full animate-spin" />
                      Preparing download...
                    </div>
                  ) : (
                    <DownloadButton
                      formats={info.formats}
                      title={info.title}
                      onDownload={handleDownload}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Playlist */}
          {info.type === "playlist" && (
            <div className="bg-[#212121] rounded-xl border border-[#3a3a3a] overflow-hidden">
              <div className="p-4 flex items-center gap-4">
                {info.thumbnail && (
                  <img
                    src={info.thumbnail}
                    alt={info.title}
                    className="w-28 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div>
                  <span className="bg-[#2a2a2a] text-[#aaa] text-xs px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mb-2">
                    <List size={10} /> Playlist
                  </span>
                  <p className="font-medium text-sm text-[#f1f1f1]">{info.title}</p>
                  <p className="text-xs text-[#aaa] mt-0.5">{info.channel}</p>
                  <p className="text-xs text-[#717171] mt-0.5">{info.video_count} videos</p>
                </div>
              </div>

              <div className="border-t border-[#3a3a3a]">
                <button
                  onClick={() => setPlaylistExpanded(!playlistExpanded)}
                  className="w-full px-4 py-3 flex items-center justify-between text-sm text-[#aaa] hover:text-[#f1f1f1] hover:bg-[#2a2a2a] transition-colors"
                >
                  <span>{playlistExpanded ? "Hide" : "Show"} {info.videos?.length} videos</span>
                  {playlistExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {playlistExpanded && info.videos && (
                  <div className="divide-y divide-[#3a3a3a] max-h-[480px] overflow-y-auto">
                    {info.videos.map((video, i) => (
                      <div key={video.id} className="p-3 hover:bg-[#2a2a2a] transition-colors">
                        <div className="flex gap-3 items-center">
                          <span className="text-xs text-[#717171] w-5 flex-shrink-0">{i + 1}</span>
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-20 h-11 object-cover rounded flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#f1f1f1] line-clamp-2">{video.title}</p>
                            {video.duration && (
                              <p className="text-xs text-[#717171] mt-0.5">{formatDuration(video.duration)}</p>
                            )}
                          </div>
                          {videoFormats[video.id] ? (
                            <button
                              onClick={() => {
                                const best = getBestFormat(videoFormats[video.id]);
                                if (best) handleDownload(best, video.title);
                              }}
                              className="flex-shrink-0 bg-[#ff0000] hover:bg-[#cc0000] text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                            >
                              <Download size={12} /> Download
                            </button>
                          ) : (
                            <button
                              onClick={() => fetchVideoFormats(video)}
                              className="flex-shrink-0 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#aaa] hover:text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 border border-[#3a3a3a]"
                            >
                              {loadingFormats === video.id ? (
                                <div className="w-3 h-3 border border-[#ff0000] border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Download size={12} />
                              )}
                              Get
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
