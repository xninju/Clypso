"use client";
import { useState } from "react";
import axios from "axios";
import { Download, Search, X, Image, Video, Film, Grid } from "lucide-react";
import { IgInfoSkeleton } from "./Skeleton";

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

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

export default function InstagramDownloader() {
  const [url, setUrl]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [info, setInfo]     = useState<IgInfo | null>(null);

  const handleFetch = async () => {
    if (!url.trim()) return;
    if (!API) {
      setError("Backend URL is not configured.");
      return;
    }
    setLoading(true);
    setError("");
    setInfo(null);
    try {
      const res = await axios.post(`${API}/instagram/info`, { url }, { timeout: 45000 });
      setInfo(res.data);
    } catch (e: any) {
      setError(
        e?.response?.data?.detail ||
          "Failed to fetch Instagram content. Make sure the post is public."
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

  const handleDownload = (item: MediaItem, index: number) => {
    logDownload("instagram", url, info?.post_type || "post");
    const a = document.createElement("a");
    a.href = item.url;
    a.download = `instagram_${index + 1}.${item.ext}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
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
            onChange={(e) => setUrl(e.target.value)}
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
          className="bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#fcaf45] disabled:from-[#3a3a3a] disabled:via-[#3a3a3a] disabled:to-[#3a3a3a] disabled:text-[#717171] text-white font-medium px-5 py-3 rounded-xl flex items-center gap-2 text-sm"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={16} />}
          {loading ? "Fetching..." : "Fetch"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-[#2a1a1a] border border-[#5a2020] rounded-xl p-4 text-sm text-[#ff6b6b]">
          {error}
        </div>
      )}

      {/* Skeleton while loading */}
      {loading && <IgInfoSkeleton />}

      {/* Result */}
      {!loading && info && (
        <div className="mt-5 animate-fade-in">
          <div className="bg-[#212121] rounded-xl border border-[#3a3a3a] overflow-hidden">
            <div className="p-4 flex items-start gap-4">
              {info.thumbnail && (
                <img src={info.thumbnail} alt="thumbnail" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
              )}
              <div>
                {ptMeta && (
                  <span className={`${ptMeta.color} text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mb-2`}>
                    {ptMeta.icon} {ptMeta.label}
                  </span>
                )}
                <p className="text-sm font-medium text-[#f1f1f1] line-clamp-2">{info.title || "Instagram Post"}</p>
                {info.item_count > 1 && (
                  <p className="text-xs text-[#717171] mt-1 flex items-center gap-1">
                    <Grid size={11} /> {info.item_count} items in this {info.type}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-[#3a3a3a] divide-y divide-[#3a3a3a]">
              {info.items.map((item, i) => (
                <div key={i} className="p-4 flex items-center gap-4 hover:bg-[#2a2a2a] transition-colors">
                  <div className="relative flex-shrink-0">
                    <img
                      src={item.thumbnail}
                      alt={`item ${i + 1}`}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    {item.media_type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                        <Video size={18} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-[#aaa]">{info.item_count > 1 ? `Item ${i + 1}` : "Media"}</span>
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
