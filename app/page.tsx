"use client";
import { useEffect, useState } from "react";
import { Youtube, Instagram, ChevronDown, ChevronUp, Zap, UserX, Tv2 } from "lucide-react";
import YoutubeDownloader from "@/components/YoutubeDownloader";
import InstagramDownloader from "@/components/InstagramDownloader";
import StatsBar from "@/components/StatsBar";
import FeedbackSection from "@/components/FeedbackSection";
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
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
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

const faqs = [
  {
    q: "Is Clypso really free?",
    a: "Yes. Clypso is 100% free, has no sign-up, and no watermark is added to your downloads.",
  },
  {
    q: "Which platforms are supported?",
    a: "Currently YouTube (videos, Shorts, playlists) and Instagram (posts, Reels, carousels). More platforms are on the way.",
  },
  {
    q: "Can I download private or login-only content?",
    a: "No. Clypso can only fetch publicly accessible content. Private or login-gated videos cannot be downloaded.",
  },
  {
    q: "Do you store my downloads?",
    a: "No. Files stream directly from the source to your device. We do not store or cache your media.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. Clypso is fully responsive and works on iOS, Android, tablet, and desktop browsers.",
  },
];

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#2a2a2a] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-[#f1f1f1] hover:bg-[#1a1a1a] transition-colors"
      >
        {q}
        {open ? <ChevronUp size={16} className="text-[#717171] flex-shrink-0 ml-4" /> : <ChevronDown size={16} className="text-[#717171] flex-shrink-0 ml-4" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-[#aaa] leading-relaxed border-t border-[#2a2a2a]">
          <p className="pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

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

        {/* ── Navbar (untouched) ── */}
        <header className="border-b border-[#3a3a3a] bg-[#0f0f0f] sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Clypso" className="w-7 h-7" />
              <span className="font-semibold text-[#f1f1f1] text-sm">Clypso</span>
            </div>
            <p className="text-xs text-[#717171]">Free · No login · No watermark</p>
          </div>
        </header>

        <main className="flex-1">

          {/* ── Hero ── */}
          <section className="bg-[#0f0f0f] pt-16 pb-12 px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-4xl sm:text-5xl font-bold text-[#f1f1f1] leading-tight mb-4">
                Save any video.<br />Anywhere. Free.
              </h1>
              <p className="text-[#aaa] text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                Paste a link from YouTube or Instagram. Clypso fetches the original file in HD MP4 — straight to your device.
              </p>
            </div>
          </section>

          {/* ── Downloader tool ── */}
          <section className="bg-[#141414] py-8 px-4 border-y border-[#2a2a2a]">
            <div className="max-w-2xl mx-auto">
              {/* Platform switcher */}
              <div className="flex bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-1 mb-5 w-fit mx-auto">
                <button
                  onClick={() => setTab("youtube")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === "youtube"
                      ? "bg-[#ff0000] text-white shadow"
                      : "text-[#555] hover:text-[#aaa]"
                  }`}
                >
                  <Youtube size={15} /> YouTube
                </button>
                <button
                  onClick={() => setTab("instagram")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === "instagram"
                      ? "text-white shadow"
                      : "text-[#555] hover:text-[#aaa]"
                  }`}
                  style={tab === "instagram" ? { background: "linear-gradient(to right, #833ab4, #e1306c, #fcaf45)" } : {}}
                >
                  <Instagram size={15} /> Instagram
                </button>
              </div>

              {tab === "youtube"
                ? <YoutubeDownloader />
                : <InstagramDownloader />}

              {/* Platform badges — decorative only */}
              <div className="flex items-center justify-center gap-2 mt-5 flex-wrap pointer-events-none select-none">
                <span className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border bg-[#ff0000] border-[#ff0000] text-white cursor-default">
                  <Youtube size={15} /> YouTube
                </span>
                <span
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-transparent text-white cursor-default"
                  style={{ background: "linear-gradient(to right, #833ab4, #e1306c, #fcaf45)" }}
                >
                  <Instagram size={15} /> Instagram
                </span>
                <span className="flex items-center gap-2 px-4 py-2 rounded-full text-sm border border-[#2a2a2a] text-[#555] cursor-default">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#69C9D0]"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.24 8.24 0 0 0 4.83 1.55V6.79a4.85 4.85 0 0 1-1.06-.1z"/></svg>
                  TikTok <span className="text-[#444] text-xs">Soon</span>
                </span>
                <span className="flex items-center gap-2 px-4 py-2 rounded-full text-sm border border-[#2a2a2a] text-[#555] cursor-default">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#1877F2]"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook <span className="text-[#444] text-xs">Soon</span>
                </span>
              </div>

              {/* API note */}
              <p className="text-center text-xs text-[#3d3d3d] mt-5 mb-1">
                <span className="inline-flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 flex-shrink-0 text-[#3d3d3d]"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Metadata &amp; streams fetched in real-time via verified third-party extraction APIs. No files are stored on our servers.
                </span>
              </p>
            </div>
          </section>

          {/* ── Workflow ── */}
          <section className="py-16 px-4 bg-[#0f0f0f]">
            <div className="max-w-3xl mx-auto">
              <p className="text-xs text-[#717171] font-semibold uppercase tracking-widest text-center mb-2">Workflow</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#f1f1f1] text-center mb-2">Three taps. Done.</h2>
              <p className="text-[#717171] text-sm text-center mb-10">No installs, no sign-ups. Just a link in, a video out. Works on phone, tablet and desktop.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  {
                    n: "01",
                    title: "Copy the link",
                    desc: "Grab any video URL from YouTube or Instagram.",
                  },
                  {
                    n: "02",
                    title: "Paste & fetch",
                    desc: "Drop the link into Clypso. We pull metadata and available formats in seconds.",
                  },
                  {
                    n: "03",
                    title: "Download",
                    desc: "Pick your quality. The file streams straight to your device.",
                  },
                ].map((step) => (
                  <div key={step.n} className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6">
                    <span className="text-3xl font-bold text-white opacity-15">{step.n}</span>
                    <h3 className="text-base font-semibold text-[#f1f1f1] mt-3 mb-2">{step.title}</h3>
                    <p className="text-sm text-[#717171] leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Supported platforms ── */}
          <section className="py-16 px-4 bg-[#141414] border-y border-[#2a2a2a]">
            <div className="max-w-3xl mx-auto">
              <p className="text-xs text-[#717171] font-semibold uppercase tracking-widest text-center mb-2">Supported</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#f1f1f1] text-center mb-2">Every platform you actually use.</h2>
              <p className="text-[#717171] text-sm text-center mb-10">From a viral Short to a full YouTube edit — Clypso handles them all.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    icon: <Youtube size={22} className="text-[#ff0000]" />,
                    name: "YouTube", sub: "Videos · Shorts · Playlists", live: true, color: "text-[#ff0000]",
                  },
                  {
                    icon: <Instagram size={22} style={{ color: "#e1306c" }} />,
                    name: "Instagram", sub: "Posts · Reels · Carousels", live: true, color: "text-[#e1306c]",
                  },
                  {
                    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#69C9D0]"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.24 8.24 0 0 0 4.83 1.55V6.79a4.85 4.85 0 0 1-1.06-.1z"/></svg>,
                    name: "TikTok", sub: "Coming soon", live: false, color: "text-[#69C9D0]",
                  },
                  {
                    icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#1877F2]"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
                    name: "Facebook", sub: "Coming soon", live: false, color: "text-[#1877F2]",
                  },
                ].map((p) => (
                  <div
                    key={p.name}
                    className={`rounded-2xl border p-5 flex flex-col items-center text-center gap-2 ${
                      p.live ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-[#111] border-[#1e1e1e] opacity-40"
                    }`}
                  >
                    {p.icon}
                    <span className={`text-sm font-semibold ${p.live ? "text-[#f1f1f1]" : "text-[#555]"}`}>{p.name}</span>
                    <span className="text-xs text-[#555]">{p.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Features ── */}
          <section className="py-16 px-4 bg-[#0f0f0f]">
            <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: <Zap size={20} className="text-[#f1f1f1]" />,
                  title: "Blazing fast",
                  desc: "Direct extraction, no queues, no ads in your face.",
                },
                {
                  icon: <UserX size={20} className="text-[#f1f1f1]" />,
                  title: "Login free",
                  desc: "We never ask for accounts, emails or passwords.",
                },
                {
                  icon: <Tv2 size={20} className="text-[#f1f1f1]" />,
                  title: "HD quality",
                  desc: "Get the best available resolution for every video.",
                },
              ].map((f) => (
                <div key={f.title} className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 flex flex-col gap-3">
                  <div className="w-9 h-9 bg-[#1f1f1f] rounded-xl flex items-center justify-center">{f.icon}</div>
                  <h3 className="text-sm font-semibold text-[#f1f1f1]">{f.title}</h3>
                  <p className="text-sm text-[#717171] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Stats ── */}
          <StatsBar />

          {/* ── Feedback ── */}
          <FeedbackSection />

          {/* ── FAQ ── */}
          <section className="py-16 px-4 bg-[#0f0f0f] border-t border-[#2a2a2a]">
            <div className="max-w-2xl mx-auto">
              <p className="text-xs text-[#717171] font-semibold uppercase tracking-widest text-center mb-2">FAQ</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#f1f1f1] text-center mb-10">Questions, answered.</h2>
              <div className="flex flex-col gap-3">
                {faqs.map((f) => (
                  <FAQ key={f.q} q={f.q} a={f.a} />
                ))}
              </div>
            </div>
          </section>

        </main>

        {/* ── Footer ── */}
        <footer className="bg-[#0a0a0a] border-t border-[#2a2a2a] py-8 px-4">
          <div className="max-w-3xl mx-auto flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Clypso" className="w-5 h-5 opacity-60" />
              <span className="text-sm font-semibold text-[#555]">clypso</span>
            </div>
            <p className="text-xs text-[#555]">© {new Date().getFullYear()} Clypso. Built for creators.</p>
            <p className="text-xs text-[#3a3a3a] max-w-md leading-relaxed">
              Clypso is not affiliated with YouTube, Instagram, TikTok or Facebook. Please respect creators and only download content you have rights to use.
            </p>
          </div>
        </footer>

      </div>
    </>
  );
}
