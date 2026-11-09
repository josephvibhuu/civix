"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, KeyRound, Sparkles, UserPlus, RefreshCw, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

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

      if (returnTo.startsWith("http")) {
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setSuccess("Account passport created! Redirecting...");
      setTimeout(() => {
        if (returnTo.startsWith("http")) {
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
    <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2 mb-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-700 shadow-md shadow-amber-500/20">
            <Shield className="h-5 w-5 text-zinc-950 stroke-[2.5]" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">CIVIX ID</span>
        </Link>
        <p className="text-xs text-zinc-400">
          The sovereign passport for all Parlamentum applications
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-950 p-1 mb-6 text-xs font-semibold">
        <button
          onClick={() => {
            setTab("login");
            setError(null);
          }}
          className={`rounded-md py-1.5 transition-all ${
            tab === "login" ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:text-white"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            setTab("register");
            setError(null);
          }}
          className={`rounded-md py-1.5 transition-all ${
            tab === "register" ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:text-white"
          }`}
        >
          Register
        </button>
        <button
          onClick={() => {
            setTab("recover");
            setError(null);
          }}
          className={`rounded-md py-1.5 transition-all ${
            tab === "recover" ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:text-white"
          }`}
        >
          Recovery
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
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
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-zinc-100 placeholder-zinc-600 outline-none focus:border-amber-500"
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
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-zinc-100 placeholder-zinc-600 outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-1">
            <details className="text-[11px] text-zinc-400 group">
              <summary className="cursor-pointer text-amber-400 hover:text-amber-300 font-medium">
                Changed your in-game name recently? (Click to sync)
              </summary>
              <div className="mt-2 p-2.5 rounded border border-zinc-800 bg-zinc-950/80">
                <label className="block text-zinc-300 mb-1">New in-game handle:</label>
                <input
                  type="text"
                  placeholder="e.g. Dinomite_New"
                  value={updatedInGameName}
                  onChange={(e) => setUpdatedInGameName(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-100"
                />
                <p className="mt-1 text-[10px] text-zinc-500">
                  Civix will automatically update your display name across GUG, Colosseo, and all apps.
                </p>
              </div>
            </details>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 p-2.5 font-bold text-zinc-950 hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50 mt-2"
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
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 outline-none focus:border-amber-500"
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
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 outline-none focus:border-amber-500"
            />
            <span className="text-[10px] text-zinc-500">
              Anchors your account permanently even if you change names in game.
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
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 outline-none focus:border-amber-500"
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
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-zinc-100"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-400 mb-1">Discord (Optional)</label>
              <input
                type="text"
                placeholder="@username"
                value={regDiscord}
                onChange={(e) => setRegDiscord(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-zinc-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-500 p-2.5 font-bold text-zinc-950 hover:bg-amber-400 transition-all disabled:opacity-50 mt-2"
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
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-zinc-100 outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-sky-500 p-2.5 font-bold text-zinc-950 hover:bg-sky-400 transition-all disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Notary Verification Memo"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCompleteRecovery} className="space-y-3">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <span className="block text-[10px] uppercase font-bold text-amber-400 mb-1">
                  Step 1: Send in-game contract
                </span>
                <p className="text-[11px] text-zinc-300">
                  Send 1 Raw Iron in Parlamentum with contract note:
                </p>
                <div className="mt-1.5 flex items-center justify-between rounded bg-zinc-950 px-2 py-1.5 font-mono text-amber-300 font-bold">
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
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-zinc-100 font-mono tracking-widest text-center"
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
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-zinc-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-500 p-2.5 font-bold text-zinc-950 hover:bg-emerald-400 transition-all disabled:opacity-50"
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
    <div className="min-h-screen bg-[#07090e] flex flex-col justify-center items-center p-4">
      <Suspense fallback={<div className="text-zinc-500 text-xs">Loading Civix ID...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
