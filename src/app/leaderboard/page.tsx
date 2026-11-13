"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import CivixNavbar from "@/components/CivixNavbar";
import { 
  Trophy, Medal, Users, Shield, Zap, TrendingUp, Search, 
  Crown, Sparkles, ArrowRight, CheckCircle2, ChevronRight, Award
} from "lucide-react";

interface Recruiter {
  rank: number;
  id: string;
  username: string;
  gameProfileId: string;
  tier: string;
  referralCount: number;
  createdAt: string;
}

interface SovereignCitizen {
  rank: number;
  id: string;
  username: string;
  gameProfileId: string;
  tier: string;
  authorizedAppsCount: number;
  createdAt: string;
}

interface TopApp {
  rank: number;
  id: string;
  name: string;
  slug: string;
  tagline: string;
  category: string;
  connectedCitizensCount: number;
  activeUsersEstimate: number;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"recruiters" | "citizens" | "apps">("recruiters");
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [citizens, setCitizens] = useState<SovereignCitizen[]>([]);
  const [apps, setApps] = useState<TopApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.leaderboard) {
          setRecruiters(data.leaderboard.topRecruiters || []);
          setCitizens(data.leaderboard.topCitizens || []);
          setApps(data.leaderboard.topApps || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredRecruiters = useMemo(() => {
    return recruiters.filter((r) => 
      !search || r.username.toLowerCase().includes(search.toLowerCase()) || r.gameProfileId.toLowerCase().includes(search.toLowerCase())
    );
  }, [recruiters, search]);

  const filteredCitizens = useMemo(() => {
    return citizens.filter((c) => 
      !search || c.username.toLowerCase().includes(search.toLowerCase()) || c.gameProfileId.toLowerCase().includes(search.toLowerCase())
    );
  }, [citizens, search]);

  const filteredApps = useMemo(() => {
    return apps.filter((a) => 
      !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.tagline.toLowerCase().includes(search.toLowerCase())
    );
  }, [apps, search]);

  return (
    <div className="min-h-screen bg-[#05070e] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <CivixNavbar />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-cyan-900/50 bg-gradient-to-br from-[#0c1322] via-[#090e18] to-[#060910] p-6 sm:p-10 shadow-2xl">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="max-w-2xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-300 uppercase tracking-widest">
              <Crown className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>Hall of Fame & Standing</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              The Realm Economic Leaderboard
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Honoring the preeminent guild recruiters, high-standing sovereigns, and liquidity bourses fueling the persistent economy of Parlamentum.
            </p>
          </div>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0a0f1d] border border-zinc-800">
            <button
              onClick={() => setActiveTab("recruiters")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "recruiters"
                  ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Top Recruiters</span>
            </button>

            <button
              onClick={() => setActiveTab("citizens")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "citizens"
                  ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>High Sovereigns</span>
            </button>

            <button
              onClick={() => setActiveTab("apps")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === "apps"
                  ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Bourses & Apps</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter leaderboard..."
              className="w-full rounded-xl border border-zinc-800 bg-[#0a0f1d] pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-500 animate-pulse">
            Computing realm economic standing...
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. TOP RECRUITERS TAB */}
            {activeTab === "recruiters" && (
              <div className="space-y-4">
                {/* Podium Top 3 */}
                {filteredRecruiters.length >= 3 && !search && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-2">
                    {/* Rank 2 (Silver) */}
                    <div className="rounded-2xl border border-zinc-700 bg-gradient-to-b from-zinc-800/40 to-[#0a0e1a] p-5 flex flex-col items-center text-center space-y-2 order-2 md:order-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 border border-zinc-600 text-zinc-300 font-black text-lg">
                        🥈 2
                      </div>
                      <Link href={`/citizen/${encodeURIComponent(filteredRecruiters[1].username)}`} className="font-bold text-sm text-white hover:text-cyan-300 transition-colors">
                        {filteredRecruiters[1].username}
                      </Link>
                      <span className="text-[10px] font-mono text-zinc-500">{filteredRecruiters[1].gameProfileId}</span>
                      <div className="mt-2 rounded-full bg-zinc-800 px-3 py-1 text-xs font-mono font-bold text-zinc-300">
                        {filteredRecruiters[1].referralCount} Recruits
                      </div>
                    </div>

                    {/* Rank 1 (Gold Filigree) */}
                    <div className="rounded-2xl border-2 border-amber-500/60 bg-gradient-to-b from-amber-500/10 via-[#0e1628] to-[#0a0e1a] p-6 flex flex-col items-center text-center space-y-2 shadow-xl shadow-amber-500/10 order-1 md:order-2 -translate-y-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black font-black text-xl shadow-md shadow-amber-500/30">
                        👑 1
                      </div>
                      <Link href={`/citizen/${encodeURIComponent(filteredRecruiters[0].username)}`} className="font-black text-base text-amber-300 hover:text-amber-200 transition-colors">
                        {filteredRecruiters[0].username}
                      </Link>
                      <span className="text-[10px] font-mono text-zinc-400">{filteredRecruiters[0].gameProfileId}</span>
                      <div className="mt-2 rounded-full bg-amber-400/20 border border-amber-400/40 px-3.5 py-1 text-xs font-mono font-black text-amber-300">
                        {filteredRecruiters[0].referralCount} Recruits
                      </div>
                    </div>

                    {/* Rank 3 (Bronze) */}
                    <div className="rounded-2xl border border-amber-900/60 bg-gradient-to-b from-amber-950/20 to-[#0a0e1a] p-5 flex flex-col items-center text-center space-y-2 order-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-950/60 border border-amber-800 text-amber-400 font-black text-lg">
                        🥉 3
                      </div>
                      <Link href={`/citizen/${encodeURIComponent(filteredRecruiters[2].username)}`} className="font-bold text-sm text-white hover:text-cyan-300 transition-colors">
                        {filteredRecruiters[2].username}
                      </Link>
                      <span className="text-[10px] font-mono text-zinc-500">{filteredRecruiters[2].gameProfileId}</span>
                      <div className="mt-2 rounded-full bg-amber-950/60 px-3 py-1 text-xs font-mono font-bold text-amber-400">
                        {filteredRecruiters[2].referralCount} Recruits
                      </div>
                    </div>
                  </div>
                )}

                {/* Table for all */}
                <div className="rounded-2xl border border-zinc-800 bg-[#0a0f1d] overflow-hidden">
                  <div className="grid grid-cols-12 px-4 py-3 border-b border-zinc-800/80 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    <span className="col-span-2 sm:col-span-1">Rank</span>
                    <span className="col-span-6 sm:col-span-5">Citizen & Profile</span>
                    <span className="hidden sm:block sm:col-span-3">Tier Status</span>
                    <span className="col-span-4 sm:col-span-3 text-right">Referral Count</span>
                  </div>

                  <div className="divide-y divide-zinc-800/50">
                    {filteredRecruiters.map((rec) => (
                      <div
                        key={rec.id}
                        className="grid grid-cols-12 items-center px-4 py-3.5 hover:bg-white/5 transition-colors text-xs"
                      >
                        <span className="col-span-2 sm:col-span-1 font-mono font-bold text-zinc-400">
                          #{rec.rank}
                        </span>

                        <div className="col-span-6 sm:col-span-5 flex items-center gap-2.5 truncate pr-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold text-[10px]">
                            {rec.username[0]?.toUpperCase()}
                          </div>
                          <div className="truncate">
                            <Link href={`/citizen/${encodeURIComponent(rec.username)}`} className="font-semibold text-zinc-100 hover:text-cyan-300 block truncate transition-colors">
                              {rec.username}
                            </Link>
                            <span className="text-[10px] text-zinc-500 font-mono block truncate">{rec.gameProfileId}</span>
                          </div>
                        </div>

                        <div className="hidden sm:block sm:col-span-3">
                          <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                            {rec.tier === "tier_3_sovereign" ? "Sovereign" : rec.tier === "tier_2_bank_verified" ? "Bank Verified" : "Citizen"}
                          </span>
                        </div>

                        <div className="col-span-4 sm:col-span-3 text-right font-mono font-bold text-cyan-400">
                          {rec.referralCount} citizen{rec.referralCount !== 1 ? "s" : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. HIGH SOVEREIGNS TAB */}
            {activeTab === "citizens" && (
              <div className="rounded-2xl border border-zinc-800 bg-[#0a0f1d] overflow-hidden">
                <div className="grid grid-cols-12 px-4 py-3 border-b border-zinc-800/80 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  <span className="col-span-2 sm:col-span-1">Rank</span>
                  <span className="col-span-6 sm:col-span-5">Citizen & Profile</span>
                  <span className="hidden sm:block sm:col-span-3">KYC Verification Tier</span>
                  <span className="col-span-4 sm:col-span-3 text-right">Connected Apps</span>
                </div>

                <div className="divide-y divide-zinc-800/50">
                  {filteredCitizens.map((cit) => (
                    <div
                      key={cit.id}
                      className="grid grid-cols-12 items-center px-4 py-3.5 hover:bg-white/5 transition-colors text-xs"
                    >
                      <span className="col-span-2 sm:col-span-1 font-mono font-bold text-zinc-400">
                        #{cit.rank}
                      </span>

                      <div className="col-span-6 sm:col-span-5 flex items-center gap-2.5 truncate pr-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700 text-cyan-400 font-bold text-[10px]">
                          {cit.username[0]?.toUpperCase()}
                        </div>
                        <div className="truncate">
                          <Link href={`/citizen/${encodeURIComponent(cit.username)}`} className="font-semibold text-zinc-100 hover:text-cyan-300 block truncate transition-colors">
                            {cit.username}
                          </Link>
                          <span className="text-[10px] text-zinc-500 font-mono block truncate">{cit.gameProfileId}</span>
                        </div>
                      </div>

                      <div className="hidden sm:block sm:col-span-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          cit.tier === "tier_3_sovereign"
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                            : cit.tier === "tier_2_bank_verified"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-zinc-800 border-zinc-700 text-zinc-400"
                        }`}>
                          <CheckCircle2 className="h-3 w-3" />
                          {cit.tier === "tier_3_sovereign" ? "Sovereign Elite" : cit.tier === "tier_2_bank_verified" ? "Bank Verified" : "Registered Citizen"}
                        </span>
                      </div>

                      <div className="col-span-4 sm:col-span-3 text-right font-mono font-bold text-cyan-400">
                        {cit.authorizedAppsCount} app{cit.authorizedAppsCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. BOURSES & APPS TAB */}
            {activeTab === "apps" && (
              <div className="rounded-2xl border border-zinc-800 bg-[#0a0f1d] overflow-hidden">
                <div className="grid grid-cols-12 px-4 py-3 border-b border-zinc-800/80 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  <span className="col-span-2 sm:col-span-1">Rank</span>
                  <span className="col-span-6 sm:col-span-5">Application & Bourse</span>
                  <span className="hidden sm:block sm:col-span-3">Category</span>
                  <span className="col-span-4 sm:col-span-3 text-right">Citizens Authorized</span>
                </div>

                <div className="divide-y divide-zinc-800/50">
                  {filteredApps.map((app) => (
                    <div
                      key={app.id}
                      className="grid grid-cols-12 items-center px-4 py-3.5 hover:bg-white/5 transition-colors text-xs"
                    >
                      <span className="col-span-2 sm:col-span-1 font-mono font-bold text-zinc-400">
                        #{app.rank}
                      </span>

                      <div className="col-span-6 sm:col-span-5 flex items-center gap-2.5 truncate pr-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold text-[10px]">
                          {app.name.slice(0, 2)}
                        </div>
                        <div className="truncate">
                          <Link href={`/app/${app.slug}`} className="font-semibold text-zinc-100 hover:text-cyan-300 block truncate">
                            {app.name}
                          </Link>
                          <span className="text-[10px] text-zinc-500 block truncate">{app.tagline}</span>
                        </div>
                      </div>

                      <div className="hidden sm:block sm:col-span-3">
                        <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400 capitalize">
                          {app.category}
                        </span>
                      </div>

                      <div className="col-span-4 sm:col-span-3 text-right flex items-center justify-end gap-2">
                        <span className="font-mono font-bold text-cyan-400">
                          {app.connectedCitizensCount} citizen{app.connectedCitizensCount !== 1 ? "s" : ""}
                        </span>
                        <Link
                          href={`/api/oauth/launch/${app.slug}`}
                          className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 p-1.5 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-colors"
                          title="1-Click Launch"
                        >
                          <Zap className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
