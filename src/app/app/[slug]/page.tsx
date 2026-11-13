"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CivixNavbar from "@/components/CivixNavbar";
import AppReviewsSection from "@/components/store/AppReviewsSection";
import { 
  Zap, ExternalLink, ShieldCheck, Users, ArrowLeft, 
  Sparkles, Shield, KeyRound, CheckCircle2, Lock, Layers, Calendar, ChevronRight
} from "lucide-react";

interface AppDetail {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  iconUrl: string | null;
  bannerUrl: string | null;
  category: string;
  appUrl: string;
  clientId: string;
  ownerName: string;
  activeUsers: number;
  connectedCitizensCount: number;
  featured: boolean;
  verified: boolean;
  status: string;
  createdAt: string;
  screenshots: { id: string; url: string; caption: string | null }[];
  isAuthorized: boolean;
  authorizedScopes: string[];
  similarApps: any[];
}

function AppDetailContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [app, setApp] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/apps/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.app) {
          setApp(d.app);
          if (d.app.screenshots && d.app.screenshots.length > 0) {
            setActiveImage(d.app.screenshots[0].url);
          }
        } else {
          setError(d.error || "Application not found");
        }
      })
      .catch((err) => setError("Failed to connect to application nexus"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans">
        <CivixNavbar />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-12 flex-1 w-full animate-pulse space-y-6">
          <div className="h-6 w-32 bg-zinc-800 rounded" />
          <div className="h-64 bg-zinc-900 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-96 md:col-span-2 bg-zinc-900 rounded-2xl" />
            <div className="h-96 bg-zinc-900 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans">
        <CivixNavbar />
        <main className="mx-auto max-w-xl px-4 py-24 text-center">
          <div className="rounded-3xl border border-zinc-800 bg-[#0c111c] p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Application Not Found</h2>
            <p className="text-xs text-zinc-400 mb-6">{error || "This app could not be located in the register."}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-black"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Store</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <CivixNavbar />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-8">
        {/* Breadcrumb / Back button */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Store</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-zinc-700" />
          <span className="capitalize">{app.category}</span>
          <ChevronRight className="h-3 w-3 text-zinc-700" />
          <span className="text-zinc-300 font-semibold">{app.name}</span>
        </div>

        {/* Hero Header Card */}
        <section className="relative overflow-hidden rounded-3xl border border-cyan-950/60 bg-gradient-to-r from-[#090e1c] via-[#091224] to-[#0c162e] p-6 sm:p-10 shadow-2xl">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Icon & Title */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0c182d] to-[#162744] border border-cyan-500/40 shadow-xl shadow-cyan-950/60">
                <span className="text-2xl sm:text-3xl font-black text-cyan-300 uppercase">
                  {app.name.slice(0, 2)}
                </span>
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                    {app.category}
                  </span>
                  {app.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified Citizen App
                    </span>
                  )}
                  {app.isAuthorized && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-400/40 px-2.5 py-0.5 text-[10px] font-black text-sky-300 uppercase tracking-wider">
                      <Zap className="h-3 w-3 fill-sky-300 stroke-sky-300" />
                      Passport Linked
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {app.name}
                </h1>

                <p className="text-xs sm:text-sm text-cyan-300/90 font-medium">
                  {app.tagline}
                </p>

                <p className="text-[11px] text-zinc-400 font-mono">
                  Created by <strong className="text-zinc-200">@{app.ownerName}</strong> · Client ID: <span className="text-zinc-500">{app.clientId}</span>
                </p>
              </div>
            </div>

            {/* Right: Launch CTA Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col items-stretch md:items-end gap-3 shrink-0">
              <a
                href={`/api/oauth/launch/${app.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 px-7 py-3.5 text-sm font-extrabold text-black shadow-xl shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all"
              >
                <Zap className="h-4 w-4 fill-black stroke-black" />
                <span>1-Click Launch Application</span>
              </a>

              <a
                href={app.appUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-black/40 px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
              >
                <span>Direct Site URL</span>
                <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
              </a>
            </div>
          </div>
        </section>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-zinc-800/80 bg-[#0c121e]/80 p-4">
            <span className="text-[11px] text-zinc-400 block mb-1">Active Citizens</span>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-cyan-400" />
              <span className="text-lg font-bold text-white tabular">~{app.activeUsers}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-[#0c121e]/80 p-4">
            <span className="text-[11px] text-zinc-400 block mb-1">Single Sign-On</span>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-300">OAuth 2.0 Ready</span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-[#0c121e]/80 p-4">
            <span className="text-[11px] text-zinc-400 block mb-1">Verification Status</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-bold text-cyan-300">{app.verified ? "Sovereign Audit Passed" : "Community"}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-[#0c121e]/80 p-4">
            <span className="text-[11px] text-zinc-400 block mb-1">Registered Since</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold text-zinc-200">
                {new Date(app.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Two Column Layout: Description & Security Permissions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* About / Description */}
            <div className="rounded-2xl border border-zinc-800/80 bg-[#0c121e]/80 p-6 sm:p-8 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-cyan-400" />
                About {app.name}
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {app.description}
              </p>
            </div>

            {/* Screenshots Gallery (if available or fallback preview) */}
            {app.screenshots.length > 0 && (
              <div className="rounded-2xl border border-zinc-800/80 bg-[#0c121e]/80 p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">Application Gallery</h3>
                {activeImage && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-zinc-700 bg-black">
                    <img
                      src={activeImage}
                      alt={app.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {app.screenshots.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveImage(s.url)}
                      className={`relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        activeImage === s.url ? "border-cyan-400 scale-105" : "border-zinc-800 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={s.url} alt="screenshot" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Citizen Reviews Section */}
            <AppReviewsSection slug={app.slug} appName={app.name} />
          </div>

          {/* Right Sidebar: Security, Scopes & Authorizations */}
          <div className="lg:col-span-4 space-y-6">
            {/* Permissions Box */}
            <div className="rounded-2xl border border-cyan-950/60 bg-[#0c121e]/80 p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Sovereign Privacy Guarantee</h3>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                CIVIX protects your identity across apps. When launching {app.name}, the following read-only scopes are verified:
              </p>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 rounded-xl border border-zinc-800 bg-black/40 p-3 text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-zinc-200 block">Universal Citizen Identity (<code className="text-cyan-300 text-[10px]">identity</code>)</span>
                    <span className="text-[11px] text-zinc-400">Syncs your current in-game name and permanent character ID.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-zinc-800 bg-black/40 p-3 text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-zinc-200 block">Universal Referrals</span>
                    <span className="text-[11px] text-zinc-400">Ensures you receive 100% of referral attribution across all ecosystem apps.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-zinc-800 bg-black/40 p-3 text-xs">
                  <Lock className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="font-semibold text-zinc-200 block">Zero Vault Access</span>
                    <span className="text-[11px] text-zinc-400">Applications NEVER receive your master password or gold transfer keys.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Similar Apps Rail */}
            {app.similarApps.length > 0 && (
              <div className="rounded-2xl border border-zinc-800/80 bg-[#0c121e]/80 p-6 space-y-3">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Similar In {app.category}
                </h3>
                <div className="space-y-2.5">
                  {app.similarApps.map((sim: any) => (
                    <Link
                      key={sim.id}
                      href={`/app/${sim.slug}`}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 p-2.5 hover:border-cyan-500/40 hover:bg-white/5 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-cyan-300">
                          {sim.name.slice(0, 2)}
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-300 block truncate">
                            {sim.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 block truncate">
                            {sim.tagline}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AppDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans">
          <CivixNavbar />
          <main className="mx-auto max-w-6xl px-4 py-16 flex-1 w-full animate-pulse space-y-6">
            <div className="h-64 bg-zinc-900 rounded-3xl" />
          </main>
        </div>
      }
    >
      <AppDetailContent />
    </Suspense>
  );
}
