"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, ExternalLink, ShieldCheck, Plus, ArrowRight } from "lucide-react";

interface AuthorizedApp {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  category: string;
  appUrl: string;
  scopes: string[];
}

export default function QuickLaunchDock() {
  const [authorizedApps, setAuthorizedApps] = useState<AuthorizedApp[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.citizen) {
          setAuthenticated(true);
          const active = (d.authorizedApps || []).filter((a: any) => !a.revoked);
          setAuthorizedApps(active);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !authenticated) return null;

  return (
    <div className="w-full rounded-2xl border border-cyan-900/40 bg-gradient-to-r from-[#090f1d] via-[#091122] to-[#0d1428] p-4 sm:p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-400 text-black">
            <Zap className="h-3.5 w-3.5 fill-black stroke-black" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              Instant 1-Click Launch Dock
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.2 text-[9px] font-black text-cyan-300 uppercase tracking-widest">
                Pre-Authorized
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Skip login screens. Launch directly into your connected Parlamentum web apps.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 shrink-0"
        >
          <span>Manage Authorizations</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {authorizedApps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-black/30 p-4 text-center">
          <p className="text-xs text-zinc-400">
            You haven't authorized any applications yet.
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Launch any verified app below to automatically link your sovereign passport.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {authorizedApps.map((app) => (
            <a
              key={app.id}
              href={`/api/oauth/launch/${app.slug}`}
              className="group relative flex flex-col items-center justify-center p-3 rounded-xl border border-zinc-800 bg-[#070b14]/80 hover:border-cyan-400 hover:bg-[#0b1325] hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-200 text-center"
              title={`1-Click Launch ${app.name}`}
            >
              <div className="relative mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-950 to-indigo-950 border border-cyan-800/80 group-hover:scale-105 group-hover:border-cyan-400 transition-all">
                <span className="text-xs font-black text-cyan-300 uppercase">
                  {app.name.slice(0, 2)}
                </span>
                <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-black shadow">
                  <Zap className="h-2.5 w-2.5 fill-black stroke-black" />
                </div>
              </div>

              <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate max-w-full">
                {app.name}
              </span>

              <span className="text-[10px] text-zinc-500 font-mono mt-0.5 capitalize">
                {app.category}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
