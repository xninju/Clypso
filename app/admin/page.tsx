"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Key, BarChart2, List, LogOut, Plus, Trash2,
  Edit3, Check, X, Eye, EyeOff, RefreshCw,
  Youtube, Instagram, Globe, Download, Shield,
  ChevronUp, ChevronDown,
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

const SERVICE_META: Record<string, { name: string; host: string; color: string }> = {
  yt_api:        { name: "YT-API by ytjar",                   host: "yt-api.p.rapidapi.com",                                                     color: "bg-red-600" },
  yt_media_dl:   { name: "YouTube Media Downloader",          host: "youtube-media-downloader.p.rapidapi.com",                                   color: "bg-orange-600" },
  ytstream:      { name: "YTStream by ytjar",                 host: "ytstream-download-youtube-videos.p.rapidapi.com",                           color: "bg-yellow-600" },
  ig_downloader: { name: "Instagram Downloader (recommended)", host: "instagram-downloader-download-instagram-videos-stories1.p.rapidapi.com",   color: "bg-pink-600" },
  ig_social:     { name: "Social Media Video Downloader",     host: "social-media-video-downloader.p.rapidapi.com",                              color: "bg-purple-600" },
};

const SERVICE_OPTIONS = Object.keys(SERVICE_META);

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
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
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
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Invalid PIN");
      } else {
        sessionStorage.setItem("admin_pin", pin);
        onAuth(pin);
      }
    } catch {
      setError("Could not reach server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#ff0000] rounded-xl flex items-center justify-center mb-3">
            <Shield size={22} className="text-white" />
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
            className="w-full bg-[#212121] border border-[#3a3a3a] rounded-xl px-4 py-3 text-center text-xl tracking-widest text-[#f1f1f1] placeholder-[#555] focus:outline-none focus:border-[#ff0000]"
            autoFocus
          />
          {error && <p className="text-sm text-[#ff6b6b] text-center">{error}</p>}
          <button
            onClick={submit}
            disabled={loading || !pin}
            className="w-full bg-[#ff0000] hover:bg-[#cc0000] disabled:bg-[#3a3a3a] disabled:text-[#717171] text-white font-semibold py-3 rounded-xl transition-colors"
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

  const statCards = [
    { label: "Total Visits",         value: fmt(stats?.total_visits),  icon: <Globe size={16} className="text-[#aaa]" /> },
    { label: "YouTube Downloads",    value: fmt(stats?.yt_downloads),   icon: <Youtube size={16} className="text-[#ff0000]" /> },
    { label: "Instagram Downloads",  value: fmt(stats?.ig_downloads),   icon: <Instagram size={16} className="text-[#e1306c]" /> },
    { label: "Total Downloads",      value: fmt(total),                 icon: <Download size={16} className="text-[#aaa]" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((c) => (
          <div key={c.label} className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-[#aaa] mb-1">
              {c.icon}
              <span>{c.label}</span>
            </div>
            <div className="text-2xl font-bold text-[#f1f1f1]">{c.value}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[#aaa] uppercase tracking-wider mb-3">API Key Health</h2>
        {keys.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-6 text-center text-[#555] text-sm">
            No API keys configured. Add them in the API Keys tab.
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => {
              const meta = SERVICE_META[k.service];
              return (
                <div key={k.id} className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${k.enabled ? "bg-green-500" : "bg-[#555]"}`} />
                    <div>
                      <p className="text-sm text-[#f1f1f1]">{meta?.name || k.service}</p>
                      <p className="text-xs text-[#555]">{k.label || meta?.host || ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#717171]">
                    <span>Priority {k.priority}</span>
                    <span>{fmt(k.req_count)} requests</span>
                    <span className={k.enabled ? "text-green-400" : "text-[#555]"}>{k.enabled ? "Enabled" : "Disabled"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── API Keys Tab ─────────────────────────────────────────────────────────────

function ApiKeysTab({ pin }: { pin: string }) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [revealId, setRevealId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({ service: "yt_api", label: "", key: "", priority: "1", enabled: true });
  const [importing, setImporting] = useState(false);

  const headers = { "Content-Type": "application/json", "x-admin-pin": pin };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/keys", { headers: { "x-admin-pin": pin } });
      const d = await r.json();
      setKeys(d.keys || []);
    } catch {}
    setLoading(false);
  }, [pin]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => setForm({ service: "yt_api", label: "", key: "", priority: "1", enabled: true });

  const addKey = async () => {
    if (!form.key) return;
    setSaving(true);
    try {
      const r = await fetch("/api/admin/keys", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...form, priority: parseInt(form.priority) || 1 }),
      });
      if (r.ok) {
        await load();
        resetForm();
        setShowAdd(false);
        showToast("API key added");
      }
    } finally { setSaving(false); }
  };

  const updateKey = async (id: number, patch: Partial<ApiKey>) => {
    try {
      await fetch(`/api/admin/keys/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(patch),
      });
      await load();
      showToast("Saved");
    } catch {}
  };

  const deleteKey = async (id: number) => {
    if (!confirm("Delete this API key?")) return;
    try {
      await fetch(`/api/admin/keys/${id}`, { method: "DELETE", headers: { "x-admin-pin": pin } });
      await load();
      showToast("Deleted");
    } catch {}
  };

  const importFromEnv = async () => {
    setImporting(true);
    try {
      const r = await fetch("/api/admin/import-env", { method: "POST", headers: { "x-admin-pin": pin } });
      const d = await r.json();
      await load();
      if (d.imported?.length > 0) {
        showToast(`Imported ${d.imported.length} key(s): ${d.imported.join(", ")}`);
      } else if (d.skipped?.length > 0) {
        showToast("All env var keys already exist in DB — nothing new to import");
      } else {
        showToast("No env var keys found to import");
      }
    } catch {
      showToast("Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl px-4 py-3 text-sm text-[#f1f1f1] shadow-lg z-50">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#f1f1f1]">RapidAPI Keys</h2>
          <p className="text-xs text-[#555] mt-0.5">Lower priority number = tried first in the cascade</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="text-[#717171] hover:text-[#f1f1f1] p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors">
            <RefreshCw size={15} />
          </button>
          <button
            onClick={importFromEnv}
            disabled={importing}
            title="Copy keys from Vercel/server env vars into the database"
            className="bg-[#1a1a2a] hover:bg-[#2a2a4a] disabled:opacity-50 text-[#a0a0ff] border border-[#3a3a6a] text-sm px-3 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Download size={15} /> {importing ? "Importing…" : "Import from Env"}
          </button>
          <button
            onClick={() => { resetForm(); setShowAdd(true); setEditId(null); }}
            className="bg-[#ff0000] hover:bg-[#cc0000] text-white text-sm px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus size={15} /> Add Key
          </button>
        </div>
      </div>

      {/* Add / Edit Form */}
      {(showAdd || editId !== null) && (
        <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-[#f1f1f1]">{showAdd ? "Add API Key" : "Edit API Key"}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#717171] mb-1 block">Service</label>
              <select
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
                className="w-full bg-[#212121] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-[#f1f1f1] focus:outline-none focus:border-[#ff0000]"
              >
                {SERVICE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{SERVICE_META[s].name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#717171] mb-1 block">Label (optional)</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Free tier"
                className="w-full bg-[#212121] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-[#f1f1f1] placeholder-[#555] focus:outline-none focus:border-[#ff0000]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-[#717171] mb-1 block">RapidAPI Key</label>
              <input
                type="text"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder="Paste your x-rapidapi-key here"
                className="w-full bg-[#212121] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-[#f1f1f1] placeholder-[#555] font-mono focus:outline-none focus:border-[#ff0000]"
              />
            </div>
            <div>
              <label className="text-xs text-[#717171] mb-1 block">Priority (1 = first)</label>
              <input
                type="number"
                min={1}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full bg-[#212121] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-[#f1f1f1] focus:outline-none focus:border-[#ff0000]"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-[#aaa] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#ff0000]"
                />
                Enabled
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={showAdd ? addKey : () => {
                if (editId) updateKey(editId, { ...form, priority: parseInt(form.priority) || 1 });
                setEditId(null);
              }}
              disabled={saving || !form.key}
              className="bg-[#ff0000] hover:bg-[#cc0000] disabled:bg-[#3a3a3a] disabled:text-[#717171] text-white text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Check size={14} /> {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setShowAdd(false); setEditId(null); }}
              className="text-[#717171] hover:text-[#f1f1f1] text-sm px-4 py-2 rounded-lg hover:bg-[#2a2a2a] transition-colors flex items-center gap-2"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Keys list */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-8 text-center text-[#555] text-sm">
          No keys yet. Click "Add Key" to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => {
            const meta = SERVICE_META[k.service];
            const isEdit = editId === k.id;
            return (
              <div key={k.id} className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Priority badge */}
                  <span className="flex-shrink-0 w-6 h-6 bg-[#2a2a2a] rounded-md flex items-center justify-center text-xs font-bold text-[#aaa]">
                    {k.priority}
                  </span>

                  {/* Status dot */}
                  <button
                    onClick={() => updateKey(k.id, { enabled: !k.enabled })}
                    title={k.enabled ? "Click to disable" : "Click to enable"}
                    className={`w-3 h-3 rounded-full flex-shrink-0 transition-opacity hover:opacity-70 ${k.enabled ? "bg-green-500" : "bg-[#555]"}`}
                  />

                  {/* Service name + label */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#f1f1f1] truncate">
                      {meta?.name || k.service}
                      {k.label && <span className="ml-2 text-xs text-[#717171]">· {k.label}</span>}
                    </p>
                    <p className="text-xs text-mono text-[#555] truncate">
                      {revealId === k.id ? k.key : mask(k.key)}
                    </p>
                  </div>

                  {/* Stats */}
                  <span className="text-xs text-[#555] flex-shrink-0">{fmt(k.req_count)} req</span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setRevealId(revealId === k.id ? null : k.id)}
                      title={revealId === k.id ? "Hide key" : "Show key"}
                      className="p-1.5 text-[#555] hover:text-[#aaa] rounded-lg hover:bg-[#2a2a2a] transition-colors"
                    >
                      {revealId === k.id ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() => {
                        setEditId(k.id);
                        setShowAdd(false);
                        setForm({
                          service: k.service,
                          label: k.label,
                          key: k.key,
                          priority: String(k.priority),
                          enabled: k.enabled,
                        });
                      }}
                      className="p-1.5 text-[#555] hover:text-[#aaa] rounded-lg hover:bg-[#2a2a2a] transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteKey(k.id)}
                      className="p-1.5 text-[#555] hover:text-[#ff6b6b] rounded-lg hover:bg-[#2a2a2a] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => updateKey(k.id, { priority: Math.max(1, k.priority - 1) })}
                      className="p-1.5 text-[#555] hover:text-[#aaa] rounded-lg hover:bg-[#2a2a2a] transition-colors"
                      title="Increase priority"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => updateKey(k.id, { priority: k.priority + 1 })}
                      className="p-1.5 text-[#555] hover:text-[#aaa] rounded-lg hover:bg-[#2a2a2a] transition-colors"
                      title="Decrease priority"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Guide */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-xs text-[#555] space-y-1">
        <p className="text-[#717171] font-medium mb-1">RapidAPI Setup</p>
        <p>1. Sign up free at <span className="text-[#aaa]">rapidapi.com</span></p>
        <p>2. Subscribe to each API (all have free tiers)</p>
        <p>3. Your single <span className="text-[#aaa]">x-rapidapi-key</span> works for all three services</p>
        <div className="mt-2 space-y-0.5">
          {SERVICE_OPTIONS.map((s) => (
            <p key={s}>• <span className="text-[#aaa]">{SERVICE_META[s].name}</span> — {SERVICE_META[s].host}</p>
          ))}
        </div>
        <p className="mt-2">Also set <span className="text-[#aaa]">PROXY_URL</span> env var if you want yt-dlp to route through Cloudflare WARP or any SOCKS5/HTTP proxy.</p>
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

// ─── Main Admin Page ───────────────────────────────────────────────────────────

type AdminTab = "overview" | "keys" | "logs";

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

  useEffect(() => {
    if (pin) loadDashboard(pin);
  }, [pin, loadDashboard]);

  const logout = () => {
    sessionStorage.removeItem("admin_pin");
    setPin(null);
  };

  if (!pin) {
    return <PinGate onAuth={(p) => setPin(p)} />;
  }

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview",  icon: <BarChart2 size={15} /> },
    { id: "keys",     label: "API Keys",  icon: <Key size={15} /> },
    { id: "logs",     label: "Logs",      icon: <List size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="border-b border-[#3a3a3a] bg-[#0f0f0f] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="w-7 h-7 bg-[#ff0000] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#1a1a1a] border border-[#3a3a3a] rounded-xl p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-[#2a2a2a] text-[#f1f1f1]"
                  : "text-[#717171] hover:text-[#aaa]"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && <OverviewTab stats={stats} keys={keys} />}
        {tab === "keys"     && <ApiKeysTab pin={pin} />}
        {tab === "logs"     && <LogsTab pin={pin} />}
      </main>
    </div>
  );
}
