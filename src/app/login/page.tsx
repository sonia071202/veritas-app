"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Key, Mail, RefreshCw, AlertTriangle, Eye, EyeOff } from "lucide-react";

export default function SecureLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrefill = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden py-12">
      {/* Decorative cyber glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-cyan-950/40 rounded-xl border border-cyan-500/30">
              <Shield className="w-7 h-7 text-cyan-400 glow-point" />
            </div>
            <span className="font-cyber font-black tracking-widest text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              VERITAS
            </span>
          </Link>
          <p className="text-xs font-cyber tracking-wider text-slate-500 uppercase">
            Secured Identity Forensic Gateway
          </p>
        </div>

        {/* Form panel */}
        <div className="glassmorphism p-8 rounded-xl shadow-2xl relative">
          <h2 className="font-cyber text-sm font-bold tracking-wider text-cyan-400 uppercase mb-6 text-center">
            Authorized Agent Login
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded bg-rose-950/20 border border-rose-500/30 flex gap-2.5 items-start">
              <AlertTriangle className="w-5 h-5 text-rose-450 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-slate-350">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-body">
            
            {/* Email input */}
            <div>
              <label className="block text-[10px] uppercase font-cyber tracking-wider text-slate-500 font-bold mb-1.5">
                Terminal Identifier (Email)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-slate-655">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="agent@veritas.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-cyan-500/10 rounded px-10 py-3 text-xs text-cyan-305 placeholder-slate-600 focus:outline-none focus:border-cyan-400/50 transition-colors"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label className="block text-[10px] uppercase font-cyber tracking-wider text-slate-500 font-bold mb-1.5">
                Passphrase
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-slate-655">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-cyan-500/10 rounded px-10 py-3 text-xs text-cyan-305 placeholder-slate-600 focus:outline-none focus:border-cyan-400/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-600 hover:text-cyan-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 font-cyber font-bold tracking-widest text-xs text-slate-950 rounded transition-all shadow-md shadow-cyan-500/10 active:opacity-90 flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  AUTHENTICATING...
                </>
              ) : (
                "INITIALIZE SESSION"
              )}
            </button>
          </form>

          {/* Seed/Test users drawer */}
          <div className="mt-8 pt-6 border-t border-slate-900">
            <h3 className="font-cyber text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-3">
              Evaluation Credentials (Click to prefill)
            </h3>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handlePrefill("admin@veritas.io", "VeritasAdmin123!")}
                type="button"
                className="w-full text-left bg-slate-950/80 hover:bg-slate-900 border border-cyan-500/10 hover:border-cyan-500/30 p-2.5 rounded flex justify-between items-center text-[11px] transition-colors"
              >
                <div>
                  <span className="text-purple-400 font-bold block">Administrator Role</span>
                  <span className="text-[10px] text-slate-500 font-mono">admin@veritas.io</span>
                </div>
                <span className="text-[9px] font-cyber text-slate-400 uppercase bg-purple-950/30 border border-purple-500/20 px-2 py-0.5 rounded">
                  Admin
                </span>
              </button>

              <button
                onClick={() => handlePrefill("analyst@veritas.io", "VeritasAnalyst123!")}
                type="button"
                className="w-full text-left bg-slate-950/80 hover:bg-slate-900 border border-cyan-500/10 hover:border-cyan-500/30 p-2.5 rounded flex justify-between items-center text-[11px] transition-colors"
              >
                <div>
                  <span className="text-cyan-400 font-bold block">Forensic Analyst Role</span>
                  <span className="text-[10px] text-slate-500 font-mono">analyst@veritas.io</span>
                </div>
                <span className="text-[9px] font-cyber text-slate-400 uppercase bg-cyan-950/30 border border-cyan-500/20 px-2 py-0.5 rounded">
                  Analyst
                </span>
              </button>

              <button
                onClick={() => handlePrefill("auditor@veritas.io", "VeritasAuditor123!")}
                type="button"
                className="w-full text-left bg-slate-950/80 hover:bg-slate-900 border border-cyan-500/10 hover:border-cyan-500/30 p-2.5 rounded flex justify-between items-center text-[11px] transition-colors"
              >
                <div>
                  <span className="text-emerald-400 font-bold block">Media Auditor Role</span>
                  <span className="text-[10px] text-slate-500 font-mono">auditor@veritas.io</span>
                </div>
                <span className="text-[9px] font-cyber text-slate-400 uppercase bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5 rounded">
                  Auditor
                </span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500 font-body">
            Need an auditor account?{" "}
            <Link href="/register" className="text-cyan-400 hover:underline">
              Register Credentials
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
