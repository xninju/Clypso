"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Key, BarChart2, List, LogOut, Plus, Trash2,
  Edit3, Check, X, Eye, EyeOff, RefreshCw,
  Youtube, Instagram, Globe, Download, Shield,
  ExternalLink, ChevronUp, ChevronDown, MessageSquare, Star,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKey {
  id: number;
  service: string;
  label: string;
  key: string;
  enabled: boolean;
  priority: number;
  req_count: number;
  createdAt: string;
  updatedAt: string;
  platform?: "yt" | "ig";
}

interface Stats {
  total_visits: number;
  yt_downloads: number;
  ig_downloads: number;
}

interface LogEntry {
  id: number;
  platform: string;
  url: string;
  media_type: string | null;
  created_at: string;
}

interface ServiceInfo {
  name: string;
  provider: string;
  host: string;
  url: string;
  free: string;
}

// ─── Service Metadata ─────────────────────────────────────────────────────────

const YT_SERVICES: Record<string, ServiceInfo> = {
  yt_api: {
    name: "YT-API",
    provider: "ytjar",
    host: "yt-api.p.rapidapi.com",
    url: "https://rapidapi.com/ytjar/api/yt-api",
    free: "300 req/month",
  },
  yt_media_dl: {
    name: "YouTube Media Downloader",
    provider: "DataFanatic",
    host: "youtube-media-downloader.p.rapidapi.com",
    url: "https://rapidapi.com/datafanatic/api/youtube-media-downloader",
    free: "100 req/month",
  },
  ytstream: {
    name: "YTStream",
    provider: "ytjar",
    host: "ytstream-download-youtube-videos.p.rapidapi.com",
    url: "https://rapidapi.com/ytjar/api/ytstream-download-youtube-videos",
    free: "300 req/month",
  },
};

const IG_SERVICES: Record<string, ServiceInfo> = {
  ig_downloader: {
    name: "Instagram Downloader (Videos/Stories)",
    provider: "isholaomotayo",
    host: "instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com",
    url: "https://rapidapi.com/isholaomotayo/api/instagram-downloader-download-instagram-videos-stories1",
    free: "100 req/month",
  },
  ig_social: {
    name: "Social Media Video Downloader",
    provider: "ido2",
    host: "social-media-video-downloader.p.rapidapi.com",
    url: "https://rapidapi.com/ido2/api/social-media-video-downloader",
    free: "~500 req/month",
  },
  ig_allinone: {
    name: "All-in-One Social Downloader",
    provider: "mwlang",
    host: "all-in-one-social-media-downloader.p.rapidapi.com",
    url: "https://rapidapi.com/mwlang/api/all-in-one-social-media-downloader",
    free: "50 req/day",
  },
  ig_diyorbek: {
    name: "Instagram Post/Reels Downloader (legacy)",
    provider: "diyorbekkanal",
    host: "instagram-post-reels-stories-downloader-api.p.rapidapi.com",
    url: "https://rapidapi.com/diyorbekkanal/api/instagram-post-reels-stories-downloader-api",
    free: "100 req/month",
  },
  ig_safesite: {
    name: "Instagram Stories/Videos Downloader (legacy)",
    provider: "safesite15",
    host: "instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com",
    url: "https://rapidapi.com/safesite15/api/instagram-downloader-download-instagram-stories-videos4",
    free: "40 req/month",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mask(key: string): string {
  if (key.length <= 8) return "••••••••";
  return key.slice(0, 6) + "•".repeat(Math.min(key.length - 10, 20)) + key.slice(-4);
}

function fmt(n?: number): string {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── PIN Gate ─────────────────────────────────────────────────────────────────

function PinGate({ onAuth }: { onAuth: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!pin) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        sessionStorage.setItem("admin_pin", pin);
        onAuth(pin);
      } else {
        setError("Incorrect PIN");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl flex items-center justify-center mb-3">
            <Shield size={22} className="text-[#f1f1f1]" />
          </div>
          <h1 className="text-xl font-bold text-[#f1f1f1]">Admin Access</h1>
          <p className="text-sm text-[#717171] mt-1">Enter your admin PIN to continue</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-2xl p-6 space-y-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="••••••••"
            className="w-full bg-[#212121] border border-[#3a3a3a] rounded-xl px-4 py-3 text-center text-xl tracking-widest text-[#f1f1f1] placeholder-[#555] focus:outline-none focus:border-[#555]"
            autoFocus
          />
          {error && <p className="text-sm text-[#ff6b6b] text-center">{error}</p>}
          <button
            onClick={submit}
            disabled={loading || !pin}
            className="w-full bg-white hover:bg-[#e8e8e8] disabled:bg-[#2a2a2a] disabled:text-[#555] text-[#0f0f0f] font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "Verifying…" : "Enter"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ stats, keys }: { stats: Stats | null; keys: ApiKey[] }) {
  const total = stats ? stats.yt_downloads + stats.ig_downloads : 0;
  const ytKeys = keys.filter((k) => k.platform === "yt");
  const igKeys = keys.filter((k) => k.platform === "ig");

  const statCards = [
    { label: "Total Visits",        value: fmt(stats?.total_visits), icon: <Globe size={16} className="text-[#aaa]" /> },
    { label: "YouTube Downloads",   value: fmt(stats?.yt_downloads),  icon: <Youtube size={16} className="text-[#ff0000]" /> },
    { label: "Instagram Downloads", value: fmt(stats?.ig_downloads),  icon: <Instagram size={16} className="text-[#e1306c]" /> },
    { label: "Total Downloads",     value: fmt(total),                icon: <Download size={16} className="text-[#aaa]" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((c) => (
          <div key={c.label} className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-[#aaa] mb-1">
              {c.icon}<span>{c.label}</span>
            </div>
            <div className="text-2xl font-bold text-[#f1f1f1]">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* YT key health */}
        <div>
          <h2 className="text-sm font-semibold text-[#aaa] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Youtube size={14} className="text-[#ff0000]" /> YouTube Keys ({ytKeys.length})
          </h2>
          {ytKeys.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-4 text-center text-[#555] text-xs">
              No YouTube keys — add them in API Keys tab
            </div>
          ) : (
            <div className="space-y-2">
              {ytKeys.map((k) => {
                const meta = YT_SERVICES[k.service];
                return (
                  <div key={k.id} className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl px-3 py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${k.enabled ? "bg-green-500" : "bg-[#555]"}`} />
                      <div>
                        <p className="text-xs text-[#f1f1f1]">{meta?.name || k.service}</p>
                        <p className="text-xs text-[#555]">{k.label || meta?.host || ""}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[#555] flex-shrink-0">{fmt(k.req_count)} req</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* IG key health */}
        <div>
          <h2 className="text-sm font-semibold text-[#aaa] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Instagram size={14} className="text-[#e1306c]" /> Instagram Keys ({igKeys.length})
          </h2>
          {igKeys.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-4 text-center text-[#555] text-xs">
              No Instagram keys — add them in API Keys tab
            </div>
          ) : (
            <div className="space-y-2">
              {igKeys.map((k) => {
                const meta = IG_SERVICES[k.service];
                return (
                  <div key={k.id} className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl px-3 py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${k.enabled ? "bg-green-500" : "bg-[#555]"}`} />
                      <div>
                        <p className="text-xs text-[#f1f1f1]">{meta?.name || k.service}</p>
                        <p className="text-xs text-[#555]">{k.label || meta?.host || ""}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[#555] flex-shrink-0">{fmt(k.req_count)} req</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Keys Panel ───────────────────────────────────────────────────────────────

interface KeysPanelProps {
  pin: string;
  title: string;
  icon: React.ReactNode;
  accent: string;
  services: Record<string, ServiceInfo>;
  apiBase: string;
  onToast: (msg: string) => void;
}

function KeysPanel({ pin, title, icon, accent, services, apiBase, onToast }: KeysPanelProps) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [revealId, setRevealId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showRef, setShowRef] = useState(false);

  const serviceOptions = Object.keys(services);
  const [form, setForm] = useState({
    service: serviceOptions[0] || "",
    label: "",
    key: "",
    priority: "1",
    enabled: true,
  });

  const headers = { "Content-Type": "application/json", "x-admin-pin": pin };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(apiBase, { headers: { "x-admin-pin": pin } });
      const d = await r.json();
      setKeys(d.keys || []);
    } catch {}
    setLoading(false);
  }, [pin, apiBase]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => setForm({ service: serviceOptions[0] || "", label: "", key: "", priority: "1", enabled: true });

  const addKey = async () => {
    if (!form.key) return;
    setSaving(true);
    try {
      const r = await fetch(apiBase, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...form, priority: parseInt(form.priority) || 1 }),
      });
      if (r.ok) { await load(); resetForm(); setShowAdd(false); onToast("Key added"); }
    } finally { setSaving(false); }
  };

  const updateKey = async (id: number, patch: Partial<ApiKey>) => {
    try {
      await fetch(`${apiBase}/${id}`, { method: "PUT", headers, body: JSON.stringify(patch) });
      await load();
      onToast("Saved");
    } catch {}
  };

  const deleteKey = async (id: number) => {
    if (!confirm("Delete this API key?")) return;
    try {
      await fetch(`${apiBase}/${id}`, { method: "DELETE", headers: { "x-admin-pin": pin } });
      await load();
      onToast("Deleted");
    } catch {}
  };

  const selectedServiceInfo = services[form.service];

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-[#f1f1f1]">{title}</span>
          <span className="text-xs text-[#555] bg-[#2a2a2a] px-2 py-0.5 rounded-full">{keys.length} key{keys.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={load} className="p-1.5 text-[#555] hover:text-[#aaa] rounded-lg hover:bg-[#2a2a2a] transition-colors">
            <RefreshCw size={13} />
          </button>
          <button
            onClick={() => { resetForm(); setShowAdd(true); setEditId(null); }}
            style={{ backgroundColor: accent }}
            className="text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <Plus size={13} /> Add Key
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* API reference links */}
        <div className="border border-[#2a2a2a] rounded-xl overflow-hidden">
          <button
            onClick={() => setShowRef(!showRef)}
            className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-[#1a1a1a] transition-colors"
          >
            <span className="text-xs text-[#717171] font-medium">Available APIs &amp; Links</span>
            <span className="text-xs text-[#555]">{showRef ? "▲" : "▼"}</span>
          </button>
          {showRef && (
            <div className="border-t border-[#2a2a2a] divide-y divide-[#1f1f1f]">
              {Object.entries(services).map(([svc, info]) => (
                <div key={svc} className="px-3 py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-[#f1f1f1] font-medium">{info.name}</p>
                    <p className="text-xs text-[#555] mt-0.5">by {info.provider} · {info.free} free</p>
                    <p className="text-xs text-[#3a3a3a] font-mono truncate mt-0.5">{info.host}</p>
                  </div>
                  <a
                    href={info.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1 text-xs text-[#555] hover:text-[#aaa] mt-0.5 transition-colors"
                  >
                    <ExternalLink size={11} /> RapidAPI
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add / Edit Form */}
        {(showAdd || editId !== null) && (
          <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-3 space-y-3">
            <p className="text-xs font-semibold text-[#f1f1f1]">{showAdd ? "Add Key" : "Edit Key"}</p>

            <div>
              <label className="text-xs text-[#717171] mb-1 block">Service</label>
              <select
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
                className="w-full bg-[#212121] border border-[#3a3a3a] rounded-lg px-3 py-2 text-xs text-[#f1f1f1] focus:outline-none focus:border-[#555]"
              >
                {serviceOptions.map((s) => (
                  <option key={s} value={s}>{services[s].name}</option>
                ))}
              </select>
              {selectedServiceInfo && (
                <a
                  href={selectedServiceInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#555] hover:text-[#aaa] mt-1.5 transition-colors"
                >
                  <ExternalLink size={10} /> Get key from RapidAPI · {selectedServiceInfo.free} free
                </a>
              )}
            </div>

            <div>
              <label className="text-xs text-[#717171] mb-1 block">RapidAPI Key</label>
              <input
                type="text"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder="Paste x-rapidapi-key here"
                className="w-full bg-[#212121] border border-[#3a3a3a] rounded-lg px-3 py-2 text-xs text-[#f1f1f1] placeholder-[#555] font-mono focus:outline-none focus:border-[#555]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[#717171] mb-1 block">Label (optional)</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. Free tier"
                  className="w-full bg-[#212121] border border-[#3a3a3a] rounded-lg px-3 py-2 text-xs text-[#f1f1f1] placeholder-[#555] focus:outline-none focus:border-[#555]"
                />
              </div>
              <div>
                <label className="text-xs text-[#717171] mb-1 block">Priority (1 = first)</label>
                <input
                  type="number"
                  min={1}
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full bg-[#212121] border border-[#3a3a3a] rounded-lg px-3 py-2 text-xs text-[#f1f1f1] focus:outline-none focus:border-[#555]"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-[#aaa] cursor-pointer">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                className="w-3.5 h-3.5 accent-[#ff0000]"
              />
              Enabled
            </label>

            <div className="flex gap-2">
              <button
                onClick={showAdd ? addKey : () => {
                  if (editId) { updateKey(editId, { ...form, priority: parseInt(form.priority) || 1 }); setEditId(null); }
                }}
                disabled={saving || !form.key}
                style={{ backgroundColor: form.key && !saving ? accent : undefined }}
                className="disabled:bg-[#3a3a3a] disabled:text-[#717171] text-white text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 hover:opacity-90"
              >
                <Check size={12} /> {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setShowAdd(false); setEditId(null); }}
                className="text-[#717171] hover:text-[#f1f1f1] text-xs px-3 py-1.5 rounded-lg hover:bg-[#2a2a2a] transition-colors flex items-center gap-1.5"
              >
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Key list */}
        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl h-14 animate-pulse" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 text-center text-[#555] text-xs">
            No keys yet. Click &ldquo;Add Key&rdquo; to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => {
              const meta = services[k.service];
              return (
                <div key={k.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex-shrink-0 w-5 h-5 bg-[#2a2a2a] rounded text-xs font-bold text-[#aaa] flex items-center justify-center">
                      {k.priority}
                    </span>
                    <button
                      onClick={() => updateKey(k.id, { enabled: !k.enabled })}
                      title={k.enabled ? "Click to disable" : "Click to enable"}
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-opacity hover:opacity-70 ${k.enabled ? "bg-green-500" : "bg-[#555]"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#f1f1f1] truncate">
                        {meta?.name || k.service}
                        {k.label && <span className="ml-1.5 text-[#555]">· {k.label}</span>}
                      </p>
                      <p className="text-xs text-[#444] font-mono truncate">
                        {revealId === k.id ? k.key : mask(k.key)}
                      </p>
                    </div>
                    <span className="text-xs text-[#555] flex-shrink-0">{fmt(k.req_count)} req</span>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button onClick={() => setRevealId(revealId === k.id ? null : k.id)} className="p-1.5 text-[#555] hover:text-[#aaa] rounded hover:bg-[#2a2a2a] transition-colors">
                        {revealId === k.id ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button
                        onClick={() => {
                          setEditId(k.id); setShowAdd(false);
                          setForm({ service: k.service, label: k.label, key: k.key, priority: String(k.priority), enabled: k.enabled });
                        }}
                        className="p-1.5 text-[#555] hover:text-[#aaa] rounded hover:bg-[#2a2a2a] transition-colors"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button onClick={() => deleteKey(k.id)} className="p-1.5 text-[#555] hover:text-[#ff6b6b] rounded hover:bg-[#2a2a2a] transition-colors">
                        <Trash2 size={12} />
                      </button>
                      <button onClick={() => updateKey(k.id, { priority: Math.max(1, k.priority - 1) })} className="p-1.5 text-[#555] hover:text-[#aaa] rounded hover:bg-[#2a2a2a] transition-colors" title="Higher priority">
                        <ChevronUp size={12} />
                      </button>
                      <button onClick={() => updateKey(k.id, { priority: k.priority + 1 })} className="p-1.5 text-[#555] hover:text-[#aaa] rounded hover:bg-[#2a2a2a] transition-colors" title="Lower priority">
                        <ChevronDown size={12} />
                      </button>
                    </div>
                  </div>
                  {meta && (
                    <div className="mt-1.5 ml-7">
                      <a
                        href={meta.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#3a3a3a] hover:text-[#555] transition-colors"
                      >
                        <ExternalLink size={9} /> {meta.url.replace("https://rapidapi.com/", "rapidapi.com/")}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-[#3a3a3a] text-center pt-1">
          Keys tried in priority order · auto-cascades to next on failure
        </p>
      </div>
    </div>
  );
}

// ─── Keys Tab ─────────────────────────────────────────────────────────────────

function KeysTab({ pin }: { pin: string }) {
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="relative">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl px-4 py-3 text-sm text-[#f1f1f1] shadow-lg z-50">
          {toast}
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[#f1f1f1]">API Keys</h2>
        <p className="text-xs text-[#555] mt-0.5">
          One RapidAPI key works for all services you subscribe to · add multiple keys per service to auto-cascade when quota runs out
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <KeysPanel
          pin={pin}
          title="YouTube"
          icon={<Youtube size={15} className="text-[#ff0000]" />}
          accent="#cc2200"
          services={YT_SERVICES}
          apiBase="/api/admin/yt-keys"
          onToast={showToast}
        />
        <KeysPanel
          pin={pin}
          title="Instagram"
          icon={<Instagram size={15} className="text-[#e1306c]" />}
          accent="#c13584"
          services={IG_SERVICES}
          apiBase="/api/admin/ig-keys"
          onToast={showToast}
        />
      </div>
    </div>
  );
}

// ─── Logs Tab ─────────────────────────────────────────────────────────────────

function LogsTab({ pin }: { pin: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/dashboard", { headers: { "x-admin-pin": pin } });
      const d = await r.json();
      setLogs(d.logs || []);
    } catch {}
    setLoading(false);
  }, [pin]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#f1f1f1]">Recent Downloads <span className="text-[#555] font-normal">(last 50)</span></h2>
        <button onClick={load} className="text-[#717171] hover:text-[#f1f1f1] p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors">
          <RefreshCw size={15} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0,1,2,3,4].map((i) => (
            <div key={i} className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl h-12 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-8 text-center text-[#555] text-sm">
          No downloads logged yet.
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl overflow-hidden">
          <div className="divide-y divide-[#3a3a3a]">
            {logs.map((log) => (
              <div key={log.id} className="px-4 py-3 flex items-center gap-3 hover:bg-[#212121] transition-colors">
                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                  log.platform === "youtube" ? "bg-[#2a1a1a] text-[#ff6b6b]" : "bg-[#1a1a2a] text-[#e1306c]"
                }`}>
                  {log.platform === "youtube" ? "YT" : "IG"}
                </span>
                <span className="text-xs text-[#555] flex-shrink-0 capitalize">{log.media_type || "—"}</span>
                <span className="text-xs text-[#717171] flex-1 truncate font-mono">{log.url}</span>
                <span className="text-xs text-[#555] flex-shrink-0">{timeAgo(log.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Feedback Tab ─────────────────────────────────────────────────────────────

interface FeedbackEntry {
  id: number;
  name: string;
  email: string;
  rating: number;
  message: string;
  created_at: string;
}

function FeedbackTab({ pin }: { pin: string }) {
  const [items, setItems] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/feedback", { headers: { "x-admin-pin": pin } });
      const d = await r.json();
      setItems(d.feedbacks || []);
    } catch {}
    setLoading(false);
  }, [pin]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: number) => {
    if (!confirm("Delete this feedback?")) return;
    await fetch("/api/admin/feedback", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.filter((f) => f.id !== id));
  };

  const avg = items.length ? (items.reduce((s, f) => s + f.rating, 0) / items.length).toFixed(1) : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#f1f1f1]">
            User Feedback <span className="text-[#555] font-normal">({items.length})</span>
          </h2>
          {items.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Star size={13} fill="#ff0000" stroke="#ff0000" />
              <span className="text-sm font-bold text-[#f1f1f1]">{avg}</span>
              <span className="text-xs text-[#555]">avg rating</span>
            </div>
          )}
        </div>
        <button onClick={load} className="text-[#717171] hover:text-[#f1f1f1] p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors">
          <RefreshCw size={15} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-10 text-center text-[#555] text-sm">
          No feedback yet. Check back after users submit the form.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((f) => (
            <div key={f.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="text-sm font-semibold text-[#f1f1f1]">{f.name}</span>
                    {f.email && (
                      <span className="text-xs text-[#555] font-mono truncate max-w-[200px]">{f.email}</span>
                    )}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          fill={f.rating >= s ? "#ff0000" : "none"}
                          stroke={f.rating >= s ? "#ff0000" : "#3a3a3a"}
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-[#555]">{timeAgo(f.created_at)}</span>
                  </div>
                  <p className="text-sm text-[#aaa] leading-relaxed whitespace-pre-wrap">{f.message}</p>
                </div>
                <button
                  onClick={() => remove(f.id)}
                  className="flex-shrink-0 p-1.5 text-[#555] hover:text-[#ff6b6b] rounded hover:bg-[#2a2a2a] transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ───────────────────────────────────────────────────────────

type AdminTab = "overview" | "keys" | "logs" | "feedback";

export default function AdminPage() {
  const [pin, setPin] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("admin_pin");
    if (stored) setPin(stored);
  }, []);

  const loadDashboard = useCallback(async (p: string) => {
    try {
      const r = await fetch("/api/admin/dashboard", { headers: { "x-admin-pin": p } });
      if (r.ok) {
        const d = await r.json();
        setStats(d.stats);
        setKeys(d.keys || []);
      } else {
        sessionStorage.removeItem("admin_pin");
        setPin(null);
      }
    } catch {}
  }, []);

  useEffect(() => { if (pin) loadDashboard(pin); }, [pin, loadDashboard]);

  const logout = () => { sessionStorage.removeItem("admin_pin"); setPin(null); };

  if (!pin) return <PinGate onAuth={(p) => setPin(p)} />;

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview",  label: "Overview", icon: <BarChart2 size={15} /> },
    { id: "keys",      label: "API Keys", icon: <Key size={15} /> },
    { id: "logs",      label: "Logs",     icon: <List size={15} /> },
    { id: "feedback",  label: "Feedback", icon: <MessageSquare size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <header className="border-b border-[#3a3a3a] bg-[#0f0f0f] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* ── Logo: same as home page ── */}
            <a href="/" className="w-7 h-7 rounded-lg flex items-center justify-center">
              <img src="/logo.svg" alt="Clypso" className="w-6 h-6" />
            </a>
            <span className="text-sm text-[#717171]">/</span>
            <span className="text-sm font-semibold text-[#f1f1f1]">Admin</span>
          </div>
          <button
            onClick={logout}
            className="text-[#717171] hover:text-[#f1f1f1] flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-1 bg-[#1a1a1a] rounded-xl p-1 mb-8 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-[#2a2a2a] text-[#f1f1f1]"
                  : "text-[#717171] hover:text-[#aaa]"
              }`}
            >
              {t.icon} <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {tab === "overview"  && <OverviewTab stats={stats} keys={keys} />}
        {tab === "keys"      && <KeysTab pin={pin} />}
        {tab === "logs"      && <LogsTab pin={pin} />}
        {tab === "feedback"  && <FeedbackTab pin={pin} />}
      </main>
    </div>
  );
}