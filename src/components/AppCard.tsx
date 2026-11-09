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
  finance: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
  gaming: "text-purple-400 border-purple-500/20 bg-purple-500/5",
  casino: "text-rose-400 border-rose-500/20 bg-rose-500/5",
  utility: "text-sky-400 border-sky-500/20 bg-sky-500/5",
};

export default function AppCard({ app }: { app: AppItem }) {
  const IconComponent = CATEGORY_ICONS[app.category] || Landmark;
  const colorClass = CATEGORY_COLORS[app.category] || "text-zinc-400 border-zinc-700 bg-zinc-800/50";

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#0d121f]/70 p-6 shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:bg-[#0f1626] hover:shadow-2xl hover:shadow-cyan-500/10">
      {/* Background glow when featured */}
      {app.featured && (
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-500/10 blur-3xl group-hover:bg-cyan-500/20 transition-colors" />
      )}

      <div>
        {/* Header row: category + badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
            <IconComponent className="h-3 w-3" />
            {app.category}
          </span>

          <div className="flex items-center gap-1.5">
            {app.featured && (
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                Live App
              </span>
            )}
            {app.verified && (
              <span title="Verified Sovereign Citizen Integration" className="flex items-center gap-0.5 text-xs text-cyan-400">
                <ShieldCheck className="h-4 w-4 fill-cyan-400/10" />
              </span>
            )}
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="mb-2.5">
          <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
            {app.name}
          </h3>
          <p className="text-xs font-medium text-cyan-400/90 line-clamp-1 mt-0.5">
            {app.tagline}
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 mb-5">
          {app.description}
        </p>
      </div>

      {/* Footer info & Launch CTA */}
      <div className="pt-4 border-t border-zinc-800/80">
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-3.5">
          <div className="flex items-center gap-1 text-zinc-400">
            <Users className="h-3.5 w-3.5 text-cyan-500" />
            <span>~{app.activeUsers} citizens</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-400">
            <Zap className="h-3 w-3 text-cyan-400" />
            <span>Civix SSO Ready</span>
          </div>
        </div>

        <a
          href={app.appUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-600/20 transition-all hover:from-cyan-500 hover:to-sky-500 active:scale-95 group/btn"
        >
          <span>Launch Application</span>
          <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
        </a>
      </div>
    </div>
  );
}
