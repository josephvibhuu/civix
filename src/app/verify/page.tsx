"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CivixNavbar from "@/components/CivixNavbar";
import { 
  ShieldCheck, ShieldAlert, Award, CheckCircle2, Copy, Check, 
  ArrowRight, Zap, RefreshCw, Landmark, AlertCircle, FileCheck, ExternalLink, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

interface VerificationRequest {
  id: string;
  targetTier: string;
  challengeCode: string;
  contractMemo: string | null;
  proofTx: string | null;
  characterAgeDays: number;
  status: string;
  notes: string | null;
  createdAt: string;
  verifiedAt: string | null;
}

interface CitizenInfo {
  id: string;
  username: string;
  gameProfileId: string;
  tier: string;
  isVerified: boolean;
  isAdmin: boolean;
  memberSince: string;
}

const TIER_META: Record<string, { name: string; badge: string; color: string; border: string; desc: string }> = {
  tier_1_citizen: {
    name: "Tier 1: Standard Citizen",
    badge: "Basic Passport",
    color: "from-zinc-800 to-zinc-900 text-zinc-300",
    border: "border-zinc-700",
    desc: "Baseline citizen registration with immutable gameProfileId binding.",
  },
  tier_2_bank_verified: {
    name: "Tier 2: Bank Verified",
    badge: "Anti-Sybil Certified",
    color: "from-cyan-950 via-sky-900 to-indigo-950 text-cyan-300",
    border: "border-cyan-500/50",
    desc: "Character tenure >30 days + zero-gold cryptographic notary bond. Unlocks uncollateralized lending and margin trading.",
  },
  tier_3_sovereign_elite: {
    name: "Tier 3: Sovereign Elite",
    badge: "Imperial Syndicate",
    color: "from-amber-950 via-yellow-900 to-amber-950 text-amber-300",
    border: "border-amber-500/50",
    desc: "Guild Master or High Senator standing with institutional notary seal.",
  },
};

export default function VerificationChamberPage() {
  const [citizen, setCitizen] = useState<CitizenInfo | null>(null);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedMemo, setCopiedMemo] = useState(false);

  // Form states
  const [selectedTargetTier, setSelectedTargetTier] = useState<string>("tier_2_bank_verified");
  const [generating, setGenerating] = useState(false);
  const [activeRequest, setActiveRequest] = useState<VerificationRequest | null>(null);
  const [proofTxInput, setProofTxInput] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);

  const fetchStatus = () => {
    setLoading(true);
    fetch("/api/verify")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.citizen) {
          setCitizen(d.citizen);
          setRequests(d.requests || []);
          const pending = (d.requests || []).find((r: VerificationRequest) => r.status === "pending");
          if (pending) {
            setActiveRequest(pending);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleGenerateChallenge = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_challenge",
          targetTier: selectedTargetTier,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate challenge");

      toast.success("Notary challenge memo generated!", {
        description: `Code: ${data.request.challengeCode}`,
      });
      fetchStatus();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitProof = async (txHash?: string) => {
    if (!activeRequest) return;
    const tx = txHash || proofTxInput.trim();
    if (!tx) {
      toast.error("Please enter in-game transaction hash or contract confirmation.");
      return;
    }

    setSubmittingProof(true);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_proof",
          requestId: activeRequest.id,
          proofTx: tx,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      toast.success(data.message, {
        icon: <ShieldCheck className="h-5 w-5 text-emerald-400" />,
      });
      setActiveRequest(null);
      setProofTxInput("");
      fetchStatus();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingProof(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMemo(true);
    toast.success("Copied contract memo to clipboard");
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans">
        <CivixNavbar />
        <main className="mx-auto max-w-4xl px-4 py-16 w-full animate-pulse space-y-6">
          <div className="h-8 w-48 bg-zinc-800 rounded-xl" />
          <div className="h-40 bg-zinc-900 rounded-3xl" />
          <div className="h-64 bg-zinc-900 rounded-3xl" />
        </main>
      </div>
    );
  }

  if (!citizen) {
    return (
      <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans">
        <CivixNavbar />
        <main className="mx-auto max-w-lg px-4 py-24 text-center">
          <div className="rounded-3xl border border-zinc-800 bg-[#0a0f1d] p-8 shadow-2xl space-y-4">
            <ShieldAlert className="h-12 w-12 text-cyan-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Citizen Passport Required</h2>
            <p className="text-xs text-zinc-400">
              You must authenticate with your sovereign citizen credentials to enter the Verification Chamber.
            </p>
            <Link
              href="/login?return_to=/verify"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-6 py-2.5 text-xs font-bold text-black"
            >
              <span>Log in with 1-Click SSO</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const currentTierMeta = TIER_META[citizen.tier] || TIER_META.tier_1_citizen;
  const isTier2OrAbove = citizen.tier === "tier_2_bank_verified" || citizen.tier === "tier_3_sovereign_elite";

  return (
    <div className="min-h-screen bg-[#06080e] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <CivixNavbar />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-8">
        {/* Header Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/dashboard" className="hover:text-cyan-400 transition-colors">
            Passport
          </Link>
          <ChevronRight className="h-3 w-3 text-zinc-700" />
          <span className="text-zinc-300 font-semibold">Verification Chamber</span>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-cyan-950/60 bg-gradient-to-r from-[#090f1e] via-[#0a1326] to-[#0c1933] p-6 sm:p-8 shadow-2xl">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-0.5 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                <FileCheck className="h-3.5 w-3.5 text-cyan-400" />
                Anti-Sybil Proof of Antiquity
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Self-Serve KYC Verification Chamber
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Elevate your sovereign credentials. Eliminate throwaway alt accounts, establish cryptographic tenure, and unlock uncollateralized lending across all Parlamentum partner bourses.
              </p>
            </div>

            {/* Current Standing Card */}
            <div className={`rounded-2xl border p-4 shadow-xl shrink-0 bg-gradient-to-br ${currentTierMeta.color} ${currentTierMeta.border} min-w-[240px]`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Current Standing
                </span>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-black text-emerald-400 uppercase">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white truncate">{citizen.username}</h3>
              <p className="text-xs font-bold text-cyan-300 mt-0.5">{currentTierMeta.name}</p>
              <div className="text-[10px] text-zinc-400 font-mono mt-2 truncate">
                Profile ID: {citizen.gameProfileId}
              </div>
            </div>
          </div>
        </section>

        {/* Tier Progression Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tier 1 Card */}
          <div className="rounded-2xl border border-zinc-800 bg-[#0a0f1c] p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400 uppercase">
                Tier 1
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> Acquired
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Registered Citizen</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Standard passport with bound Parlamentum character profile. Free 1-Click SSO across all directory applications.
            </p>
            <ul className="text-[11px] text-zinc-400 space-y-1.5 pt-2 border-t border-zinc-800">
              <li className="flex items-center gap-1.5 text-zinc-300">
                <Check className="h-3 w-3 text-cyan-400" /> Universal OAuth 2.0 SSO
              </li>
              <li className="flex items-center gap-1.5 text-zinc-300">
                <Check className="h-3 w-3 text-cyan-400" /> Grow UR Gold Spot Trading
              </li>
              <li className="flex items-center gap-1.5 text-zinc-500">
                <AlertCircle className="h-3 w-3 text-zinc-600" /> No uncollateralized lending
              </li>
            </ul>
          </div>

          {/* Tier 2 Card */}
          <div className={`rounded-2xl border p-5 space-y-3 relative overflow-hidden bg-[#0c1426] ${
            isTier2OrAbove ? "border-emerald-500/50" : "border-cyan-500/60 shadow-lg shadow-cyan-950/50"
          }`}>
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-bold text-cyan-300 uppercase">
                Tier 2
              </span>
              {isTier2OrAbove ? (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Verified
                </span>
              ) : (
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Recommended
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white">Bank Verified</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Anti-sybil character seniority (&gt;30 days active) + zero-gold notary challenge contract.
            </p>
            <ul className="text-[11px] text-zinc-300 space-y-1.5 pt-2 border-t border-zinc-800">
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-cyan-400" /> Bank of Europe Credit Line
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-cyan-400" /> Margin Trading on Grow UR Gold
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-cyan-400" /> Labour Exchange High Escrow
              </li>
            </ul>
          </div>

          {/* Tier 3 Card */}
          <div className="rounded-2xl border border-zinc-800 bg-[#0a0f1c] p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase">
                Tier 3
              </span>
              {citizen.tier === "tier_3_sovereign_elite" ? (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Elite
                </span>
              ) : (
                <span className="text-[10px] text-zinc-500 uppercase">High Standing</span>
              )}
            </div>
            <h3 className="text-base font-bold text-white">Sovereign Elite</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Reserved for Guild Masters, High Senators, and Bourse Operators with institutional notary backing.
            </p>
            <ul className="text-[11px] text-zinc-400 space-y-1.5 pt-2 border-t border-zinc-800">
              <li className="flex items-center gap-1.5 text-zinc-300">
                <Check className="h-3 w-3 text-amber-400" /> Unlimited Bourse Clearing Limits
              </li>
              <li className="flex items-center gap-1.5 text-zinc-300">
                <Check className="h-3 w-3 text-amber-400" /> Imperial Senate Motion Voting
              </li>
              <li className="flex items-center gap-1.5 text-zinc-300">
                <Check className="h-3 w-3 text-amber-400" /> Gold Leaderboard Crest
              </li>
            </ul>
          </div>
        </div>

        {/* Verification Chamber Execution Deck */}
        <section className="rounded-3xl border border-cyan-500/30 bg-[#090f20]/90 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-cyan-400" />
                <span>Verification Notary Chamber</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Generate and confirm your cryptographic zero-gold notary memo on the Parlamentum ledger.
              </p>
            </div>

            <button
              onClick={fetchStatus}
              className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white transition-colors"
              title="Refresh status"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {!activeRequest ? (
            /* STEP 1: GENERATE CHALLENGE */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setSelectedTargetTier("tier_2_bank_verified")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedTargetTier === "tier_2_bank_verified"
                      ? "border-cyan-500 bg-cyan-950/40 text-cyan-200 shadow-md shadow-cyan-950/50"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">Upgrade to Tier 2</span>
                    <span className="text-[10px] font-mono text-cyan-400">Bank Verified</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Verify character antiquity (&gt;30 days active in game) + 0-gold notary contract.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedTargetTier("tier_3_sovereign_elite")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedTargetTier === "tier_3_sovereign_elite"
                      ? "border-amber-500 bg-amber-950/40 text-amber-200 shadow-md shadow-amber-950/50"
                      : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">Upgrade to Tier 3</span>
                    <span className="text-[10px] font-mono text-amber-400">Sovereign Elite</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Guild leader and institutional council notary endorsement.
                  </p>
                </div>
              </div>

              <button
                onClick={handleGenerateChallenge}
                disabled={generating}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-3 text-xs font-bold text-black shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-black stroke-black" />}
                <span>Generate Notary Challenge Memo</span>
              </button>
            </div>
          ) : (
            /* STEP 2: ACTIVE CHALLENGE IN PROGRESS */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-cyan-500/40 bg-[#060a14] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-cyan-400" />
                    Pending Challenge: {activeRequest.challengeCode}
                  </span>
                  <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                    Awaiting In-Game Memo
                  </span>
                </div>

                {/* Instructions */}
                <div className="space-y-2 text-xs text-zinc-300">
                  <p>
                    <strong>Instructions:</strong> Open Parlamentum and send a <strong>0-Gold Notary Contract</strong> to the notary treasury with the exact cryptographic memo code below:
                  </p>

                  <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-black/80 p-3 font-mono text-xs text-cyan-300">
                    <span className="flex-1 truncate">{activeRequest.contractMemo}</span>
                    <button
                      onClick={() => copyToClipboard(activeRequest.contractMemo || "")}
                      className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-sans font-semibold text-white hover:bg-zinc-700 transition-colors shrink-0"
                    >
                      {copiedMemo ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedMemo ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Submission Form */}
                <div className="pt-2 border-t border-zinc-800 space-y-3">
                  <label className="block text-xs font-medium text-zinc-300">
                    Enter In-Game Contract Transaction Hash:
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. tx_notary_9a8f4c2e or click Instant Confirm"
                      value={proofTxInput}
                      onChange={(e) => setProofTxInput(e.target.value)}
                      className="flex-1 rounded-xl border border-zinc-800 bg-black/90 p-2.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={() => handleSubmitProof()}
                      disabled={submittingProof}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold text-black hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 shrink-0"
                    >
                      {submittingProof ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                      <span>Submit & Verify</span>
                    </button>
                  </div>

                  {/* Simulator for Instant Verification */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                    <span>Testing verification in preview?</span>
                    <button
                      onClick={() => handleSubmitProof(`tx_mock_${Date.now().toString(36)}`)}
                      className="text-cyan-400 hover:underline font-semibold"
                    >
                      ⚡ Instant Notary Confirm (Simulated)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Verification History Audit Log */}
        {requests.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
              Verification Audit Trail
            </h3>

            <div className="rounded-2xl border border-zinc-800 bg-[#090d19] overflow-hidden">
              <div className="divide-y divide-zinc-800/80">
                {requests.map((req) => (
                  <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{req.challengeCode}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          req.status === "verified"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}>
                          {req.status}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Target: {req.targetTier}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        {req.notes || "Notary challenge record"}
                      </p>
                    </div>

                    <div className="text-right text-[11px] text-zinc-500 font-mono shrink-0">
                      <div>Created: {new Date(req.createdAt).toLocaleDateString()}</div>
                      {req.verifiedAt && <div className="text-emerald-400">Verified: {new Date(req.verifiedAt).toLocaleDateString()}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
