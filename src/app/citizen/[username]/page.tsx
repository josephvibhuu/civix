"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import CivixNavbar from "@/components/CivixNavbar";
import { 
  ShieldCheck, Shield, Users, Star, Layers, Calendar, 
  ArrowLeft, ExternalLink, ChevronRight, Copy, Check, Award 
} from "lucide-react";
import { toast } from "sonner";

interface CitizenProfile {
  id: string;
  username: string;
  gameProfileId: string;
  tier: string;
  isVerified: boolean;
  referralCode: string | null;
  memberSince: string;
  referralCount: number;
  connectedApps: { name: string; slug: string; category: string; iconUrl: string | null }[];
  reviews: { rating: number; title: string; comment: string; appName: string; appSlug: string; createdAt: string }[];
}

const TIER_META: Record<string, { label: string; badge: string; border: string; bg: string }> = {
  tier_1_citizen: {
    label: "Standard Citizen",
    badge: "text-zinc-300 border-zinc-700 bg-zinc-800/60",
    border: "border-zinc-800",
    bg: "from-zinc-900 to-[#0a0e18]",
  },
  tier_2_bank_verified: {
    label: "Bank Verified Tier 2",
    badge: "text-cyan-300 border-cyan-500/40 bg-cyan-500/10",
    border: "border-cyan-500/50",
    bg: "from-cyan-950/40 via-[#0a1326] to-[#070b14]",
  },
  tier_3_sovereign_elite: {
    label: "Sovereign Elite Tier 3",
    badge: "text-amber-300 border-amber-500/40 bg-amber-500/10",
    border: "border-amber-500/50",
    bg: "from-amber-950/40 via-[#181308] to-[#0a0804]",
  },
};

function CitizenProfileContent() {
  const params = useParams();
  const username = params?.username as string;
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`/api/citizen/${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.citizen) {
          setProfile(d.citizen);
        } else {
          setError(d.error || "Citizen passport not found");
        }
      })
      .catch(() => setError("Failed to connect to realm registry"))
      .finally(() => setLoading(false));
  }, [username]);

  const copyReferralLink = () => {
    if (!profile?.referralCode) return;
    const link = `https://civix-plum.vercel.app/r/${profile.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Referral invitation link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans">
        <CivixNavbar />
        <main className="mx-auto max-w-4xl px-4 py-16 w-full animate-pulse space-y-6">
          <div className="h-6 w-32 bg-zinc-800 rounded" />
          <div className="h-56 bg-zinc-900 rounded-3xl" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-zinc-900 rounded-2xl" />
            <div className="h-24 bg-zinc-900 rounded-2xl" />
            <div className="h-24 bg-zinc-900 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans">
        <CivixNavbar />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <div className="rounded-3xl border border-zinc-800 bg-[#0a0f1d] p-8 shadow-2xl space-y-4">
            <Shield className="h-12 w-12 text-zinc-600 mx-auto" />
            <h2 className="text-xl font-bold text-white">Citizen Passport Not Found</h2>
            <p className="text-xs text-zinc-400">
              No registered sovereign citizen matches the handle <strong>@{username}</strong>.
            </p>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-black"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Leaderboard</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const tierMeta = TIER_META[profile.tier] || TIER_META.tier_1_citizen;

  return (
    <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <CivixNavbar />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/leaderboard" className="hover:text-cyan-400 transition-colors">
            Leaderboard
          </Link>
          <ChevronRight className="h-3 w-3 text-zinc-700" />
          <span>Citizen Passport</span>
          <ChevronRight className="h-3 w-3 text-zinc-700" />
          <span className="text-zinc-300 font-semibold">{profile.username}</span>
        </div>

        {/* Hero Passport Card */}
        <section className={`relative overflow-hidden rounded-3xl border ${tierMeta.border} bg-gradient-to-r ${tierMeta.bg} p-6 sm:p-10 shadow-2xl`}>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              {/* Avatar Crest */}
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 text-3xl sm:text-4xl font-black text-black shadow-xl shadow-cyan-500/25">
                {profile.username[0]?.toUpperCase()}
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tierMeta.badge}`}>
                    <Award className="h-3 w-3" />
                    {tierMeta.label}
                  </span>
                  {profile.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {profile.username}
                </h1>

                <p className="text-xs text-zinc-400 font-mono">
                  Game Profile ID: <span className="text-zinc-200">{profile.gameProfileId}</span>
                </p>

                <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  <span>Citizen since {new Date(profile.memberSince).toLocaleDateString()}</span>
                </p>
              </div>
            </div>

            {/* Referral / Share CTA */}
            {profile.referralCode && (
              <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
                <button
                  onClick={copyReferralLink}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-5 py-2.5 text-xs font-bold text-black shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedLink ? "Invite Copied" : "Share Citizen Passport"}</span>
                </button>
                <span className="text-[10px] text-zinc-500 font-mono text-center sm:text-right">
                  Code: {profile.referralCode}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-zinc-800/80 bg-[#0c121e]/80 p-5">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1">
              Connected Bourses
            </span>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              <span className="text-2xl font-black text-white tabular">{profile.connectedApps.length}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-[#0c121e]/80 p-5">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1">
              Recruited Citizens
            </span>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-400" />
              <span className="text-2xl font-black text-white tabular">{profile.referralCount}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-[#0c121e]/80 p-5">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider block mb-1">
              Verified Reviews
            </span>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
              <span className="text-2xl font-black text-white tabular">{profile.reviews.length}</span>
            </div>
          </div>
        </div>

        {/* Connected Bourses Showcase */}
        {profile.connectedApps.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
              Connected Ecosystem Bourses & Apps
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {profile.connectedApps.map((app) => (
                <Link
                  key={app.slug}
                  href={`/app/${app.slug}`}
                  className="group flex items-center justify-between p-3.5 rounded-2xl border border-zinc-800 bg-[#090d18] hover:border-cyan-500/40 hover:bg-[#0c1322] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-cyan-300 uppercase group-hover:border-cyan-400">
                      {app.name.slice(0, 2)}
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-white text-xs block truncate group-hover:text-cyan-300">
                        {app.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono capitalize">
                        {app.category}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-500 group-hover:text-cyan-300 shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Citizen Reviews Showcase */}
        {profile.reviews.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
              Community Reviews Written ({profile.reviews.length})
            </h3>
            <div className="space-y-3">
              {profile.reviews.map((rev, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-800/80 bg-[#090d18] p-4 sm:p-5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/app/${rev.appSlug}`}
                      className="text-xs font-bold text-cyan-400 hover:underline"
                    >
                      {rev.appName}
                    </Link>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < rev.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-zinc-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-white">{rev.title}</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function CitizenProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans">
          <CivixNavbar />
          <main className="mx-auto max-w-4xl px-4 py-16 w-full animate-pulse space-y-6">
            <div className="h-6 w-32 bg-zinc-800 rounded" />
            <div className="h-56 bg-zinc-900 rounded-3xl" />
          </main>
        </div>
      }
    >
      <CitizenProfileContent />
    </Suspense>
  );
}
