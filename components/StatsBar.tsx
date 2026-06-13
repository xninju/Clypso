"use client";
import { useEffect, useState } from "react";
import { Download, Globe, Youtube, Instagram } from "lucide-react";
import { StatsSkeleton } from "./Skeleton";

interface Stats {
  total_visits: number;
  yt_downloads: number;
  ig_downloads: number;
  fb_downloads: number;
  tt_downloads: number;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.24 8.24 0 0 0 4.83 1.55V6.79a4.85 4.85 0 0 1-1.06-.1z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export default function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.total_visits === "number") setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const total = stats
    ? stats.yt_downloads + stats.ig_downloads + (stats.fb_downloads || 0) + (stats.tt_downloads || 0)
    : 0;

  return (
    <div className="border-t border-[#3a3a3a] bg-[#1a1a1a] py-6 px-4">
      <p className="text-center text-xs text-[#717171] uppercase tracking-widest mb-4">Stats</p>
      <div className="max-w-3xl mx-auto">
        {loading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              {
                icon: <Globe size={16} className="text-[#717171]" />,
                label: "Visits",
                value: stats ? formatNumber(stats.total_visits) : "—",
              },
              {
                icon: <Youtube size={16} className="text-[#ff0000]" />,
                label: "YouTube",
                value: stats ? formatNumber(stats.yt_downloads) : "—",
              },
              {
                icon: <Instagram size={16} style={{ color: "#e1306c" }} />,
                label: "Instagram",
                value: stats ? formatNumber(stats.ig_downloads) : "—",
              },
              {
                icon: <span className="text-[#EE1D52]"><TikTokIcon /></span>,
                label: "TikTok",
                value: stats ? formatNumber(stats.tt_downloads || 0) : "—",
              },
              {
                icon: <span className="text-[#1877F2]"><FacebookIcon /></span>,
                label: "Facebook",
                value: stats ? formatNumber(stats.fb_downloads || 0) : "—",
              },
              {
                icon: <Download size={16} className="text-[#f1f1f1]" />,
                label: "Total DLs",
                value: stats ? formatNumber(total) : "—",
              },
            ].map((item) => (
              <div key={item.label} className="stat-card rounded-xl p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs text-[#717171]">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <span className="text-xl font-semibold text-[#f1f1f1]">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
