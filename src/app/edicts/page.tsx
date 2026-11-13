"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import CivixNavbar from "@/components/CivixNavbar";
import { 
  Scroll, ShieldAlert, TrendingUp, Sparkles, AlertCircle, 
  Search, Pin, Calendar, User, ArrowRight, ExternalLink, ChevronDown, ChevronUp, Layers
} from "lucide-react";

interface Edict {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  authorTitle: string;
  targetTier: string;
  isPinned: boolean;
  badgeText: string | null;
  actionUrl: string | null;
  createdAt: string;
}

const CATEGORY_MAP: Record<string, { label: string; color: string; border: string; icon: any }> = {
  all: { label: "All Gazette", color: "text-zinc-300", border: "border-zinc-700", icon: Layers },
  edict: { label: "Imperial Decrees", color: "text-amber-400 bg-amber-500/10 border-amber-500/30", border: "border-amber-500/40", icon: Scroll },
  market: { label: "Market & Bourses", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30", border: "border-cyan-500/40", icon: TrendingUp },
  release: { label: "App Releases", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", border: "border-emerald-500/40", icon: Sparkles },
  security: { label: "Security Advisories", color: "text-rose-400 bg-rose-500/10 border-rose-500/30", border: "border-rose-500/40", icon: ShieldAlert },
};

export default function ImperialEdictsPage() {
  const [edicts, setEdicts] = useState<Edict[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEdictId, setExpandedEdictId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/edicts")
      .then((r) => r.json())
      .then((d) => {
        if (d.edicts) {
          setEdicts(d.edicts);
          // Auto-expand the pinned decree
          const pinned = d.edicts.find((e: Edict) => e.isPinned);
          if (pinned) {
            setExpandedEdictId(pinned.id);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredEdicts = useMemo(() => {
    return edicts.filter((e) => {
      const matchCat = selectedCategory === "all" || e.category === selectedCategory;
      const matchSearch =
        searchQuery === "" ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.authorTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [edicts, selectedCategory, searchQuery]);

  const pinnedEdict = useMemo(() => edicts.find((e) => e.isPinned), [edicts]);

  return (
    <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <CivixNavbar />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-8">
        {/* Header Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-amber-900/50 bg-gradient-to-r from-[#120e06] via-[#161208] to-[#1a140b] p-6 sm:p-10 shadow-2xl">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                <Scroll className="h-3.5 w-3.5 text-amber-400" />
                The Imperial Gazette & Decrees
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Official Realm Edicts
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Stay abreast of monetary directives, stock exchange dividend proclamations, guild accords, and cryptographic protocol upgrades enacted across the Parlamentum commonwealth.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
              <Link
                href="/workspace"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-5 py-2.5 text-xs font-bold text-black shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                <Layers className="h-4 w-4" />
                <span>Open WebOS Workspace</span>
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-black/40 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                <span>View Realm Leaderboard</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Filter Toolbar & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {Object.entries(CATEGORY_MAP).map(([key, meta]) => {
              const isSelected = selectedCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? "bg-amber-400 text-black shadow-md shadow-amber-400/20"
                      : "bg-[#0a0f1d] border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  <meta.icon className="h-3.5 w-3.5" />
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search decrees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-[#0a0f1d] pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Edicts Feed List */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-zinc-900 rounded-2xl" />
            <div className="h-32 bg-zinc-900 rounded-2xl" />
            <div className="h-32 bg-zinc-900 rounded-2xl" />
          </div>
        ) : filteredEdicts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-[#080d19] p-12 text-center space-y-3">
            <Scroll className="h-10 w-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Edicts Found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No realm proclamations match your active search and category filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEdicts.map((edict) => {
              const catMeta = CATEGORY_MAP[edict.category] || CATEGORY_MAP.edict;
              const isExpanded = expandedEdictId === edict.id;

              return (
                <article
                  key={edict.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    edict.isPinned
                      ? "border-amber-500/50 bg-[#0f1118] shadow-lg shadow-amber-950/30"
                      : "border-zinc-800/80 bg-[#0a0e1a] hover:border-zinc-700"
                  }`}
                >
                  <div className="p-5 sm:p-6 space-y-3">
                    {/* Header: Badges & Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {edict.isPinned && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[9px] font-black text-amber-300 uppercase tracking-wider">
                            <Pin className="h-3 w-3" />
                            Pinned Edict
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${catMeta.color}`}>
                          {catMeta.label}
                        </span>
                        {edict.badgeText && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            [{edict.badgeText}]
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(edict.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Title & Author */}
                    <div>
                      <h2
                        onClick={() => setExpandedEdictId(isExpanded ? null : edict.id)}
                        className="text-base sm:text-lg font-bold text-white hover:text-amber-300 cursor-pointer transition-colors"
                      >
                        {edict.title}
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                        <User className="h-3.5 w-3.5 text-amber-400" />
                        <span>Proclaimed by <strong>{edict.authorTitle}</strong></span>
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      {edict.summary}
                    </p>

                    {/* Expandable Full Content */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-zinc-800 text-xs text-zinc-300 leading-relaxed space-y-3 animate-in fade-in duration-150">
                        <div className="p-4 rounded-xl bg-black/50 border border-zinc-800 font-serif italic text-zinc-300">
                          "{edict.content}"
                        </div>
                      </div>
                    )}

                    {/* Footer Controls */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs">
                      <button
                        onClick={() => setExpandedEdictId(isExpanded ? null : edict.id)}
                        className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <span>{isExpanded ? "Collapse Decree" : "Read Full Decree"}</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>

                      {edict.actionUrl && (
                        <Link
                          href={edict.actionUrl}
                          className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          <span>Execute Decree Link</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
