"use client";

import { useEffect, useState, useMemo } from "react";
import CivixNavbar from "@/components/CivixNavbar";
import AppCard, { AppItem } from "@/components/AppCard";
import FeaturedBanner from "@/components/store/FeaturedBanner";
import QuickLaunchDock from "@/components/store/QuickLaunchDock";
import { 
  Search, Sparkles, Layers, ShieldCheck, Users, ArrowRight, 
  CheckCircle2, Lock, TrendingUp, Swords, Dices, Landmark, Zap, Smartphone
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { id: "all", label: "All Apps", icon: Layers },
  { id: "finance", label: "Finance & Bourses", icon: TrendingUp },
  { id: "gaming", label: "Gladiator & PVP", icon: Swords },
  { id: "casino", label: "Casinos & Parlors", icon: Dices },
  { id: "utility", label: "Banking & Tools", icon: Landmark },
];

export default function HomePage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/apps")
      .then((r) => r.json())
      .then((data) => {
        if (data.apps) setApps(data.apps);
      })
      .catch((err) => console.error("Failed to fetch apps", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesCategory = selectedCategory === "all" || app.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [apps, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <CivixNavbar apps={apps} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-8">
        {/* Hero Spotlight Carousel (PlayStation Store Style) */}
        <section>
          <FeaturedBanner />
        </section>

        {/* Pocket Device Teaser Strip */}
        <section>
          <Link
            href="/device"
            className="group flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-[#0a1224] to-[#070d1a] p-4 px-6 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/15 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 text-black shadow-md shadow-cyan-500/30 group-hover:scale-105 transition-transform">
                <Smartphone className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white group-hover:text-cyan-300 transition-colors">
                    The CIVIX Pocket Device
                  </span>
                  <span className="rounded-full bg-cyan-400/20 border border-cyan-400/50 px-2 py-0.2 text-[9px] font-black text-cyan-300 uppercase tracking-widest">
                    NEW FEATURE
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Phone & expand-mode shell with live edicts, 1-click sandbox, and notification dock.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:text-cyan-300 shrink-0">
              <span>Open Pocket Device</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </section>

        {/* 1-Click Quick Launch Dock (For Logged-in Citizens) */}
        <section>
          <QuickLaunchDock />
        </section>

        {/* Ecosystem Trust & Features Strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2">
          <div className="flex items-center gap-2.5 rounded-2xl border border-cyan-950/60 bg-[#090e1a]/60 p-3 sm:p-4 backdrop-blur-md">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Zap className="h-4 w-4 fill-cyan-400 stroke-cyan-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">1-Click Universal SSO</span>
              <span className="text-[11px] text-zinc-400">Zero duplicate passwords</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-cyan-950/60 bg-[#090e1a]/60 p-3 sm:p-4 backdrop-blur-md">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Character Sync</span>
              <span className="text-[11px] text-zinc-400">Never lose accounts on rename</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-cyan-950/60 bg-[#090e1a]/60 p-3 sm:p-4 backdrop-blur-md">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Universal Referrals</span>
              <span className="text-[11px] text-zinc-400">Cross-app commission rails</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-cyan-950/60 bg-[#090e1a]/60 p-3 sm:p-4 backdrop-blur-md">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">0% Platform Cut</span>
              <span className="text-[11px] text-zinc-400">100% Free Public Protocol</span>
            </div>
          </div>
        </section>

        {/* Store Directory & Filter Controls */}
        <section className="space-y-6 pt-2">
          {/* Header & Category Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-cyan-500 to-sky-500 text-black shadow-md shadow-cyan-500/25"
                        : "bg-[#0b101c] text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* In-page Search Bar */}
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-[#090e1a] py-2 pl-9 pr-4 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          {/* Apps Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-2xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
              ))}
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-20 rounded-3xl border border-zinc-800/80 bg-zinc-900/20 space-y-3">
              <p className="text-zinc-400 text-sm">No applications found matching "{searchQuery}".</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="text-xs text-cyan-400 hover:underline font-semibold"
              >
                Reset search filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}

              {/* Developer Invite Card */}
              <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-dashed border-cyan-800/60 bg-[#0a0f1d]/50 p-6 shadow-xl transition-all duration-300 hover:border-cyan-400/80 hover:bg-[#0c1426]">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      <Sparkles className="h-3 w-3" />
                      Open Protocol
                    </span>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      0% Cut · 100% Free
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Integrate Your App
                  </h3>
                  <p className="text-xs font-medium text-cyan-400/90 mt-0.5">
                    Casinos, prediction markets, arenas, banks & bourses
                  </p>

                  <p className="text-xs text-zinc-400 leading-relaxed mt-3">
                    Building for Parlamentum? Integrate Civix Single Sign-On in 15 minutes. 
                    We charge <strong className="text-emerald-400 font-semibold">zero fees</strong> and give you instant access to verified citizens, anti-sybil banking KYC, and cross-app referral marketing.
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 mt-4">
                  <Link
                    href="/developers"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-black transition-all"
                  >
                    <span>Developer Console & Keys</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Developer Banner */}
        <section className="rounded-3xl border border-cyan-950/60 bg-gradient-to-r from-[#090f1e] via-[#091224] to-[#0d162e] p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="max-w-2xl relative space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-0.5 text-xs font-semibold text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Sovereign Identity Protocol · 0% Cut · 100% Free</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              One Login. One Passport. Every Realm App.
            </h2>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Eliminate fragmented logins, forgotten passwords, and desynced character names. 
              Our SDK drops into Next.js, Express, Cloudflare Workers, or static HTML in under 15 minutes.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/developers"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-2.5 text-xs font-bold text-black shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all"
              >
                <span>Register Application</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/developers#sdk"
                className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-black/60 px-5 py-2.5 text-xs font-bold text-zinc-200 hover:border-zinc-500 hover:text-white transition-all"
              >
                <span>Read 15-Minute SDK Guide</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-cyan-950/40 bg-[#05070c] py-8 text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <span className="font-semibold text-zinc-300">CIVIX Sovereign Nexus</span>
            <span>· The Unified Application Store & Identity Protocol of Parlamentum</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="https://parlamentum.org" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">
              Parlamentum
            </a>
            <a href="https://growurgold.vercel.app" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">
              Grow UR Gold (GUG)
            </a>
            <Link href="/referrals" className="hover:text-zinc-300 transition-colors">
              Universal Referrals
            </Link>
            <Link href="/developers" className="hover:text-zinc-300 transition-colors">
              Developer APIs
            </Link>
            <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
              Citizen Passport
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
