"use client";

import { useEffect, useState, useMemo } from "react";
import CivixNavbar from "@/components/CivixNavbar";
import AppCard, { AppItem } from "@/components/AppCard";
import { Search, Sparkles, Layers, ShieldCheck, Users, ArrowRight, CheckCircle2, Lock, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { id: "all", label: "All Apps" },
  { id: "finance", label: "Finance & Bourses" },
  { id: "gaming", label: "Gladiator & PVP" },
  { id: "casino", label: "Casinos & Parlors" },
  { id: "utility", label: "Banking & Tools" },
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
      <CivixNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-cyan-950/40 bg-gradient-to-b from-[#080d1a] via-[#06080e] to-[#06080e] py-16 sm:py-24">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-gradient-to-r from-cyan-500/10 via-sky-500/15 to-indigo-600/15 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-xs font-semibold text-cyan-300 shadow-sm mb-6">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>The Universal Application Nexus of Parlamentum</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            One Sovereign Identity. <br />
            <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
              Every App in the Realm.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-zinc-400 leading-relaxed">
            The central login portal and discovery hub for Parlamentum web applications. 
            Sign into stock exchanges, prediction markets, arenas, and banks with a single master passport — never lose accounts or balances when renaming your in-game character.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-cyan-500/70" />
              <input
                type="text"
                placeholder="Search verified applications and hubs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-cyan-900/50 bg-[#0c121e]/90 py-3.5 pl-12 pr-4 text-sm text-zinc-100 placeholder-zinc-500 shadow-2xl backdrop-blur-md outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>
          </div>

          {/* Feature Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
              <span>Universal SSO (OAuth 2.0)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
              <span>In-Game Name Desync Protection</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
              <span>Zero-Admin Notary Password Reset</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
              <span>Universal Cross-App Referrals</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main App Directory */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        {/* Category Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-zinc-800/80 pb-5 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/25"
                    : "bg-[#0c111c] text-zinc-400 border border-zinc-800 hover:border-cyan-800 hover:text-zinc-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-zinc-500">
            Showing <span className="font-semibold text-cyan-300">{filteredApps.length}</span> verified app
          </div>
        </div>

        {/* Apps Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-zinc-800/80 bg-zinc-900/20">
            <p className="text-zinc-400 text-sm">No applications found matching "{searchQuery}".</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-3 text-xs text-cyan-400 hover:underline"
            >
              Reset search filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}

            {/* Invite Developers Card */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-dashed border-cyan-800/60 bg-[#0b101c]/50 p-6 shadow-xl transition-all duration-300 hover:border-cyan-400/80 hover:bg-[#0d1424]">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                    <Sparkles className="h-3 w-3" />
                    Open Integration
                  </span>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    0% Cut · 100% Free
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white flex items-center justify-between">
                  Integrate Your App
                </h3>
                <p className="text-xs font-medium text-cyan-400/90 mt-0.5">
                  Casinos, prediction markets, arenas, banks & bots
                </p>

                <p className="text-xs text-zinc-400 leading-relaxed mt-3">
                  Building for Parlamentum? Integrate Civix Single Sign-On in 15 minutes. 
                  We take <strong className="text-emerald-400 font-semibold">0% of your revenue</strong> and provide instant access to verified citizens, in-game name sync, and universal cross-app referrals.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 mt-4">
                <Link
                  href="/developers"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-black transition-all"
                >
                  <span>Register App in Developer Console</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Developer Integration Section */}
        <section className="mt-20 rounded-3xl border border-cyan-950/60 bg-gradient-to-r from-[#0a0f1d] via-[#090d19] to-[#0d1428] p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />

          <div className="max-w-2xl relative">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-0.5 text-xs font-semibold text-cyan-300 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Public Infrastructure · 0% Cut · 100% Free</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              Unify Your App with the Realm. Zero Fees.
            </h2>

            <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              We charge nothing and take zero percentage of your revenue. 
              Our mission is to eliminate fragmented logins and lost character accounts across Parlamentum. 
              Drop in the <code className="text-cyan-300 font-mono">@civix/sdk</code> for instant Single Sign-On, in-game name synchronization, and universal referral commissions.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/developers"
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-black shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 transition-all"
              >
                <span>Developer Console & Keys</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/developers#sdk"
                className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-5 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition-all"
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
            <span>· The Unified Identity Protocol of Parlamentum</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://parlamentum.org" target="_blank" rel="noreferrer" className="hover:text-zinc-300">
              Parlamentum
            </a>
            <a href="https://growurgold.vercel.app" target="_blank" rel="noreferrer" className="hover:text-zinc-300">
              Grow UR Gold (GUG)
            </a>
            <Link href="/referrals" className="hover:text-zinc-300">
              Universal Referrals
            </Link>
            <Link href="/developers" className="hover:text-zinc-300">
              Developer APIs
            </Link>
            <Link href="/login" className="hover:text-zinc-300">
              Civix ID
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
