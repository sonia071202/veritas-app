"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Key, Mail, User, ShieldAlert, RefreshCw, AlertTriangle, Eye, EyeOff } from "lucide-react";

export default function SecureRegister() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ANALYST");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration request failed.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden py-12">
      {/* Background glow layers */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10 animate-pulse"></div>

      <div className="w-full max-w-md">
        {/* Header Title */}
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
            Create Forensic Audit Network Credentials
          </p>
        </div>

        {/* Panel Form */}
        <div className="glassmorphism p-8 rounded-xl shadow-2xl relative">
          <h2 className="font-cyber text-sm font-bold tracking-wider text-cyan-400 uppercase mb-6 text-center">
            Register Agent Keys
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded bg-rose-950/20 border border-rose-500/30 flex gap-2.5 items-start">
              <AlertTriangle className="w-5 h-5 text-rose-455 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-slate-350">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-body">
            
            {/* Name Input */}
            <div>
              <label className="block text-[10px] uppercase font-cyber tracking-wider text-slate-500 font-bold mb-1.5">
                Full Legal Name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-slate-655">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Inspector Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-cyan-500/10 rounded px-10 py-3 text-xs text-cyan-305 placeholder-slate-600 focus:outline-none focus:border-cyan-400/50 transition-colors"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-[10px] uppercase font-cyber tracking-wider text-slate-500 font-bold mb-1.5">
                Electronic Mail Address
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

            {/* Password Input */}
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
                  className="absolute right-3 top-3 text-slate-600 hover:text-cyan-405"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role Select */}
            <div>
              <label className="block text-[10px] uppercase font-cyber tracking-wider text-slate-500 font-bold mb-1.5">
                Assigned Operational Role
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-slate-655">
                  <ShieldAlert className="w-4 h-4" />
                </span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950/80 border border-cyan-500/10 rounded px-10 py-3 text-xs text-cyan-305 focus:outline-none focus:border-cyan-400/50 appearance-none transition-colors cursor-pointer"
                >
                  <option value="ANALYST">FORENSIC ANALYST</option>
                  <option value="AUDITOR">MEDIA AUDITOR</option>
                  <option value="ADMIN">ADMINISTRATOR</option>
                </select>
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
                  CREATING ACCOUNT...
                </>
              ) : (
                "REGISTER AGENT KEYS"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 font-body">
            Already have an active key?{" "}
            <Link href="/login" className="text-cyan-400 hover:underline">
              Terminal Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
