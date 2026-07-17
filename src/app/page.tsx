"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Shield, Upload, FileText, CheckCircle2, AlertTriangle, XCircle, Search, HelpCircle, HardDrive, Cpu, RefreshCw } from "lucide-react";

interface ReportItem {
  id?: string;
  found?: boolean;
  hash: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  registration?: string;
  audioJitter?: number;
  visualAnomalies?: number;
  metadataStatus?: string;
  compressionProfile?: string;
  confidence?: number;
  status?: string;
  aiReport?: string;
  analyst?: {
    name: string;
    role: string;
  };
  message?: string;
}

interface VerifiedReport {
  id?: string;
  found: boolean;
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
    role: string;
  };
  message?: string;
}

export default function PublicVerifyHub() {
  const [hash, setHash] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [hashingProgress, setHashingProgress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReportItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const verifiedResult = (result && result.found) ? (result as unknown as VerifiedReport) : null;

  // Client-side local hashing using Web Crypto
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setResult(null);
    setError(null);
    await processFile(selectedFile);
  };

  const processFile = async (selectedFile: File) => {
    try {
      setLoading(true);
      setHashingProgress("Reading file streams...");
      
      const arrayBuffer = await selectedFile.arrayBuffer();
      setHashingProgress("Computing SHA-256 cryptographic signature...");
      
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      
      setHash(hashHex);
      setHashingProgress("Verifying signature in public ledger...");
      await verifyHash(hashHex);
    } catch (err: unknown) {
      console.error(err);
      setError("Crypto core hashing failed. Please check browser settings.");
      setLoading(false);
    }
  };

  const verifyHash = async (targetHash: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/verify?hash=${targetHash}`);
      const data = await res.json();
      
      if (res.status === 404) {
        setResult({
          found: false,
          hash: targetHash,
          message: data.message || "Crypto signatures not matching registered ledger rows."
        });
      } else if (!res.ok) {
        throw new Error(data.error || "Internal server error occurred.");
      } else {
        setResult({
          found: true,
          ...data.report
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to query verifier api.");
    } finally {
      setLoading(false);
      setHashingProgress("");
    }
  };

  const executeQuickDemo = async (demoHash: string) => {
    setFile(null);
    setHash(demoHash);
    setResult(null);
    await verifyHash(demoHash);
  };

  // Helper formatting values
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 glassmorphism border-b border-cyan-500/10 py-4 px-6 md:px-12 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative p-2 bg-cyan-950/40 rounded-lg border border-cyan-500/30">
            <Shield className="w-6 h-6 text-cyan-400 glow-point" />
          </div>
          <span className="font-cyber font-black tracking-widest text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            VERITAS
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="px-4 py-2 text-sm text-slate-300 hover:text-cyan-400 font-medium transition-colors">
            Dashboard Panel
          </Link>
          <Link href="/login" className="px-4 py-2 text-sm font-cyber font-bold tracking-wider text-slate-900 bg-gradient-to-r from-cyan-400 to-cyan-300 rounded hover:from-cyan-300 hover:to-cyan-200 transition-all shadow-md shadow-cyan-500/10">
            SECURE LOGIN
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center py-10 px-4 md:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-3xl mb-12">
          <h1 className="font-cyber font-extrabold text-3xl sm:text-4xl md:text-5xl leading-tight mb-4 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-cyan-100 to-purple-300 uppercase">
            Ledger of Trust <br />In An Era of Manipulation
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-body">
            Veritas registers tamper-proof cryptographic identities of original media records. Drop files below to compute local signatures and verify legitimacy against the forensic ledger.
          </p>
        </div>

        {/* Verification Hub Interface */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* File input and hashing card */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="glassmorphism p-6 rounded-xl relative overflow-hidden">
              {loading && <div className="absolute inset-0 pointer-events-none overflow-hidden"><div className="laser-scan-line relative"></div></div>}
              
              <h2 className="font-cyber text-sm font-bold tracking-wider text-cyan-400 uppercase mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4" /> Cryptographic Scanner
              </h2>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-cyan-500/20 hover:border-cyan-400/50 hover:bg-cyan-950/10 rounded-lg p-8 cursor-pointer flex flex-col items-center justify-center text-center transition-all bg-slate-950/20"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <Upload className="w-10 h-10 text-cyan-400 mb-3 float-slow" />
                <p className="font-cyber text-xs tracking-wide text-slate-300 font-bold mb-1">
                  DRAG & DROP SPECIMEN
                </p>
                <p className="text-xs text-slate-500">
                  Audio or video formats supported (processed locally)
                </p>
              </div>

              {file && (
                <div className="mt-4 p-3 bg-slate-900/50 rounded border border-slate-800 flex items-start gap-3">
                  <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold truncate text-slate-300">{file.name}</p>
                    <p className="text-[10px] text-slate-500">{formatBytes(file.size)} • {file.type}</p>
                  </div>
                </div>
              )}

              {/* Manual input */}
              <div className="mt-6 border-t border-slate-900 pt-5">
                <label className="block text-[10px] uppercase font-cyber tracking-wider text-slate-500 mb-2 font-bold">
                  Or Query SHA-256 Ledger Address
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Enter 64-character hex hash signature" 
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    className="w-full bg-slate-950/80 border border-cyan-500/10 rounded pl-3 pr-8 py-2 text-[10px] sm:text-xs font-mono text-cyan-300 placeholder-slate-700 focus:outline-none focus:border-cyan-400/50"
                  />
                  <button 
                    onClick={() => hash.trim() && verifyHash(hash)}
                    disabled={loading}
                    className="absolute right-2 top-2 text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {hashingProgress && (
                <div className="mt-4 p-3 bg-cyan-950/20 border border-cyan-500/20 rounded flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
                  <span className="text-[11px] font-cyber tracking-wide text-cyan-300">{hashingProgress}</span>
                </div>
              )}
            </div>

            {/* Test Demos Box */}
            <div className="glassmorphism p-6 rounded-xl">
              <h3 className="font-cyber text-xs font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> Evaluation Demos
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                No files on hand? Try simulated ledger lookups using seeded data matching deepfake indices.
              </p>
              
              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={() => executeQuickDemo('e2dbd98d28e75cfca67a2a53d32b2e887f4c5a90c1f5449cb9431e51b68ea8af')}
                  disabled={loading}
                  className="w-full text-left p-3 rounded-lg border border-emerald-500/10 bg-emerald-950/5 hover:bg-emerald-950/15 hover:border-emerald-500/30 transition-all font-body text-xs flex justify-between items-center group"
                >
                  <div>
                    <span className="font-bold text-emerald-400 block mb-0.5">Media Original (MP4)</span>
                    <span className="text-[10px] text-slate-500 font-mono truncate block max-w-[200px] md:max-w-none">e2dbd98d28e75c...</span>
                  </div>
                  <span className="text-[10px] font-cyber font-bold tracking-wider text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/20 group-hover:scale-105 transition-transform">
                    VERIFIED
                  </span>
                </button>

                <button 
                  onClick={() => executeQuickDemo('fa857c1a84f33ebd02941df2a16dcdb58e72e128cc1bf9cd081bfca67a38b1f2')}
                  disabled={loading}
                  className="w-full text-left p-3 rounded-lg border border-red-500/10 bg-red-950/5 hover:bg-red-950/15 hover:border-red-500/30 transition-all font-body text-xs flex justify-between items-center group"
                >
                  <div>
                    <span className="font-bold text-rose-400 block mb-0.5">Synthesized Audio (WAV)</span>
                    <span className="text-[10px] text-slate-500 font-mono truncate block max-w-[200px] md:max-w-none">fa857c1a84f33e...</span>
                  </div>
                  <span className="text-[10px] font-cyber font-bold tracking-wider text-rose-400 bg-red-950/50 px-2 py-0.5 rounded border border-rose-500/20 group-hover:scale-105 transition-transform">
                    REVOKED
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Results display panel */}
          <div className="lg:col-span-7 flex flex-col gap-6 w-full">
            {error && (
              <div className="glassmorphism border-red-500/30 p-5 rounded-xl flex items-start gap-3 bg-red-950/10">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-cyber font-bold uppercase tracking-wider text-rose-400 mb-1">System Error</h4>
                  <p className="text-xs text-slate-400">{error}</p>
                </div>
              </div>
            )}

            {!result && !loading && (
              <div className="glassmorphism p-12 rounded-xl flex flex-col items-center justify-center text-center text-slate-650 min-h-[300px] bg-slate-950/10 border border-slate-900">
                <Search className="w-12 h-12 text-slate-700 mb-4 float-slow" />
                <h3 className="font-cyber font-bold text-xs uppercase tracking-wider text-slate-500 mb-1">No Specimen Queried</h3>
                <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
                  Drop a file or run one of our evaluations to inspect authentic stamps and full AI forensic analysis.
                </p>
              </div>
            )}

            {loading && (
              <div className="glassmorphism p-12 rounded-xl flex flex-col items-center justify-center text-center min-h-[300px]">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
                <h3 className="font-cyber font-bold text-xs tracking-wider text-cyan-400 mb-1 uppercase">LEdger Scan in Progress</h3>
                <p className="text-xs text-slate-500">Querying cryptographic certificates registry...</p>
              </div>
            )}

            {result && result.found === false && (
              <div className="glassmorphism border-dashed border-rose-500/30 bg-rose-950/5 p-8 rounded-xl flex flex-col items-center text-center gap-4">
                <div className="p-3 bg-rose-950/30 border border-rose-500/20 rounded-full">
                  <XCircle className="w-10 h-10 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-cyber font-extrabold text-sm tracking-wider text-rose-400 uppercase mb-2">
                    Media Integrity Unregistered
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-4">
                    The SHA-256 signature <code className="text-[11px] font-mono text-cyan-300 block bg-slate-950/50 p-2 my-2 rounded select-all break-all">{result.hash}</code> was not detected under indexed receipts. Media is either unverified or has failed registration.
                  </p>
                </div>
                <Link href="/login" className="px-4 py-2 font-cyber font-bold tracking-wider text-xs border border-rose-500/30 text-rose-400 rounded hover:bg-rose-950/20 transition-all">
                  LOG IN AS ANALYST TO RUN FORENSIC AUDIT
                </Link>
              </div>
            )}

            {verifiedResult && (
              <div className="flex flex-col gap-6">
                
                {/* Stamp & Overall Verdict Card */}
                <div className={`glassmorphism p-6 rounded-xl relative overflow-hidden border-t-4 ${
                  verifiedResult.status === 'VERIFIED' ? 'border-t-emerald-500' :
                  verifiedResult.status === 'REVOKED' ? 'border-t-rose-500 animate-pulse' : 'border-t-amber-500'
                }`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] font-cyber font-bold text-slate-500 tracking-widest uppercase block mb-1">
                        FORENSIC RECEIPT
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {verifiedResult.status === 'VERIFIED' && (
                          <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                            <h3 className="font-cyber font-black tracking-wider text-lg">VERITAS CERTIFIED GENUINE</h3>
                          </div>
                        )}
                        {verifiedResult.status === 'REVOKED' && (
                          <div className="flex items-center gap-2 text-rose-400">
                            <XCircle className="w-6 h-6 text-rose-400" />
                            <h3 className="font-cyber font-black tracking-wider text-lg">REVOKED / MANIPULATED</h3>
                          </div>
                        )}
                        {verifiedResult.status === 'SUSPICIOUS' && (
                          <div className="flex items-center gap-2 text-amber-400">
                            <AlertTriangle className="w-6 h-6 text-amber-400" />
                            <h3 className="font-cyber font-black tracking-wider text-lg">SUSPICIOUS SPECIMEN</h3>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-lg px-4 py-2 text-right">
                      <div>
                        <span className="text-[9px] font-cyber text-slate-500 block uppercase font-bold tracking-wider">
                          Authenticity Score
                        </span>
                        <span className={`font-cyber text-base font-black ${
                          verifiedResult.confidence >= 80 ? 'text-emerald-400' :
                          verifiedResult.confidence >= 50 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {verifiedResult.confidence.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid Split Content */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
                  
                  {/* Left Specs */}
                  <div className="glassmorphism p-5 rounded-xl md:col-span-6 flex flex-col gap-4">
                    <h3 className="font-cyber text-xs text-cyan-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5" /> Registry Metadata
                    </h3>
                    
                    <div className="flex flex-col gap-3 font-body text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Specimen Filename</span>
                        <span className="text-slate-200 font-semibold break-all">{verifiedResult.fileName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">File Specs</span>
                        <span className="text-slate-200 font-semibold">{formatBytes(verifiedResult.fileSize)} • {verifiedResult.mimeType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Registration Ledger Date</span>
                        <span className="text-slate-200 font-semibold">{new Date(verifiedResult.registration).toUTCString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Audit Signatory</span>
                        <span className="text-slate-200 font-semibold">{verifiedResult.analyst?.name || "Veritas AI Engine"} ({verifiedResult.analyst?.role || "SYSTEM"})</span>
                      </div>
                      <div className="pt-2 border-t border-slate-900">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider mb-1">Cryptographic Ledger Signature (SHA-256)</span>
                        <code className="text-[10px] font-mono text-cyan-300 block select-all break-all bg-slate-950/60 p-2 rounded border border-cyan-500/5">
                          {verifiedResult.hash}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Right Indicators */}
                  <div className="glassmorphism p-5 rounded-xl md:col-span-6 flex flex-col gap-4">
                    <h3 className="font-cyber text-xs text-cyan-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" /> Spectral breakdown
                    </h3>

                    <div className="flex flex-col gap-3.5 text-xs">
                      
                      {/* Audio Jitter */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400 font-medium">Acoustic Jitter Deviation</span>
                          <span className={`${verifiedResult.audioJitter > 50 ? 'text-rose-400' : 'text-slate-300'}`}>{verifiedResult.audioJitter.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              verifiedResult.audioJitter > 55 ? 'bg-gradient-to-r from-rose-500 to-rose-450' : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, verifiedResult.audioJitter))}%` }}
                          />
                        </div>
                      </div>

                      {/* Visual anomalies */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400 font-medium">Visual Matrix Aberrations</span>
                          <span className={`${verifiedResult.visualAnomalies > 50 ? 'text-rose-400' : 'text-slate-300'}`}>{verifiedResult.visualAnomalies.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              verifiedResult.visualAnomalies > 55 ? 'bg-gradient-to-r from-rose-500 to-rose-450' : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, verifiedResult.visualAnomalies))}%` }}
                          />
                        </div>
                      </div>

                      {/* Metadata profile */}
                      <div className="flex justify-between items-center py-2 px-3 bg-slate-950/60 rounded border border-slate-900 font-body text-xs">
                        <span className="text-slate-500 uppercase tracking-wide text-[9px] font-bold">Metadata Container</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-cyber font-bold tracking-wider ${
                          verifiedResult.metadataStatus === 'CLEAN' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20' :
                          verifiedResult.metadataStatus === 'STRIPPED' ? 'bg-slate-900 text-slate-400 border border-slate-800' :
                          'bg-amber-950/60 text-amber-400 border border-amber-500/20'
                        }`}>
                          {verifiedResult.metadataStatus}
                        </span>
                      </div>

                      {/* Compression profile */}
                      <div className="flex justify-between items-center py-2 px-3 bg-slate-950/60 rounded border border-slate-900 font-body text-xs">
                        <span className="text-slate-500 uppercase tracking-wide text-[9px] font-bold">Compression density</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-cyber font-bold tracking-wider ${
                          verifiedResult.compressionProfile === 'STANDARD' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20' :
                          verifiedResult.compressionProfile === 'RECOMPRESSED' ? 'bg-amber-950/60 text-amber-400 border border-amber-500/20' :
                          'bg-rose-950/60 text-rose-400 border border-rose-500/20'
                        }`}>
                          {verifiedResult.compressionProfile}
                        </span>
                      </div>

                    </div>
                  </div>

                </div>

                {/* AI Auditing Report */}
                <div className="glassmorphism p-6 rounded-xl flex flex-col gap-3.5">
                  <h3 className="font-cyber text-xs text-purple-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> AI FORENSIC LOG AUDIT
                  </h3>
                  
                  <div className="border border-purple-500/10 rounded-lg p-5 bg-slate-950/50 font-body text-xs leading-relaxed text-slate-300 max-h-[350px] overflow-y-auto whitespace-pre-wrap select-text">
                    {verifiedResult.aiReport}
                  </div>
                </div>

              </div>
            )}
            
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-cyan-500/5 text-center text-slate-500 text-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-6xl mx-auto w-full px-6">
          <p className="font-cyber uppercase tracking-widest text-[9px] font-bold text-slate-600">
            VERITAS FORENSIC GATEWAY • SECURITIZED DIGITAL TRUST
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
