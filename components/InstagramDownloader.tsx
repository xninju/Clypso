"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Download, Search, X, Image, Video, Film, Grid } from "lucide-react";
import { IgInfoSkeleton } from "./Skeleton";

interface MediaItem {
  media_type: "video" | "image";
  url: string;
  thumbnail: string;
  quality: string;
  ext: string;
  filesize: string;
}

interface IgInfo {
  type: "single" | "carousel";
  post_type: "reel" | "post" | "story";
  title: string;
  thumbnail?: string;
  item_count: number;
  items: MediaItem[];
}

const POST_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  reel:  { label: "Reel",  icon: <Film size={10} />,  color: "bg-[#e1306c]" },
  post:  { label: "Post",  icon: <Image size={10} />, color: "bg-[#833ab4]" },
  story: { label: "Story", icon: <Video size={10} />, color: "bg-[#fcaf45]" },
};

function proxyImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("data:")) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

function Thumb({
  src, alt, className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = proxyImg(src);

  if (!resolved || failed) {
    return (
      <div className={`bg-[#2a2a2a] flex items-center justify-center rounded-lg ${className || ""}`}>
        <Image size={20} className="text-[#555]" />
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export default function InstagramDownloader({ onUrlChange, initialUrl }: { onUrlChange?: (url: string) => void; initialUrl?: string }) {
  const [url, setUrl]           = useState(initialUrl || "");

  useEffect(() => { if (initialUrl) setUrl(initialUrl); }, [initialUrl]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [info, setInfo]         = useState<IgInfo | null>(null);

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setInfo(null);
    try {
      const res = await axios.post(`/api/instagram/info`, { url }, { timeout: 45000 });
      setInfo(res.data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      const detail = err?.response?.data?.detail || "";
      if (detail === "NO_API_KEY") {
        setError("NO_API_KEY");
      } else {
        setError(detail || "Failed to fetch Instagram content. Make sure the post is public.");
      }
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

  const handleDownload = (item: MediaItem, index: number) => {
    logDownload("instagram", url, info?.post_type || "post");
    const filename = `instagram_${index + 1}.${item.ext}`;
    const proxyUrl = `/api/instagram/download?url=${encodeURIComponent(item.url)}&filename=${encodeURIComponent(filename)}`;
    const a = document.createElement("a");
    a.href = proxyUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clear = () => { setUrl(""); setInfo(null); setError(""); };

  const ptMeta = info ? POST_TYPE_LABELS[info.post_type] || POST_TYPE_LABELS.post : null;

  return (
    <div>
      {/* URL Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); onUrlChange?.(e.target.value); }}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            placeholder="Paste Instagram URL — post, reel, or carousel"
            className="input-url-ig w-full bg-[#212121] border border-[#3a3a3a] rounded-xl px-4 py-3 text-sm text-[#f1f1f1] placeholder-[#717171] pr-10"
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
          className="bg-white hover:bg-[#e8e8e8] disabled:bg-[#2a2a2a] disabled:text-[#555] text-[#0f0f0f] font-medium px-5 py-3 rounded-xl flex items-center gap-2 text-sm transition-colors"
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
      {error && error !== "NO_API_KEY" && (
        <div className="mt-4 bg-[#2a1a1a] border border-[#5a2020] rounded-xl p-4 text-sm text-[#ff6b6b]">
          {error}
        </div>
      )}

      {/* No API key notice */}
      {error === "NO_API_KEY" && (
        <div className="mt-4 bg-[#1a1a2a] border border-[#3a3a6a] rounded-xl p-4 text-sm">
          <p className="text-[#a0a0ff] font-medium mb-1">Instagram API key required</p>
          <p className="text-[#717171] mb-3 text-xs leading-relaxed">
            Instagram blocks all public requests. A free RapidAPI key is needed to download reels and posts.
          </p>
          <ol className="text-xs text-[#555] space-y-1 mb-3 list-decimal list-inside">
            <li>Sign up free at <span className="text-[#a0a0ff]">rapidapi.com</span></li>
            <li>Search &quot;Instagram Downloader&quot; → subscribe (free tier available)</li>
            <li>Copy your API key and add it in the Admin panel below</li>
          </ol>
          <a
            href="/admin"
            className="inline-flex items-center gap-2 bg-[#2a2a4a] hover:bg-[#3a3a6a] text-[#a0a0ff] text-xs px-3 py-2 rounded-lg transition-colors"
          >
            → Open Admin Panel to add key
          </a>
        </div>
      )}

      {/* Skeleton */}
      {loading && <IgInfoSkeleton />}

      {/* Result */}
      {!loading && info && (
        <div className="mt-5 animate-fade-in">
          <div className="bg-[#212121] rounded-xl border border-[#3a3a3a] overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-start gap-4">
              <Thumb
                src={info.thumbnail || info.items[0]?.thumbnail}
                alt="thumbnail"
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />
              <div>
                {ptMeta && (
                  <span className={`${ptMeta.color} text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mb-2`}>
                    {ptMeta.icon} {ptMeta.label}
                  </span>
                )}
                <p className="text-sm font-medium text-[#f1f1f1] line-clamp-2">
                  {info.title || "Instagram Post"}
                </p>
                {info.item_count > 1 && (
                  <p className="text-xs text-[#717171] mt-1 flex items-center gap-1">
                    <Grid size={11} /> {info.item_count} items in this {info.type}
                  </p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-[#3a3a3a] divide-y divide-[#3a3a3a]">
              {info.items.map((item, i) => (
                <div key={i} className="p-4 flex items-center gap-4 hover:bg-[#2a2a2a] transition-colors">
                  <div className="relative flex-shrink-0">
                    <Thumb
                      src={item.thumbnail}
                      alt={`item ${i + 1}`}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    {item.media_type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg pointer-events-none">
                        <Video size={18} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-[#aaa]">
                        {info.item_count > 1 ? `Item ${i + 1}` : "Media"}
                      </span>
                      <span className="text-xs text-[#555]">•</span>
                      <span className="text-xs text-[#717171] capitalize">{item.media_type}</span>
                      <span className="text-xs text-[#555]">•</span>
                      <span className="text-xs text-[#717171]">{item.quality}</span>
                    </div>
                    <p className="text-xs text-[#555]">
                      {item.ext.toUpperCase()}
                      {item.filesize !== "Unknown" && ` · ${item.filesize}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(item, i)}
                    className="flex-shrink-0 bg-gradient-to-r from-[#833ab4] to-[#e1306c] hover:opacity-90 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-opacity"
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
