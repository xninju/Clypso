"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { Download, Search, X, Video, Image } from "lucide-react";

interface FbItem {
  url: string;
  quality: string;
  ext: string;
  filesize: string;
}

interface FbInfo {
  title: string;
  thumbnail: string;
  items: FbItem[];
}

const FB_BLUE = "#1877F2";

function Thumb({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`bg-[#2a2a2a] flex items-center justify-center rounded-lg ${className || ""}`}>
        <Image size={20} className="text-[#555]" />
      </div>
    );
  }
  return (
    <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}

export default function FacebookDownloader({
  onUrlChange,
  initialUrl,
}: {
  onUrlChange?: (url: string) => void;
  initialUrl?: string;
}) {
  const [url, setUrl] = useState(initialUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<FbInfo | null>(null);

  useEffect(() => { if (initialUrl) setUrl(initialUrl); }, [initialUrl]);

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setInfo(null);
    try {
      const res = await axios.post("/api/facebook/info", { url }, { timeout: 30000 });
      setInfo(res.data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      const detail = err?.response?.data?.detail || "";
      setError(detail === "NO_API_KEY" ? "NO_API_KEY" : detail || "Failed to fetch Facebook video. Make sure it is a public post.");
    } finally {
      setLoading(false);
    }
  };

  const logDownload = async () => {
    try {
      await fetch("/api/log-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "facebook", url, media_type: "video" }),
      });
      fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "facebook" }),
      }).catch(() => {});
    } catch {}
  };

  const handleDownload = (item: FbItem, index: number) => {
    logDownload();
    const filename = `facebook_${index + 1}.${item.ext}`;
    const proxyUrl = `/api/facebook/download?url=${encodeURIComponent(item.url)}&filename=${encodeURIComponent(filename)}`;
    const a = document.createElement("a");
    a.href = proxyUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clear = () => { setUrl(""); setInfo(null); setError(""); };

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); onUrlChange?.(e.target.value); }}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            placeholder="Paste Facebook video or reel URL"
            className="w-full bg-[#212121] border border-[#3a3a3a] rounded-xl px-4 py-3 text-sm text-[#f1f1f1] placeholder-[#717171] pr-10 focus:outline-none focus:border-[#3a5a8a]"
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
          style={{ backgroundColor: loading || !url.trim() ? undefined : FB_BLUE }}
          className="disabled:bg-[#2a2a2a] disabled:text-[#555] text-white font-medium px-5 py-3 rounded-xl flex items-center gap-2 text-sm transition-colors hover:opacity-90"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search size={16} />
          )}
          {loading ? "Fetching..." : "Fetch"}
        </button>
      </div>

      {error && error !== "NO_API_KEY" && (
        <div className="mt-4 bg-[#2a1a1a] border border-[#5a2020] rounded-xl p-4 text-sm text-[#ff6b6b]">
          {error}
        </div>
      )}

      {error === "NO_API_KEY" && (
        <div className="mt-4 bg-[#0d1a2e] border border-[#1a3a6a] rounded-xl p-4 text-sm">
          <p className="font-medium mb-1" style={{ color: FB_BLUE }}>Facebook API key required</p>
          <p className="text-[#717171] mb-3 text-xs leading-relaxed">
            A free RapidAPI key is needed to download Facebook videos.
          </p>
          <ol className="text-xs text-[#555] space-y-1 mb-3 list-decimal list-inside">
            <li>Sign up free at <span style={{ color: FB_BLUE }}>rapidapi.com</span></li>
            <li>Search &quot;Facebook Story Saver&quot; by bravedownz → subscribe (free tier)</li>
            <li>Copy your API key and add it in the Admin panel</li>
          </ol>
          <a
            href="/admin"
            className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors"
            style={{ background: "#0d2040", color: FB_BLUE }}
          >
            → Open Admin Panel to add key
          </a>
        </div>
      )}

      {loading && (
        <div className="mt-5 bg-[#212121] rounded-xl border border-[#3a3a3a] p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-[#2a2a2a] rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 bg-[#2a2a2a] rounded w-3/4" />
              <div className="h-3 bg-[#2a2a2a] rounded w-1/2" />
            </div>
          </div>
        </div>
      )}

      {!loading && info && (
        <div className="mt-5 animate-fade-in">
          <div className="bg-[#212121] rounded-xl border border-[#3a3a3a] overflow-hidden">
            <div className="p-4 flex items-start gap-4">
              <Thumb
                src={info.thumbnail}
                alt="thumbnail"
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />
              <div>
                <span
                  className="text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mb-2"
                  style={{ backgroundColor: FB_BLUE }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook Video
                </span>
                <p className="text-sm font-medium text-[#f1f1f1] line-clamp-2">{info.title || "Facebook Video"}</p>
              </div>
            </div>

            <div className="border-t border-[#3a3a3a] divide-y divide-[#3a3a3a]">
              {info.items.map((item, i) => (
                <div key={i} className="p-4 flex items-center gap-4 hover:bg-[#2a2a2a] transition-colors">
                  <div className="w-10 h-10 bg-[#2a2a2a] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Video size={18} className="text-[#555]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-[#aaa]">{item.quality}</span>
                      <span className="text-xs text-[#555]">•</span>
                      <span className="text-xs text-[#717171]">{item.ext.toUpperCase()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(item, i)}
                    className="flex-shrink-0 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-opacity hover:opacity-90"
                    style={{ backgroundColor: FB_BLUE }}
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
