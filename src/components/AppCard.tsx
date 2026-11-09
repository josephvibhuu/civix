"use client";

import { ExternalLink, ShieldCheck, Users, Zap, TrendingUp, Swords, Dices, Landmark } from "lucide-react";

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

const CATEGORY_COLORS: Record<string, string> = {
  finance: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  gaming: "text-red-400 border-red-500/20 bg-red-500/5",
  casino: "text-purple-400 border-purple-500/20 bg-purple-500/5",
  utility: "text-sky-400 border-sky-500/20 bg-sky-500/5",
};

export default function AppCard({ app }: { app: AppItem }) {
  const IconComponent = CATEGORY_ICONS[app.category] || Landmark;
  const colorClass = CATEGORY_COLORS[app.category] || "text-zinc-400 border-zinc-700 bg-zinc-800/50";

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:bg-zinc-900/90 hover:shadow-xl hover:shadow-amber-500/5">
      {/* Background glow when featured */}
      {app.featured && (
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-colors" />
      )}

      <div>
        {/* Header row: category + badges */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${colorClass}`}>
            <IconComponent className="h-3 w-3" />
            {app.category}
          </span>

          <div className="flex items-center gap-1.5">
            {app.featured && (
              <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Featured
              </span>
            )}
            {app.verified && (
              <span title="Verified by Civix Guild" className="flex items-center gap-0.5 text-xs text-sky-400">
                <ShieldCheck className="h-4 w-4 fill-sky-400/10" />
              </span>
            )}
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="mb-2">
          <h3 className="text-lg font-bold text-zinc-100 group-hover:text-amber-300 transition-colors flex items-center justify-between">
            {app.name}
          </h3>
          <p className="text-xs font-medium text-amber-400/90 line-clamp-1 mt-0.5">
            {app.tagline}
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 mb-4">
          {app.description}
        </p>
      </div>

      {/* Footer info & Launch CTA */}
      <div className="pt-3 border-t border-zinc-800/80">
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
          <div className="flex items-center gap-1 text-zinc-400">
            <Users className="h-3.5 w-3.5 text-zinc-500" />
            <span>~{app.activeUsers} citizens</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
            <Zap className="h-3 w-3 text-amber-400" />
            <span>Civix ID Ready</span>
          </div>
        </div>

        <a
          href={app.appUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-100 border border-zinc-700/60 shadow-sm transition-all hover:bg-amber-500 hover:text-zinc-950 hover:border-amber-400 group/btn"
        >
          <span>Launch Application</span>
          <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </a>
      </div>
    </div>
  );
}
