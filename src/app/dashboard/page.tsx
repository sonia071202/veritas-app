"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Shield, CheckCircle2, AlertTriangle, XCircle, Search, LogOut, Plus, 
  Database, RefreshCw, BarChart2, Calendar, FileText, ClipboardList, Trash2, Eye, Ban
} from "lucide-react";

interface ReportItem {
  hash: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  registration: string;
  audioJitter: number;
  visualAnomalies: number;
  metadataStatus: string;
  compressionProfile: string;
  confidence: number;
  status: string;
  aiReport: string;
  analyst?: {
    name: string;
    email: string;
  };
}

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch {
      router.push("/login");
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports?status=${statusFilter}&search=${search}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Failed to query reports API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user, statusFilter, search]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Actions
  const handleToggleStatus = async (item: ReportItem) => {
    if (!user || user.role !== "ADMIN") return;
    try {
      setActionLoading(true);
      setMessage(null);
      const nextStatus = item.status === "VERIFIED" ? "REVOKED" : "VERIFIED";
      const nextConfidence = nextStatus === "VERIFIED" ? 95 : 20;

      const res = await fetch(`/api/reports/${item.hash}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, confidence: nextConfidence }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update report status.");
      }

      const updatedData = await res.json();
      setMessage({ type: "success", text: `Updated status of ${item.fileName} to ${nextStatus}` });
      
      // Update local report details inside view modal or table
      setReports(prev => prev.map(r => r.hash === item.hash ? { ...r, status: nextStatus, confidence: nextConfidence } : r));
      if (selectedReport?.hash === item.hash) {
        setSelectedReport(prev => prev ? { ...prev, status: nextStatus, confidence: nextConfidence } : null);
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update record." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReport = async (item: ReportItem) => {
    if (!user || user.role !== "ADMIN" || !confirm(`Permanently purge ${item.fileName} from the forensic ledger?`)) return;
    try {
      setActionLoading(true);
      setMessage(null);

      const res = await fetch(`/api/reports/${item.hash}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to remove report.");
      }

      setMessage({ type: "success", text: `Purged ${item.fileName} from verification indexes.` });
      setReports(prev => prev.filter(r => r.hash !== item.hash));
      setSelectedReport(null);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Deletion failed." });
    } finally {
      setActionLoading(false);
    }
  };

  // Compute key indices data
  const totalAnalyzed = reports.length;
  const verifiedCount = reports.filter(r => r.status === "VERIFIED").length;
  const warningsCount = reports.filter(r => r.status === "SUSPICIOUS" || r.status === "REVOKED").length;
  
  const averageConfidence = totalAnalyzed > 0 
    ? reports.reduce((acc, curr) => acc + curr.confidence, 0) / totalAnalyzed 
    : 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-cyber font-bold tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">VERIFIED</span>;
      case "REVOKED":
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-cyber font-bold tracking-wider bg-rose-950/60 text-rose-450 border border-rose-500/20">REVOKED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-cyber font-bold tracking-wider bg-amber-950/60 text-amber-400 border border-amber-500/20">SUSPICIOUS</span>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 glassmorphism border-b border-cyan-500/10 py-4 px-6 md:px-12 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/40 rounded-lg border border-cyan-500/30">
            <Shield className="w-5 h-5 text-cyan-400 glow-point" />
          </div>
          <span className="font-cyber font-black tracking-widest text-base text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            VERITAS PORTAL
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-5">
            <div className="hidden sm:flex flex-col text-right font-body text-xs">
              <span className="font-bold text-slate-200">{user.name}</span>
              <span className="text-[10px] font-cyber text-cyan-400 uppercase tracking-wider">{user.role}</span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="p-2 bg-slate-900 border border-slate-800 hover:border-cyan-400 hover:text-cyan-400 rounded text-slate-400 transition-colors"
              title="Terminate Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
        
        {/* Subheader Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-cyber font-bold text-lg md:text-xl tracking-wider text-slate-100 uppercase">
              Forensic Audits Ledger
            </h1>
            <p className="text-xs text-slate-500 font-body">
              Internal system records index. Verify, update, or revoke cryptographic integrity certifications.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {user && ["ADMIN", "ANALYST"].includes(user.role) && (
              <Link 
                href="/dashboard/analyze" 
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 font-cyber font-bold text-xs tracking-wider text-slate-950 rounded transition-all shadow-md shadow-cyan-500/10"
              >
                <Plus className="w-4 h-4" /> NEW FORENSIC RUN
              </Link>
            )}

            {user && user.role === "ADMIN" && (
              <Link 
                href="/dashboard/admin"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-855 border border-slate-800 hover:border-cyan-400 text-slate-300 font-cyber font-bold text-xs tracking-wider rounded transition-all"
              >
                <ClipboardList className="w-4 h-4 text-cyan-400" /> SYSTEM AUDIT LOGS
              </Link>
            )}
          </div>
        </div>

        {/* Messaging Feedback */}
        {message && (
          <div className={`p-4 rounded border flex items-start gap-3 ${
            message.type === 'success' ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' : 'bg-rose-950/20 border-rose-500/30 text-rose-455'
          }`}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-xs font-body font-semibold">{message.text}</span>
          </div>
        )}

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glassmorphism p-5 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/20 rounded-lg text-cyan-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-cyber text-slate-500 uppercase tracking-wider font-bold">Specimens Indexed</span>
              <h3 className="font-cyber font-extrabold text-xl text-slate-100 mt-0.5">{totalAnalyzed}</h3>
            </div>
          </div>

          <div className="glassmorphism p-5 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/25 rounded-lg text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-cyber text-slate-500 uppercase tracking-wider font-bold">Authentic Count</span>
              <h3 className="font-cyber font-extrabold text-xl text-slate-100 mt-0.5">{verifiedCount}</h3>
            </div>
          </div>

          <div className="glassmorphism p-5 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-rose-950/40 border border-rose-500/25 rounded-lg text-rose-455">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-cyber text-slate-500 uppercase tracking-wider font-bold">Manipulated Alerts</span>
              <h3 className="font-cyber font-extrabold text-xl text-slate-100 mt-0.5">{warningsCount}</h3>
            </div>
          </div>

          <div className="glassmorphism p-5 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-purple-950/40 border border-purple-500/25 rounded-lg text-purple-400">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-cyber text-slate-500 uppercase tracking-wider font-bold">ledger avg rating</span>
              <h3 className="font-cyber font-extrabold text-xl text-slate-100 mt-0.5">{averageConfidence.toFixed(1)}%</h3>
            </div>
          </div>
        </div>

        {/* Dashboard Split: Chart & Filter Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Custom SVG Graphic (Visual Distribution Chart - Low Dependencies) */}
          <div className="lg:col-span-4 glassmorphism p-6 rounded-xl flex flex-col gap-4">
            <h3 className="font-cyber text-xs text-cyan-400 font-bold uppercase tracking-wider mb-2">
              Authenticity Rating distribution
            </h3>
            
            {totalAnalyzed === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-body">No data to display.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* SVG Radial Arc Chart */}
                <div className="relative flex justify-center py-4">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle cx="80" cy="80" r="60" stroke="#0f172a" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="80" 
                      cy="80" 
                      r="60" 
                      stroke="url(#cyanGlow)" 
                      strokeWidth="10" 
                      fill="transparent" 
                      strokeDasharray="377" 
                      strokeDashoffset={377 - (377 * averageConfidence) / 100}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c084fc" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-cyber">
                    <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                      {averageConfidence.toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      Avg Rating
                    </span>
                  </div>
                </div>

                {/* Grid Progress Visuals */}
                <div className="flex flex-col gap-3 text-xs font-body">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Certified Genuine (VERIFIED):</span>
                    <span className="font-bold text-emerald-400">{verifiedCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Unverified Deviations (SUSPICIOUS):</span>
                    <span className="font-bold text-amber-400">{reports.filter(r => r.status === "SUSPICIOUS").length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Revoked Manipulations (REVOKED):</span>
                    <span className="font-bold text-rose-455">{reports.filter(r => r.status === "REVOKED").length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Grid Ledger List */}
          <div className="lg:col-span-8 flex flex-col gap-4 w-full">
            
            {/* Header controls for Table */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-950/45 p-4 rounded-xl border border-slate-900">
              
              {/* Search */}
              <div className="relative flex-1">
                <span className="absolute left-3 top-3 text-slate-655 pointer-events-none">
                  <Search className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  placeholder="Query filename or hash..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950/80 border border-cyan-500/10 rounded px-10 py-2.5 text-xs text-cyan-305 placeholder-slate-600 focus:outline-none focus:border-cyan-405/50 font-body transition-colors"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-cyber text-slate-500 uppercase tracking-widest font-bold hidden md:inline">Filter Output:</span>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950/80 border border-cyan-500/10 rounded px-3 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-cyan-405/50 font-body cursor-pointer"
                >
                  <option value="ALL">ALL VERDICTS</option>
                  <option value="VERIFIED">CERTIFIED VERIFIED</option>
                  <option value="SUSPICIOUS">SUSPICIOUS</option>
                  <option value="REVOKED">REVOKED / MANIPULATED</option>
                </select>
              </div>

            </div>

            {/* Data Grid Content */}
            <div className="glassmorphism rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-body">
                  <thead>
                    <tr className="border-b border-cyan-500/10 bg-slate-950/30 uppercase text-[9px] font-cyber tracking-wider text-slate-500">
                      <th className="p-4 font-bold">Specimen Filename</th>
                      <th className="p-4 font-bold">Ledger Hash Reference</th>
                      <th className="p-4 font-bold">Rating</th>
                      <th className="p-4 font-bold">Verdict</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center">
                          <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin mx-auto mb-2" />
                          <span className="text-slate-500">Loading registry database entry rows...</span>
                        </td>
                      </tr>
                    ) : reports.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          No media verifications fit these parameters.
                        </td>
                      </tr>
                    ) : (
                      reports.map((report) => (
                        <tr key={report.hash} className="border-b border-slate-900/60 hover:bg-cyan-950/5 transition-colors">
                          <td className="p-4">
                            <span className="font-semibold text-slate-200 block truncate max-w-[170px]">{report.fileName}</span>
                            <span className="text-[10px] text-slate-500">{formatBytes(report.fileSize)} • {report.mimeType}</span>
                          </td>
                          <td className="p-4 font-mono text-[10px] text-cyan-400 select-all">
                            {report.hash.slice(0, 12)}...
                          </td>
                          <td className={`p-4 font-cyber font-extrabold ${
                            report.confidence >= 80 ? 'text-emerald-400' :
                            report.confidence >= 50 ? 'text-amber-400' : 'text-rose-455'
                          }`}>
                            {report.confidence.toFixed(1)}%
                          </td>
                          <td className="p-4">
                            {getStatusBadge(report.status)}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button 
                                onClick={() => setSelectedReport(report)}
                                className="p-2 bg-slate-900 border border-slate-800 hover:border-cyan-500 text-cyan-400 rounded hover:bg-cyan-950/20 transition-colors"
                                title="Inspect Credentials"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {user && user.role === "ADMIN" && (
                                <>
                                  <button 
                                    onClick={() => handleToggleStatus(report)}
                                    disabled={actionLoading}
                                    className={`p-2 bg-slate-900 border border-slate-800 rounded transition-colors ${
                                      report.status === "VERIFIED" 
                                        ? "hover:border-rose-500 text-rose-450 hover:bg-rose-950/10" 
                                        : "hover:border-emerald-500 text-emerald-400 hover:bg-emerald-950/10"
                                    }`}
                                    title={report.status === "VERIFIED" ? "Revoke Verification" : "Certify Legitimacy"}
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>

                                  <button 
                                    onClick={() => handleDeleteReport(report)}
                                    disabled={actionLoading}
                                    className="p-2 bg-slate-900 border border-slate-800 hover:border-rose-500 text-rose-455 rounded hover:bg-rose-950/20 transition-colors"
                                    title="Purge Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Forensic Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 py-10 px-4">
          <div className="w-full max-w-3xl glassmorphism rounded-xl flex flex-col max-h-[85vh] overflow-hidden border border-cyan-400/20 shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-cyan-500/10 bg-slate-950/40">
              <div>
                <span className="text-[10px] font-cyber text-slate-500 uppercase tracking-widest font-bold">Ledger Specimen Detailed Summary</span>
                <h3 className="font-cyber font-bold text-sm text-cyan-400 truncate max-w-[400px] mt-0.5">
                  {selectedReport.fileName}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-840 rounded hover:border-cyan-400 hover:text-cyan-400 text-xs font-cyber font-bold tracking-wider transition-colors"
              >
                CLOSE [ESC]
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 text-xs select-text">
              
              {/* Verdict header block */}
              <div className={`p-4 rounded-lg flex justify-between items-center border ${
                selectedReport.status === 'VERIFIED' ? 'bg-emerald-950/10 border-emerald-500/20 text-emerald-400' :
                selectedReport.status === 'REVOKED' ? 'bg-rose-950/10 border-rose-500/20 text-rose-455' :
                'bg-amber-955/10 border-amber-500/20 text-amber-400'
              }`}>
                <div>
                  <span className="text-[9px] uppercase font-cyber tracking-widest block font-bold mb-0.5 opacity-60">Ledger Verdict Status</span>
                  <span className="font-cyber font-black tracking-wider text-sm uppercase">
                    {selectedReport.status === 'VERIFIED' && 'Verified Genuineness Certificate Active'}
                    {selectedReport.status === 'REVOKED' && 'Cryptographic Certificate Revoked'}
                    {selectedReport.status === 'SUSPICIOUS' && 'Warning: Unverified Anomalous Signatures'}
                  </span>
                </div>
                
                <div className="text-right">
                  <span className="text-[9px] uppercase font-cyber tracking-widest block font-bold mb-0.5 opacity-60">Confidence Rating</span>
                  <span className="font-cyber font-black text-sm">{selectedReport.confidence.toFixed(1)}%</span>
                </div>
              </div>

              {/* Grid Metadata Spec */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                
                {/* Specs */}
                <div className="p-4 bg-slate-950/50 rounded border border-slate-900 flex flex-col gap-3 font-body">
                  <h4 className="font-cyber text-[10px] font-bold text-cyan-400 uppercase tracking-widest border-b border-slate-900 pb-2 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" /> SPECIMEN DATA
                  </h4>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">SHA-256 Ledger Address</span>
                    <code className="text-[10px] font-mono text-cyan-300 block select-all break-all bg-slate-950 p-2 rounded border border-cyan-500/5">{selectedReport.hash}</code>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Analyst Auditor Signatory</span>
                    <span className="text-slate-200 font-semibold">{selectedReport.analyst?.name || "Veritas Engine"} ({selectedReport.analyst?.email || "system@veritas.io"})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Registration Ledger Date</span>
                    <span className="text-slate-205 font-semibold text-slate-350">{new Date(selectedReport.registration).toUTCString()}</span>
                  </div>
                </div>

                {/* Hyper indicators */}
                <div className="p-4 bg-slate-950/50 rounded border border-slate-900 flex flex-col gap-4 font-body">
                  <h4 className="font-cyber text-[10px] font-bold text-cyan-400 uppercase tracking-widest border-b border-slate-900 pb-2 flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5" /> METRICS BREAKDOWN
                  </h4>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1 text-[10px]">
                      <span className="text-slate-400 font-medium">Acoustic Jitter Amplitude:</span>
                      <span className="font-semibold">{selectedReport.audioJitter.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                      <div className="h-full rounded-full bg-cyan-400" style={{ width: `${selectedReport.audioJitter}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1 text-[10px]">
                      <span className="text-slate-400 font-medium">Visual Matrix Aberration:</span>
                      <span className="font-semibold">{selectedReport.visualAnomalies.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                      <div className="h-full rounded-full bg-purple-400" style={{ width: `${selectedReport.visualAnomalies}%` }}></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] py-1 border-t border-slate-900 mt-1">
                    <span className="text-slate-500 block uppercase font-bold tracking-wider">Metadata Status</span>
                    <span className="text-slate-205 font-bold text-cyan-400">{selectedReport.metadataStatus}</span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] py-1">
                    <span className="text-slate-500 block uppercase font-bold tracking-wider">Compression density</span>
                    <span className="text-slate-205 font-bold text-purple-400">{selectedReport.compressionProfile}</span>
                  </div>
                </div>

              </div>

              {/* Expert written auditing logs */}
              <div className="flex flex-col gap-2">
                <span className="text-slate-500 block text-[9px] uppercase font-cyber font-bold tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-400" /> AI Forensics Audits Documentations
                </span>
                
                <div className="border border-purple-500/10 rounded-lg p-5 bg-slate-950/80 leading-relaxed text-slate-300 max-h-[300px] overflow-y-auto whitespace-pre-wrap font-body text-xs">
                  {selectedReport.aiReport}
                </div>
              </div>

            </div>

            {/* Modal Admin controls footer */}
            {user?.role === "ADMIN" && (
              <div className="p-4 bg-slate-950/60 border-t border-slate-900 flex justify-between items-center gap-4">
                <span className="text-[10px] font-cyber font-bold text-slate-500 uppercase tracking-wider">
                  Administrative overrides unlocked
                </span>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleToggleStatus(selectedReport)}
                    disabled={actionLoading}
                    className={`px-3 py-1.5 rounded font-cyber text-xs font-bold tracking-wide transition-all border flex items-center gap-1.5 ${
                      selectedReport.status === "VERIFIED"
                        ? "border-rose-500/30 text-rose-455 hover:bg-rose-950/20"
                        : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/20"
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    {selectedReport.status === "VERIFIED" ? "REVOKE AUTHENTICITY" : "RESTORE CERTIFICATION"}
                  </button>

                  <button 
                    onClick={() => handleDeleteReport(selectedReport)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-rose-955/20 hover:bg-rose-955/35 border border-rose-500/30 hover:border-rose-500 text-rose-455 font-cyber text-xs font-bold tracking-wide rounded transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> PURGE LEDGER RECORD
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto py-5 border-t border-cyan-500/5 text-center text-slate-500 text-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full px-6">
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
