"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Layers, KeyRound, Sparkles, UserPlus, RefreshCw, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return_to") || "/";

  const [tab, setTab] = useState<"login" | "register" | "recover">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Login form state
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [updatedInGameName, setUpdatedInGameName] = useState("");

  // Register form state
  const [regUsername, setRegUsername] = useState("");
  const [regProfileId, setRegProfileId] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDiscord, setRegDiscord] = useState("");
  const [regRefCode, setRegRefCode] = useState("");

  // Recover form state
  const [recIdentifier, setRecIdentifier] = useState("");
  const [recStep, setRecStep] = useState<1 | 2>(1);
  const [recMemo, setRecMemo] = useState("");
  const [recCode, setRecCode] = useState("");
  const [recNewPassword, setRecNewPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginId,
          password: loginPassword,
          currentInGameName: updatedInGameName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      if (returnTo.startsWith("http") || returnTo.startsWith("/api")) {
        window.location.href = returnTo;
      } else {
        router.push(returnTo);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername,
          gameProfileId: regProfileId,
          password: regPassword,
          email: regEmail,
          discordId: regDiscord,
          referralCode: regRefCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setSuccess("Sovereign Passport created! Redirecting...");
      setTimeout(() => {
        if (returnTo.startsWith("http") || returnTo.startsWith("/api")) {
          window.location.href = returnTo;
        } else {
          router.push(returnTo);
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          identifier: recIdentifier,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Recovery request failed");

      setRecMemo(data.contractMemo);
      setRecStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          identifier: recIdentifier,
          code: recCode,
          newPassword: recNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password reset failed");

      setSuccess("Password successfully reset! You can now log in.");
      setTab("login");
      setRecStep(1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-cyan-950/60 bg-[#0a0f1d]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 shadow-md shadow-cyan-500/20">
            <Layers className="h-5 w-5 text-zinc-950 stroke-[2.3]" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">CIVIX ID</span>
        </Link>
        <p className="text-xs text-zinc-400">
          The sovereign passport for all Parlamentum applications
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/60 p-1 mb-6 text-xs font-semibold border border-zinc-800/80">
        <button
          onClick={() => {
            setTab("login");
            setError(null);
          }}
          className={`rounded-lg py-2 transition-all ${
            tab === "login" ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/25" : "text-zinc-400 hover:text-white"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            setTab("register");
            setError(null);
          }}
          className={`rounded-lg py-2 transition-all ${
            tab === "register" ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/25" : "text-zinc-400 hover:text-white"
          }`}
        >
          Register
        </button>
        <button
          onClick={() => {
            setTab("recover");
            setError(null);
          }}
          className={`rounded-lg py-2 transition-all ${
            tab === "recover" ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/25" : "text-zinc-400 hover:text-white"
          }`}
        >
          Recovery
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* TAB 1: LOGIN */}
      {tab === "login" && (
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-zinc-300 mb-1.5">
              Citizen Username or Game Profile ID
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CardinalSanjay or cmuoybywtfi0nym..."
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-black p-2.5 text-zinc-100 placeholder-zinc-600 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1.5">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-black p-2.5 text-zinc-100 placeholder-zinc-600 outline-none focus:border-cyan-400"
            />
          </div>

          <div className="pt-1">
            <details className="text-[11px] text-zinc-400 group">
              <summary className="cursor-pointer text-cyan-400 hover:text-cyan-300 font-medium">
                Changed your in-game name recently? (Click to sync)
              </summary>
              <div className="mt-2 p-2.5 rounded-xl border border-zinc-800 bg-black/80">
                <label className="block text-zinc-300 mb-1">New in-game handle:</label>
                <input
                  type="text"
                  placeholder="e.g. Dinomite_New"
                  value={updatedInGameName}
                  onChange={(e) => setUpdatedInGameName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-100"
                />
                <p className="mt-1 text-[10px] text-zinc-500">
                  Civix will automatically update your display name across GUG and all connected apps.
                </p>
              </div>
            </details>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 p-2.5 font-bold text-black hover:from-cyan-400 hover:to-sky-400 transition-all disabled:opacity-50 mt-2 shadow-lg shadow-cyan-500/25"
          >
            {loading ? "Authenticating..." : "Sign In with Civix"}
          </button>
        </form>
      )}

      {/* TAB 2: REGISTER */}
      {tab === "register" && (
        <form onSubmit={handleRegister} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-zinc-300 mb-1">In-Game Username</label>
            <input
              type="text"
              required
              placeholder="e.g. CardinalSanjay"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-black p-2 text-zinc-100 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1">
              Parlamentum Game Profile ID or URL
            </label>
            <input
              type="text"
              required
              placeholder="e.g. cmuoybywtfi0nymjndf95o0kx or profile link"
              value={regProfileId}
              onChange={(e) => setRegProfileId(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-black p-2 text-zinc-100 outline-none focus:border-cyan-400"
            />
            <span className="text-[10px] text-zinc-500">
              Anchors your account permanently even if you change names in-game.
            </span>
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1">Master Password</label>
            <input
              type="password"
              required
              placeholder="Choose a strong password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-black p-2 text-zinc-100 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-400 mb-1">Referral Code (Optional)</label>
            <input
              type="text"
              placeholder="e.g. JOSEPH"
              value={regRefCode}
              onChange={(e) => setRegRefCode(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-black p-2 text-zinc-100 uppercase font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-zinc-400 mb-1">Email (Optional)</label>
              <input
                type="email"
                placeholder="citizen@domain.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-black p-2 text-zinc-100"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-400 mb-1">Discord (Optional)</label>
              <input
                type="text"
                placeholder="@username"
                value={regDiscord}
                onChange={(e) => setRegDiscord(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-black p-2 text-zinc-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500 p-2.5 font-bold text-black hover:bg-cyan-400 transition-all disabled:opacity-50 mt-2 shadow-lg shadow-cyan-500/25"
          >
            {loading ? "Creating Passport..." : "Create Civix Passport"}
          </button>
        </form>
      )}

      {/* TAB 3: SELF-SERVICE RECOVERY */}
      {tab === "recover" && (
        <div className="space-y-4 text-xs">
          {recStep === 1 ? (
            <form onSubmit={handleRequestRecovery} className="space-y-3">
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Lost your password? No need to ping staff. Send a zero-risk 1 Raw Iron contract in-game with a one-time verification memo to prove character ownership.
              </p>

              <div>
                <label className="block font-medium text-zinc-300 mb-1">
                  Citizen Username or Game Profile ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CardinalSanjay"
                  value={recIdentifier}
                  onChange={(e) => setRecIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-black p-2.5 text-zinc-100 outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-sky-500 p-2.5 font-bold text-black hover:bg-sky-400 transition-all disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Notary Verification Memo"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCompleteRecovery} className="space-y-3">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3">
                <span className="block text-[10px] uppercase font-bold text-cyan-300 mb-1">
                  Step 1: Send in-game contract
                </span>
                <p className="text-[11px] text-zinc-300">
                  Send 1 Raw Iron in Parlamentum with contract note:
                </p>
                <div className="mt-1.5 flex items-center justify-between rounded-lg bg-black px-2.5 py-2 font-mono text-cyan-300 font-bold border border-zinc-800">
                  <span>{recMemo}</span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-300 mb-1">
                  Step 2: Enter 6-digit code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 849201"
                  value={recCode}
                  onChange={(e) => setRecCode(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-black p-2 text-zinc-100 font-mono tracking-widest text-center"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-300 mb-1">
                  Step 3: New Master Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Choose new password"
                  value={recNewPassword}
                  onChange={(e) => setRecNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-black p-2 text-zinc-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-500 p-2.5 font-bold text-black hover:bg-emerald-400 transition-all disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Reset Password & Restore Account"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#06080e] flex flex-col justify-center items-center p-4">
      <Suspense fallback={<div className="text-zinc-500 text-xs">Loading Civix ID...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
