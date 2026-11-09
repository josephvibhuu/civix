"use client";

import { useEffect, useState, useMemo } from "react";
import CivixNavbar from "@/components/CivixNavbar";
import AppCard, { AppItem } from "@/components/AppCard";
import { Search, Sparkles, Shield, KeyRound, Cpu, Layers, ExternalLink, ArrowRight, CheckCircle2 } from "lucide-react";
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
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      <CivixNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-800/80 bg-gradient-to-b from-zinc-950 via-[#0a0d14] to-[#07090e] py-16 sm:py-24">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-amber-600/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300 shadow-sm mb-6">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>The Unified Application Portal of Parlamentum</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            One Citizen Identity. <br />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              Every App in the Realm.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-zinc-400 leading-relaxed">
            Discover sovereign stock exchanges, prediction markets, gladiator arenas, and backroom casinos. 
            Sign into every experience with your single Civix ID — never lose balances or accounts when changing your in-game name.
          </p>

          {/* Search Bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search Grow UR Gold, Prediction Market, Colosseo, Casino..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-700/80 bg-zinc-900/90 py-3.5 pl-12 pr-4 text-sm text-zinc-100 placeholder-zinc-500 shadow-2xl backdrop-blur-md outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Feature Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Universal SSO (OAuth 2.0)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>In-Game Name Desync Protection</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Zero-Admin Notary Password Reset</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Banking-Grade KYC & Anti-Sybil</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main App Directory */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        {/* Category Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-zinc-800 pb-5 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-amber-500 text-zinc-950 shadow-sm shadow-amber-500/20"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-zinc-500">
            Showing <span className="font-semibold text-zinc-300">{filteredApps.length}</span> verified apps
          </div>
        </div>

        {/* Apps Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-20 rounded-xl border border-zinc-800/80 bg-zinc-900/20">
            <p className="text-zinc-400 text-sm">No applications found matching "{searchQuery}".</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-3 text-xs text-amber-400 hover:underline"
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
            <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 p-5 shadow-lg transition-all duration-300 hover:border-sky-500/50 hover:bg-zinc-900/60">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
                    <Sparkles className="h-3 w-3" />
                    Open Call
                  </span>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    0% Cut · 100% Free
                  </span>
                </div>

                <h3 className="text-lg font-bold text-zinc-100 flex items-center justify-between">
                  Your Application Here
                </h3>
                <p className="text-xs font-medium text-sky-400/90 mt-0.5">
                  Casinos, prediction markets, arenas, banks & bots
                </p>

                <p className="text-xs text-zinc-400 leading-relaxed mt-2.5">
                  Building an experience for Parlamentum? Integrate Civix ID in 15 minutes. We take <strong className="text-emerald-400 font-semibold">zero cut from your revenue</strong> and provide free single sign-on, identity desync protection, and player cloud storage.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 mt-4">
                <Link
                  href="/developers"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500/10 px-4 py-2 text-xs font-bold text-sky-300 border border-sky-500/30 hover:bg-sky-500 hover:text-black transition-all"
                >
                  <span>Integrate Your App (Free)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Developer Integration Section */}
        <section className="mt-20 rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-[#0e1422] p-8 sm:p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />

          <div className="max-w-2xl relative">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-400 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>100% Free Public Infrastructure · 0% Cut</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Building a new app for Parlamentum? Integrate with zero fees.
            </h2>

            <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              We charge nothing and take zero percentage of your revenue. 
              Our mission is to unify Parlamentum so players don't have 10 different passwords and accounts. 
              Drop in the <code className="text-sky-300 font-mono">@civix/sdk</code> for instant Single Sign-On, in-game name sync, and zero-config player cloud storage.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                href="/developers"
                className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-md shadow-sky-500/20 hover:bg-sky-400 transition-all"
              >
                <span>Register Your App in Developer Console</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/developers#sdk"
                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition-all"
              >
                <span>Read 15-Minute SDK Guide</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-8 text-xs text-zinc-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-500" />
            <span className="font-semibold text-zinc-300">CIVIX Ecosystem Platform</span>
            <span>· The Sovereign Hub of Parlamentum</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://parlamentum.org" target="_blank" rel="noreferrer" className="hover:text-zinc-300">
              Parlamentum
            </a>
            <a href="https://growurgold.vercel.app" target="_blank" rel="noreferrer" className="hover:text-zinc-300">
              Grow UR Gold (GUG)
            </a>
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
