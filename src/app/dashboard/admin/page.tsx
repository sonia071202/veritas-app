"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ChevronLeft, RefreshCw, Search, ShieldAlert, Key, Database, RefreshCcw } from "lucide-react";

interface AuditLogItem {
  id: string;
  userId: string;
  action: string;
  details: string;
  ipAddress: string | null;
  timestamp: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function AdminAuditLogs() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const verifyAdminSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.user?.role !== "ADMIN") {
        router.push("/dashboard");
      }
    } catch {
      router.push("/login");
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/audit");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyAdminSession();
    fetchLogs();
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "USER_LOGIN":
        return <span className="px-2 py-0.5 rounded text-[9px] font-cyber font-bold tracking-wider bg-cyan-950/60 text-cyan-400 border border-cyan-500/20">USER LOGIN</span>;
      case "USER_REGISTER":
        return <span className="px-2 py-0.5 rounded text-[9px] font-cyber font-bold tracking-wider bg-purple-950/60 text-purple-400 border border-purple-500/20">AGENT REGISTER</span>;
      case "REPORT_CREATE":
        return <span className="px-2 py-0.5 rounded text-[9px] font-cyber font-bold tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">REPORT ADD</span>;
      case "REPORT_REVOKE":
        return <span className="px-2 py-0.5 rounded text-[9px] font-cyber font-bold tracking-wider bg-amber-955/60 text-amber-400 border border-amber-500/20">REPORT REVOKE</span>;
      case "REPORT_DELETE":
        return <span className="px-2 py-0.5 rounded text-[9px] font-cyber font-bold tracking-wider bg-rose-955/60 text-rose-455 border border-rose-500/20">REPORT PURGE</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[9px] font-cyber font-bold tracking-wider bg-slate-900 text-slate-400 border border-slate-800">{action}</span>;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(search.toLowerCase()) || 
                          log.user.name.toLowerCase().includes(search.toLowerCase()) ||
                          log.user.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar Header */}
      <header className="sticky top-0 z-40 glassmorphism border-b border-cyan-500/10 py-4 px-6 md:px-12 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/40 rounded-lg border border-cyan-500/30">
            <Shield className="w-5 h-5 text-cyan-400 glow-point" />
          </div>
          <span className="font-cyber font-black tracking-widest text-base text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            VERITAS PORTAL
          </span>
        </Link>
        <Link href="/dashboard" className="px-4 py-2 border border-slate-800 hover:border-cyan-400 hover:text-cyan-400 rounded text-xs font-cyber font-bold tracking-wider transition-colors flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> DASHBOARD PANEL
        </Link>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-cyber font-bold text-lg md:text-xl tracking-wider text-slate-100 uppercase flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-400" /> SYSTEM AUDIT LOGS
            </h1>
            <p className="text-xs text-slate-500 font-body animate-pulse">
              System transaction records monitor trail. Access restricted strictly to administrative agents.
            </p>
          </div>
          <button 
            onClick={fetchLogs} 
            disabled={loading}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-cyan-400 rounded text-slate-400 transition-all active:scale-95"
            title="Refresh Logs History"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-950/45 p-4 rounded-xl border border-slate-900">
          
          {/* Search bar query */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-3 text-slate-655">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="Filter by agent details or logging event details..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/80 border border-cyan-500/10 rounded px-10 py-2.5 text-xs text-cyan-305 placeholder-slate-600 focus:outline-none focus:border-cyan-405/50 font-body transition-colors"
            />
          </div>

          {/* Action category filter */}
          <div>
            <select 
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-950/80 border border-cyan-500/10 rounded px-3 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-cyan-405/50 font-body cursor-pointer"
            >
              <option value="ALL">ALL LOGS</option>
              <option value="USER_LOGIN">USER LOGINS</option>
              <option value="USER_REGISTER">AGENT REGISTRANDS</option>
              <option value="REPORT_CREATE">REPORT ADDITIONS</option>
              <option value="REPORT_REVOKE">REPORT REVOCATIONS</option>
              <option value="REPORT_DELETE">REPORT PURGES</option>
            </select>
          </div>

        </div>

        {/* Audit Table Grid */}
        <div className="glassmorphism rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-body">
              <thead>
                <tr className="border-b border-cyan-500/10 bg-slate-950/30 uppercase text-[9px] font-cyber tracking-wider text-slate-500">
                  <th className="p-4 font-bold">Action</th>
                  <th className="p-4 font-bold">Auditor Agent</th>
                  <th className="p-4 font-bold">Log Event Details</th>
                  <th className="p-4 font-bold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center">
                      <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin mx-auto mb-2" />
                      <span className="text-slate-500">Retrieving operational ledgers...</span>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No matching audit records identified.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-900/60 hover:bg-purple-950/5 transition-colors">
                      <td className="p-4">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-205 block">{log.user.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{log.user.email} • {log.user.role}</span>
                      </td>
                      <td className="p-4 text-slate-300 break-words max-w-[400px] select-text">
                        {log.details}
                      </td>
                      <td className="p-4 text-right text-slate-500 font-mono text-[10px]">
                        {new Date(log.timestamp).toUTCString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="mt-auto py-5 border-t border-cyan-500/5 text-center text-slate-500 text-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-6xl mx-auto w-full px-6">
          <p className="font-cyber font-bold tracking-widest text-[9px] uppercase text-slate-600">
            VERITAS FORENSIC GATEWAY • INTERNAL ADMINISTRATIVE NETWORK
          </p>
          <div className="flex items-center gap-3 font-cyber text-[10px] uppercase font-bold tracking-wider">
            <span className="text-slate-600">DEVELOPED BY:</span>
            <span className="text-cyan-400">Sonia Gupta</span>
            <span className="text-slate-800">|</span>
            <a 
              href="https://github.com/sonia071202" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-slate-500 hover:text-cyan-300 transition-colors"
            >
              GITHUB
            </a>
            <span className="text-slate-800">|</span>
            <a 
              href="https://www.linkedin.com/in/sonia-gupta-a46263278/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-slate-500 hover:text-cyan-300 transition-colors"
            >
              LINKEDIN
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
