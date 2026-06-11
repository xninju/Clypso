"use client";
import { useEffect, useState } from "react";
import { Youtube, Instagram } from "lucide-react";
import YoutubeDownloader from "@/components/YoutubeDownloader";
import InstagramDownloader from "@/components/InstagramDownloader";
import StatsBar from "@/components/StatsBar";

type Tab = "youtube" | "instagram";

export default function Home() {
  const [tab, setTab] = useState<Tab>("youtube");

  // Increment visit count on mount
  useEffect(() => {
    fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "visit" }),
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#3a3a3a] bg-[#0f0f0f] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#ff0000] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-semibold text-[#f1f1f1] text-sm">Clypso</span>
          </div>
          <p className="text-xs text-[#717171]">Free · No login · No watermark</p>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-10">
          {/* Hero */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-[#f1f1f1] mb-2">
              Download Anything
            </h1>
            <p className="text-[#aaaaaa] text-sm">
              YouTube videos, Shorts & Playlists · Instagram Reels, Posts & Carousels
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#3a3a3a] mb-6">
            <button
              onClick={() => setTab("youtube")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                tab === "youtube"
                  ? "tab-active text-[#f1f1f1]"
                  : "text-[#717171] hover:text-[#aaa]"
              }`}
            >
              <Youtube size={16} className={tab === "youtube" ? "text-[#ff0000]" : ""} />
              YouTube
            </button>
            <button
              onClick={() => setTab("instagram")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                tab === "instagram"
                  ? "tab-active-ig text-[#f1f1f1]"
                  : "text-[#717171] hover:text-[#aaa]"
              }`}
            >
              <Instagram size={16} className={tab === "instagram" ? "text-[#e1306c]" : ""} />
              Instagram
            </button>
          </div>

          {/* Tab content */}
          {tab === "youtube" ? <YoutubeDownloader /> : <InstagramDownloader />}

          {/* Tips */}
          <div className="mt-8 bg-[#1a1a1a] rounded-xl p-4 border border-[#3a3a3a]">
            <p className="text-xs text-[#717171] font-medium mb-2">
              {tab === "youtube" ? "YouTube Tips" : "Instagram Tips"}
            </p>
            {tab === "youtube" ? (
              <ul className="space-y-1 text-xs text-[#555]">
                <li>• Paste any youtube.com or youtu.be link</li>
                <li>• Playlists: paste the full playlist URL (contains "list=")</li>
                <li>• Shorts: paste the /shorts/ URL directly</li>
                <li>• Select your preferred quality before downloading</li>
              </ul>
            ) : (
              <ul className="space-y-1 text-xs text-[#555]">
                <li>• Only public posts can be downloaded</li>
                <li>• Carousel posts with 2–10 items are fully supported</li>
                <li>• Reels download as MP4 video</li>
                <li>• Copy the link from the Instagram app's share menu</li>
              </ul>
            )}
          </div>
        </div>
      </main>

      {/* Stats bar before footer */}
      <StatsBar />

      {/* Footer */}
      <footer className="bg-[#0f0f0f] border-t border-[#3a3a3a] py-5 px-4">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#555]">
            © {new Date().getFullYear()} Clypso. For personal use only.
          </p>
          <p className="text-xs text-[#555]">
            Built with Next.js · FastAPI · Neon DB
          </p>
        </div>
      </footer>
    </div>
  );
}
