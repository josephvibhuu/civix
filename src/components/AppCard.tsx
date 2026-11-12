"use client";

import Link from "next/link";
import { ExternalLink, ShieldCheck, Users, Zap, TrendingUp, Swords, Dices, Landmark, ArrowRight, Star } from "lucide-react";

export interface AppItem {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  appUrl: string;
  clientId: string;
  ownerName: string;
  activeUsers: number;
  featured: boolean;
  verified: boolean;
}

const CATEGORY_ICONS: Record<string, any> = {
  finance: TrendingUp,
  gaming: Swords,
  casino: Dices,
  utility: Landmark,
};

const CATEGORY_COLORS: Record<string, { badge: string; border: string }> = {
  finance: {
    badge: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    border: "group-hover:border-cyan-500/50",
  },
  gaming: {
    badge: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    border: "group-hover:border-purple-500/50",
  },
  casino: {
    badge: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    border: "group-hover:border-rose-500/50",
  },
  utility: {
    badge: "text-sky-400 border-sky-500/30 bg-sky-500/10",
    border: "group-hover:border-sky-500/50",
  },
};

export default function AppCard({ app }: { app: AppItem }) {
  const IconComponent = CATEGORY_ICONS[app.category] || Landmark;
  const colorTheme = CATEGORY_COLORS[app.category] || {
    badge: "text-zinc-400 border-zinc-700 bg-zinc-800/50",
    border: "group-hover:border-zinc-500",
  };

  return (
    <div className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800/90 bg-[#0c111e]/80 p-5 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10 hover:bg-[#0f172a] ${colorTheme.border}`}>
      {/* Background glow when featured */}
      {app.featured && (
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl group-hover:bg-cyan-500/20 transition-colors pointer-events-none" />
      )}

      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colorTheme.badge}`}>
            <IconComponent className="h-3 w-3" />
            {app.category}
          </span>

          <div className="flex items-center gap-1.5">
            {app.featured && (
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[9px] font-black text-cyan-300 uppercase tracking-wider">
                Featured
              </span>
            )}
            {app.verified && (
              <span title="Verified Sovereign Citizen Integration" className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Icon & Title Row */}
        <div className="flex items-start gap-3 mb-2.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0e172a] to-[#1e293b] border border-zinc-700/80 shadow-md group-hover:border-cyan-500/50 transition-colors">
            <span className="text-sm font-black text-cyan-300 uppercase">
              {app.name.slice(0, 2)}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <Link href={`/app/${app.slug}`}>
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                {app.name}
              </h3>
            </Link>
            <p className="text-xs font-medium text-cyan-400/90 line-clamp-1 mt-0.5">
              {app.tagline}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 mb-4">
          {app.description}
        </p>
      </div>

      {/* Footer Info & Dual Actions */}
      <div className="pt-3.5 border-t border-zinc-800/80">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-3 font-mono">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-cyan-400" />
            <span>~{app.activeUsers} citizens</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400">
            <Zap className="h-3 w-3" />
            <span>1-Click Ready</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Details / Store Page */}
          <Link
            href={`/app/${app.slug}`}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900/60 py-2 px-3 text-xs font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
          >
            <span>Overview</span>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
          </Link>

          {/* 1-Click Launch Button */}
          <a
            href={`/api/oauth/launch/${app.slug}`}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 py-2 px-3 text-xs font-bold text-black shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all group/btn"
          >
            <Zap className="h-3.5 w-3.5 fill-black stroke-black" />
            <span>Launch</span>
          </a>
        </div>
      </div>
    </div>
  );
}
