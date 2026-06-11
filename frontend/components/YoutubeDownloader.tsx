"use client";
import { useState } from "react";
import axios from "axios";
import {
  Download,
  Search,
  X,
  List,
  Film,
  Zap,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

interface Format {
  format_id: string;
  label: string;
  ext: string;
  filesize: string;
  url: string;
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

export default function YoutubeDownloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [playlistExpanded, setPlaylistExpanded] = useState(false);
  const [loadingFormats, setLoadingFormats] = useState<string | null>(null);
  const [videoFormats, setVideoFormats] = useState<Record<string, Format[]>>({});

  const handleFetch = async () => {
    if (!url.trim()) return;
    if (!API) {
      setError("Backend URL is not configured. Please set NEXT_PUBLIC_BACKEND_URL.");
      return;
    }
    setLoading(true);
    setError("");
    setInfo(null);

    try {
      const res = await axios.post(`${API}/youtube/info`, { url }, { timeout: 30000 });
      setInfo(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Failed to fetch video info. Check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  const logDownload = async (platform: string, url: string, media_type: string) => {
    try {
      await fetch("/api/log-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, url, media_type }),
      });
    } catch {}
  };

  const fetchVideoFormats = async (video: PlaylistVideo) => {
    if (videoFormats[video.id]) return;
    setLoadingFormats(video.id);
    try {
      const res = await axios.post(`${API}/youtube/playlist-video`, { url: video.url });
      setVideoFormats((prev) => ({ ...prev, [video.id]: res.data.formats }));
    } catch {}
    setLoadingFormats(null);
  };

  const handleDownload = (fmt: Format, title: string) => {
    logDownload("youtube", url, info?.type || "video");
    const a = document.createElement("a");
    a.href = fmt.url;
    a.download = `${title}.${fmt.ext}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clear = () => {
    setUrl("");
    setInfo(null);
    setError("");
  };

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
            <button
              onClick={clear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717171] hover:text-[#f1f1f1]"
            >
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

      {/* Result */}
      {info && (
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

              {/* Format buttons */}
              {info.formats && info.formats.length > 0 && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-[#717171] mb-2">Select quality to download</p>
                  <div className="flex flex-wrap gap-2">
                    {info.formats.map((fmt) => (
                      <button
                        key={fmt.format_id}
                        onClick={() => handleDownload(fmt, info.title)}
                        className="format-btn bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#ff0000] rounded-lg px-3 py-2 flex items-center gap-2 text-sm transition-colors"
                      >
                        <Download size={13} className="text-[#ff0000]" />
                        <span className="font-medium">{fmt.label}</span>
                        <span className="text-xs text-[#717171]">{fmt.ext.toUpperCase()}</span>
                        {fmt.filesize !== "Unknown" && (
                          <span className="text-xs text-[#555]">{fmt.filesize}</span>
                        )}
                      </button>
                    ))}
                  </div>
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
                  <span>
                    {playlistExpanded ? "Hide" : "Show"} {info.videos?.length} videos
                  </span>
                  {playlistExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {playlistExpanded && info.videos && (
                  <div className="divide-y divide-[#3a3a3a] max-h-[480px] overflow-y-auto">
                    {info.videos.map((video, i) => (
                      <div key={video.id} className="p-3 hover:bg-[#2a2a2a] transition-colors">
                        <div className="flex gap-3 items-start">
                          <span className="text-xs text-[#717171] w-5 flex-shrink-0 pt-1">{i + 1}</span>
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
                          <button
                            onClick={() => fetchVideoFormats(video)}
                            className="flex-shrink-0 bg-[#ff0000] hover:bg-[#cc0000] text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                          >
                            {loadingFormats === video.id ? (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Download size={12} />
                            )}
                            Get
                          </button>
                        </div>

                        {videoFormats[video.id] && (
                          <div className="mt-2 ml-8 flex flex-wrap gap-1.5">
                            {videoFormats[video.id].map((fmt) => (
                              <button
                                key={fmt.format_id}
                                onClick={() => handleDownload(fmt, video.title)}
                                className="format-btn bg-[#1a1a1a] border border-[#3a3a3a] hover:border-[#ff0000] rounded px-2 py-1 text-xs flex items-center gap-1"
                              >
                                <Download size={10} className="text-[#ff0000]" />
                                {fmt.label}
                              </button>
                            ))}
                          </div>
                        )}
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
