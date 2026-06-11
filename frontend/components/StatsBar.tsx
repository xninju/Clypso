"use client";
import { useEffect, useState } from "react";
import { Download, Globe, Youtube, Instagram } from "lucide-react";

interface Stats {
  total_visits: number;
  yt_downloads: number;
  ig_downloads: number;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export default function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const total = stats
    ? stats.yt_downloads + stats.ig_downloads
    : 0;

  const items = [
    {
      icon: <Globe size={16} className="text-[#aaa]" />,
      label: "Total Visits",
      value: stats ? formatNumber(stats.total_visits) : "—",
    },
    {
      icon: <Youtube size={16} className="text-[#ff0000]" />,
      label: "YouTube Downloads",
      value: stats ? formatNumber(stats.yt_downloads) : "—",
    },
    {
      icon: <Instagram size={16} className="text-[#e1306c]" />,
      label: "Instagram Downloads",
      value: stats ? formatNumber(stats.ig_downloads) : "—",
    },
    {
      icon: <Download size={16} className="text-[#aaa]" />,
      label: "Total Downloads",
      value: stats ? formatNumber(total) : "—",
    },
  ];

  return (
    <div className="border-t border-[#3a3a3a] bg-[#1a1a1a] py-6 px-4">
      <p className="text-center text-xs text-[#717171] uppercase tracking-widest mb-4">
        Stats
      </p>
      <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="stat-card rounded-xl p-4 flex flex-col gap-1"
          >
            <div className="flex items-center gap-1.5 text-[#aaa] text-xs">
              {item.icon}
              <span>{item.label}</span>
            </div>
            <span className="text-2xl font-semibold text-[#f1f1f1]">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
