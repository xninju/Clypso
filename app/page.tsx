"use client";
import { useEffect, useState } from "react";
import { Youtube, Instagram } from "lucide-react";
import YoutubeDownloader from "@/components/YoutubeDownloader";
import InstagramDownloader from "@/components/InstagramDownloader";
import StatsBar from "@/components/StatsBar";
import Script from "next/script";

type Tab = "youtube" | "instagram";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://clypso.qzz.io";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Clypso",
  url: SITE_URL,
  description:
    "Free online downloader for YouTube videos, Shorts, Playlists and Instagram Reels, Posts and Carousels. No login required, no watermark.",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Download YouTube videos in HD",
    "Download YouTube Shorts",
    "Download YouTube Playlists",
    "Download Instagram Reels",
    "Download Instagram Posts",
    "Download Instagram Carousels",
    "No login required",
    "No watermark",
    "Free to use",
  ],
};

export default function Home() {
  const [tab, setTab] = useState<Tab>("youtube");

  useEffect(() => {
    if (!sessionStorage.getItem("visited")) {
      sessionStorage.setItem("visited", "1");
      fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "visit" }),
      }).catch(() => {});
    }
  }, []);

  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-[#3a3a3a] bg-[#0f0f0f] sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Clypso" className="w-7 h-7" />
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
              <h1 className="text-3xl font-bold text-[#f1f1f1] mb-2">Download Anything</h1>
              <p className="text-[#aaaaaa] text-sm">
                YouTube videos, Shorts &amp; Playlists · Instagram Reels, Posts &amp; Carousels
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#3a3a3a] mb-6">
              <button
                onClick={() => setTab("youtube")}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                  tab === "youtube" ? "tab-active text-[#f1f1f1]" : "text-[#717171] hover:text-[#aaa]"
                }`}
              >
                <Youtube size={16} className={tab === "youtube" ? "text-[#ff0000]" : ""} />
                YouTube
              </button>
              <button
                onClick={() => setTab("instagram")}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                  tab === "instagram" ? "tab-active-ig text-[#f1f1f1]" : "text-[#717171] hover:text-[#aaa]"
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
                  <li>• Reels download as MP4 video with audio</li>
                  <li>• Copy the link from the Instagram app's share menu</li>
                </ul>
              )}
            </div>
          </div>
        </main>

        <StatsBar />

        <footer className="bg-[#0f0f0f] border-t border-[#3a3a3a] py-5 px-4">
          <div className="max-w-3xl mx-auto flex items-center justify-center">
            <p className="text-xs text-[#555]">© {new Date().getFullYear()} Clypso.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
