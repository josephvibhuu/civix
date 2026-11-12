"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CivixNavbar from "@/components/CivixNavbar";
import { 
  ShieldAlert, Layers, Users, Zap, CheckCircle2, XCircle, 
  Plus, Trash2, ArrowUpRight, ShieldCheck, Sparkles, RefreshCw, Key
} from "lucide-react";
import { toast } from "sonner";

interface AdminData {
  metrics: {
    totalCitizens: number;
    totalApps: number;
    activeApps: number;
    totalAuthorizations: number;
    totalAuthCodesIssued: number;
  };
  apps: any[];
  citizens: any[];
  recentAuthCodes: any[];
  banners: any[];
}

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"apps" | "citizens" | "banners" | "audit">("apps");

  // New banner modal state
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerBadge, setBannerBadge] = useState("FEATURED SPOTLIGHT");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerCtaText, setBannerCtaText] = useState("Launch Application");
  const [bannerCtaUrl, setBannerCtaUrl] = useState("");
  const [bannerAppId, setBannerAppId] = useState("");

  const fetchAdminData = () => {
    fetch("/api/admin")
      .then((r) => {
        if (r.status === 403) {
          toast.error("Forbidden: Admin access required");
          window.location.href = "/";
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d && d.metrics) setData(d);
      })
      .catch(() => toast.error("Failed to load admin data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSetAppStatus = async (appId: string, status: string) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_app_status", appId, status }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Update failed");
      toast.success(`App status set to ${status}`);
      fetchAdminData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleToggleFeature = async (appId: string, currentFeatured: boolean) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_app_feature", appId, featured: !currentFeatured }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Update failed");
      toast.success(currentFeatured ? "Unfeatured app" : "Featured app on homepage");
      fetchAdminData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSetTier = async (citizenId: string, tier: string) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_citizen_tier", citizenId, tier }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Update failed");
      toast.success(`Citizen tier updated to ${tier}`);
      fetchAdminData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_banner",
          title: bannerTitle,
          subtitle: bannerSubtitle,
          badgeText: bannerBadge,
          bannerUrl,
          ctaText: bannerCtaText,
          ctaUrl: bannerCtaUrl,
          appId: bannerAppId || null,
          sortOrder: 1,
          active: true,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Banner creation failed");
      toast.success("Featured banner saved!");
      setShowBannerModal(false);
      fetchAdminData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_banner", bannerId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Delete failed");
      toast.success("Banner deleted");
      fetchAdminData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans">
        <CivixNavbar />
        <main className="mx-auto max-w-6xl px-4 py-16 flex-1 w-full animate-pulse space-y-6">
          <div className="h-28 bg-zinc-900 rounded-3xl" />
          <div className="h-96 bg-zinc-900 rounded-3xl" />
        </main>
      </div>
    );
  }

  if (!data) return null;
  const { metrics, apps, citizens, recentAuthCodes, banners } = data;

  return (
    <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <CivixNavbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-950/60 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-xs font-semibold text-amber-400 mb-2">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Sovereign Executive Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              CIVIX Realm Administration
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Platform governance, app verification, spotlight banners, and OAuth auditing.
            </p>
          </div>

          <button
            onClick={fetchAdminData}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-black/60 px-4 py-2 text-xs font-semibold text-zinc-200 hover:border-cyan-400 hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
            <span>Refresh Metrics</span>
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="rounded-2xl border border-zinc-800 bg-[#0c121e]/80 p-4">
            <span className="text-[11px] text-zinc-400 block mb-1">Total Citizens</span>
            <span className="text-xl font-bold text-white tabular">{metrics.totalCitizens}</span>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#0c121e]/80 p-4">
            <span className="text-[11px] text-zinc-400 block mb-1">Active Apps</span>
            <span className="text-xl font-bold text-cyan-400 tabular">
              {metrics.activeApps} <span className="text-xs text-zinc-500 font-normal">/ {metrics.totalApps}</span>
            </span>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#0c121e]/80 p-4">
            <span className="text-[11px] text-zinc-400 block mb-1">SSO Authorizations</span>
            <span className="text-xl font-bold text-emerald-400 tabular">{metrics.totalAuthorizations}</span>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#0c121e]/80 p-4">
            <span className="text-[11px] text-zinc-400 block mb-1">Auth Codes Minted</span>
            <span className="text-xl font-bold text-indigo-400 tabular">{metrics.totalAuthCodesIssued}</span>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#0c121e]/80 p-4 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-zinc-400 block mb-1">Platform Fee</span>
            <span className="text-xl font-bold text-emerald-300">0% <span className="text-xs text-zinc-500 font-normal">(Free)</span></span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          {[
            { id: "apps" as const, label: `Applications (${apps.length})` },
            { id: "citizens" as const, label: `Citizens (${citizens.length})` },
            { id: "banners" as const, label: `Spotlight Banners (${banners.length})` },
            { id: "audit" as const, label: `OAuth Audit (${recentAuthCodes.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === t.id
                  ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/25"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: APPS MANAGEMENT */}
        {activeTab === "apps" && (
          <div className="rounded-2xl border border-zinc-800 bg-[#0c121e]/80 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 bg-black/40 text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
                  <tr>
                    <th className="p-3.5">App Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Owner</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Spotlight</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {apps.map((app) => (
                    <tr key={app.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{app.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{app.slug}</div>
                      </td>
                      <td className="p-3.5 capitalize font-mono text-cyan-300">{app.category}</td>
                      <td className="p-3.5 font-semibold text-zinc-300">@{app.owner_name}</td>
                      <td className="p-3.5">
                        <select
                          value={app.status}
                          onChange={(e) => handleSetAppStatus(app.id, e.target.value)}
                          className="rounded-lg border border-zinc-700 bg-black px-2 py-1 text-[11px] text-zinc-200"
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleFeature(app.id, Boolean(app.featured))}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase transition-colors ${
                            app.featured
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white"
                          }`}
                        >
                          {app.featured ? "Featured ✓" : "Off"}
                        </button>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <Link
                          href={`/app/${app.slug}`}
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                        >
                          <span>Store</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CITIZENS MANAGEMENT */}
        {activeTab === "citizens" && (
          <div className="rounded-2xl border border-zinc-800 bg-[#0c121e]/80 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 bg-black/40 text-[11px] uppercase tracking-wider text-zinc-400 font-mono">
                  <tr>
                    <th className="p-3.5">Citizen</th>
                    <th className="p-3.5">Game Profile ID</th>
                    <th className="p-3.5">Verification Tier</th>
                    <th className="p-3.5">Referral Code</th>
                    <th className="p-3.5">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {citizens.map((c) => (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{c.current_username}</span>
                          {c.is_admin === 1 && (
                            <span className="rounded bg-amber-500/20 text-amber-400 text-[9px] px-1 font-bold">ADMIN</span>
                          )}
                        </div>
                        {c.email && <div className="text-[10px] text-zinc-500">{c.email}</div>}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-zinc-400">{c.game_profile_id}</td>
                      <td className="p-3.5">
                        <select
                          value={c.verification_tier || "tier_1_citizen"}
                          onChange={(e) => handleSetTier(c.id, e.target.value)}
                          className="rounded-lg border border-zinc-700 bg-black px-2 py-1 text-[11px] text-zinc-200"
                        >
                          <option value="tier_1_citizen">Citizen (KYC-1)</option>
                          <option value="tier_2_bank_verified">Bank Verified (KYC-2)</option>
                          <option value="tier_3_sovereign">Sovereign (KYC-3)</option>
                        </select>
                      </td>
                      <td className="p-3.5 font-mono text-cyan-300">{c.referral_code || "—"}</td>
                      <td className="p-3.5 text-zinc-500 font-mono text-[11px]">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SPOTLIGHT BANNERS */}
        {activeTab === "banners" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-zinc-400">
                Manage the PlayStation Store-style hero banners displayed at the top of the homepage.
              </p>
              <button
                onClick={() => setShowBannerModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-black hover:bg-cyan-400 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Spotlight Banner</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c121e]/80 p-5 space-y-3"
                >
                  <div
                    className="h-28 w-full rounded-xl bg-cover bg-center border border-zinc-800"
                    style={{ backgroundImage: `url(${b.banner_url})` }}
                  />
                  <div>
                    <span className="rounded bg-cyan-500/10 text-cyan-300 text-[10px] font-bold px-2 py-0.5 uppercase">
                      {b.badge_text}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">{b.title}</h4>
                    <p className="text-xs text-zinc-400 line-clamp-1">{b.subtitle}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                    <span className="text-[11px] font-mono text-zinc-500">{b.cta_url}</span>
                    <button
                      onClick={() => handleDeleteBanner(b.id)}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Banner Modal */}
            {showBannerModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="w-full max-w-lg rounded-2xl border border-cyan-950 bg-[#0a0f1d] p-6 shadow-2xl space-y-4">
                  <h3 className="text-base font-bold text-white">Create Featured Spotlight Banner</h3>
                  <form onSubmit={handleCreateBanner} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-zinc-300 mb-1">Banner Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Grow UR Gold — The Sovereign Bourse"
                        value={bannerTitle}
                        onChange={(e) => setBannerTitle(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-black p-2.5 text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-300 mb-1">Subtitle</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Audited 60% Corporate Dividends & Real-time order book"
                        value={bannerSubtitle}
                        onChange={(e) => setBannerSubtitle(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-black p-2.5 text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-300 mb-1">Image URL</label>
                      <input
                        type="url"
                        required
                        placeholder="https://images.unsplash.com/..."
                        value={bannerUrl}
                        onChange={(e) => setBannerUrl(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-black p-2.5 text-zinc-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-zinc-300 mb-1">Badge Text</label>
                        <input
                          type="text"
                          placeholder="FEATURED BOURSE"
                          value={bannerBadge}
                          onChange={(e) => setBannerBadge(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-black p-2.5 text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-300 mb-1">CTA Text</label>
                        <input
                          type="text"
                          placeholder="Launch App"
                          value={bannerCtaText}
                          onChange={(e) => setBannerCtaText(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-black p-2.5 text-zinc-100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-zinc-300 mb-1">CTA URL (Target Link)</label>
                      <input
                        type="text"
                        placeholder="/api/oauth/launch/grow-ur-gold"
                        value={bannerCtaUrl}
                        onChange={(e) => setBannerCtaUrl(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 bg-black p-2.5 text-zinc-100"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setShowBannerModal(false)}
                        className="rounded-xl border border-zinc-800 px-4 py-2 text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-cyan-500 px-4 py-2 font-bold text-black hover:bg-cyan-400"
                      >
                        Save Banner
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: OAUTH AUDIT TRAIL */}
        {activeTab === "audit" && (
          <div className="rounded-2xl border border-zinc-800 bg-[#0c121e]/80 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-zinc-800 bg-black/40 text-[10px] uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="p-3">Auth Code</th>
                    <th className="p-3">Client ID</th>
                    <th className="p-3">Scope</th>
                    <th className="p-3">Used</th>
                    <th className="p-3">Expires At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-[11px]">
                  {recentAuthCodes.map((code, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 text-cyan-300">{code.code.slice(0, 16)}...</td>
                      <td className="p-3 text-zinc-300">{code.client_id}</td>
                      <td className="p-3 text-emerald-400">{code.scope}</td>
                      <td className="p-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${code.used ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                          {code.used ? "Exchanged ✓" : "Pending"}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-500">
                        {new Date(Number(code.expires_at)).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
