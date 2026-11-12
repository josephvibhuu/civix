"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CivixNavbar from "@/components/CivixNavbar";
import { 
  Shield, User, Zap, Users, Copy, Check, ExternalLink, 
  Trash2, RotateCcw, Clock, Lock, Sparkles, RefreshCw, AlertCircle, ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface DashboardData {
  citizen: {
    id: string;
    currentUsername: string;
    gameProfileId: string;
    email?: string;
    discordId?: string;
    verificationTier: string;
    referralCode?: string;
    isAdmin: boolean;
    createdAt: string;
  };
  authorizedApps: {
    id: string;
    name: string;
    slug: string;
    tagline: string;
    category: string;
    appUrl: string;
    ownerName: string;
    scopes: string[];
    revoked: boolean;
    connectedAt: string;
  }[];
  nameHistory: {
    previousName: string;
    updatedName: string;
    syncedAt: string;
  }[];
  securityLogs: {
    id: string;
    eventType: string;
    details: string | null;
    appName: string | null;
    createdAt: string;
  }[];
  referrals: {
    username: string;
    joinedAt: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [syncingName, setSyncingName] = useState(false);
  const [newHandle, setNewHandle] = useState("");
  const [showSyncModal, setShowSyncModal] = useState(false);

  const fetchDashboard = () => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.citizen) {
          setData(d);
        } else {
          window.location.href = "/login?return_to=/dashboard";
        }
      })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const copyReferral = (code: string) => {
    const url = `${window.location.origin}/r/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Universal Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async (appId: string) => {
    try {
      const res = await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", appId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to revoke");
      toast.success("Application authorization revoked");
      fetchDashboard();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRestore = async (appId: string) => {
    try {
      const res = await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", appId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to restore");
      toast.success("Application authorization restored");
      fetchDashboard();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans">
        <CivixNavbar />
        <main className="mx-auto max-w-6xl px-4 py-16 flex-1 w-full animate-pulse space-y-6">
          <div className="h-40 bg-zinc-900 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-zinc-900 rounded-2xl" />
            <div className="h-64 bg-zinc-900 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;
  const { citizen, authorizedApps, nameHistory, securityLogs, referrals } = data;
  const activeApps = authorizedApps.filter((a) => !a.revoked);

  return (
    <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <CivixNavbar />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-8">
        {/* Passport Identity Card */}
        <section className="relative overflow-hidden rounded-3xl border border-cyan-950/70 bg-gradient-to-r from-[#0a1020] via-[#091224] to-[#0c162e] p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 h-full w-1/3 bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-600 text-2xl sm:text-3xl font-black text-black shadow-lg shadow-cyan-500/30">
                {citizen.currentUsername[0]?.toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    {citizen.currentUsername}
                  </h1>
                  <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                    {citizen.verificationTier === "tier_3_sovereign"
                      ? "Sovereign"
                      : citizen.verificationTier === "tier_2_bank_verified"
                      ? "Bank Verified"
                      : "Verified Citizen"}
                  </span>
                  {citizen.isAdmin && (
                    <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                </div>

                <p className="text-xs font-mono text-zinc-400">
                  Game ID: <span className="text-cyan-300">{citizen.gameProfileId}</span>
                </p>

                <p className="text-[11px] text-zinc-500">
                  Citizen since {new Date(citizen.createdAt).toLocaleDateString()} · Permanent sybil-resistant anchor
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {citizen.referralCode && (
                <button
                  onClick={() => copyReferral(citizen.referralCode!)}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-black/60 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:border-cyan-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-cyan-400" />}
                  <span>Ref: {citizen.referralCode}</span>
                </button>
              )}

              <Link
                href="/referrals"
                className="flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2 text-xs font-bold text-sky-300 hover:bg-sky-500/20 transition-colors"
              >
                <Users className="h-3.5 w-3.5" />
                <span>Referral Hub</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 1-Click Launch Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-400 fill-cyan-400" />
              1-Click Connected Applications
              <span className="text-xs text-zinc-500 font-normal">({activeApps.length})</span>
            </h2>
            <Link
              href="/"
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Explore Store</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {activeApps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-[#0c121e]/40 p-8 text-center space-y-2">
              <Zap className="h-8 w-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-300 font-semibold">No applications authorized yet</p>
              <p className="text-[11px] text-zinc-500">
                Launch any app from the Store to link it with 1-click single sign-on.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {activeApps.map((app) => (
                <div
                  key={app.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-[#0c121e]/80 p-5 shadow-xl hover:border-cyan-500/50 hover:bg-[#0f172a] transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[9px] font-bold text-cyan-300 uppercase">
                        {app.category}
                      </span>
                      <button
                        onClick={() => handleRevoke(app.id)}
                        className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
                        title="Revoke SSO access"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Revoke</span>
                      </button>
                    </div>

                    <Link href={`/app/${app.slug}`}>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {app.name}
                      </h3>
                    </Link>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {app.tagline}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {app.scopes.map((s) => (
                        <span key={s} className="rounded bg-black/60 border border-zinc-800 px-1.5 py-0.5 text-[9px] font-mono text-zinc-400">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800/80 mt-4">
                    <a
                      href={`/api/oauth/launch/${app.slug}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 py-2.5 text-xs font-bold text-black shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all"
                    >
                      <Zap className="h-3.5 w-3.5 fill-black stroke-black" />
                      <span>1-Click Launch</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Revoked Applications (if any) */}
        {authorizedApps.some((a) => a.revoked) && (
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Revoked Authorizations
            </h3>
            <div className="space-y-2">
              {authorizedApps.filter((a) => a.revoked).map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-black/30 p-3 text-xs text-zinc-400"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-300">{app.name}</span>
                    <span className="rounded bg-red-500/10 text-red-400 px-2 py-0.5 text-[10px]">Access Revoked</span>
                  </div>
                  <button
                    onClick={() => handleRestore(app.id)}
                    className="flex items-center gap-1 text-cyan-400 hover:underline text-xs"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Restore Access</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Security Logs & Name History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Security Activity */}
          <div className="rounded-2xl border border-zinc-800/80 bg-[#0c121e]/80 p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="h-4 w-4 text-cyan-400" />
              Sovereign Security Audit Trail
            </h3>

            {securityLogs.length === 0 ? (
              <p className="text-xs text-zinc-500">No activity logged yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {securityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-zinc-800/80 bg-black/40 p-2.5 text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-200 capitalize">
                        {log.eventType.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-[11px] text-zinc-400 leading-snug">{log.details}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Name Sync History */}
          <div className="rounded-2xl border border-zinc-800/80 bg-[#0c121e]/80 p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-emerald-400" />
              Character Name Sync History
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed">
              When you rename your character in Parlamentum, your history stays synced without losing balances:
            </p>

            {nameHistory.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-500">
                No name changes recorded. Your identity matches your original registration.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {nameHistory.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/40 p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 line-through">{h.previousName}</span>
                      <ArrowRight className="h-3 w-3 text-cyan-400" />
                      <span className="font-bold text-cyan-300">{h.updatedName}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(h.syncedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
