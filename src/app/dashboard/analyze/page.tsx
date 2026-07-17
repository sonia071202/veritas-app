"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Shield, Cpu, FileText, ChevronLeft, Upload, RefreshCw, 
  Terminal, Play, CheckCircle2, Clipboard
} from "lucide-react";

interface LogMessage {
  text: string;
  type: "info" | "success" | "warn";
  timestamp: string;
}

export default function ForensicConsole() {
  const router = useRouter();
  
  // File details
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [mimeType, setMimeType] = useState("video/mp4");
  const [hash, setHash] = useState("");
  
  // Custom forensic attributes for auditing simulation
  const [audioJitter, setAudioJitter] = useState(15);
  const [visualAnomalies, setVisualAnomalies] = useState(10);
  const [metadataStatus, setMetadataStatus] = useState("CLEAN");
  const [compressionProfile, setCompressionProfile] = useState("STANDARD");
  
  // State machine of verification pipeline
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanLogs, setScanLogs] = useState<LogMessage[]>([]);
  const [reportResult, setReportResult] = useState<any | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute live confidence indicator
  const calculatedConfidence = Math.max(0, Math.min(100, 
    100 
    - (audioJitter * 0.4) 
    - (visualAnomalies * 0.4) 
    - (metadataStatus !== "CLEAN" ? 12 : 0)
    - (compressionProfile === "ANOMALOUS" ? 15 : compressionProfile === "RECOMPRESSED" ? 5 : 0)
  ));
  
  const calculatedStatus = calculatedConfidence >= 80 ? "VERIFIED" : calculatedConfidence >= 50 ? "SUSPICIOUS" : "REVOKED";

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSize(selectedFile.size);
    setMimeType(selectedFile.type || "video/mp4");
    
    // Hash selection immediately in browser
    try {
      setHash("Generating SHA-255...");
      const arrayBuffer = await selectedFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      setHash(hashHex);
    } catch (err) {
      console.error(err);
      setHash("fa857c1a84f33ebd02941df2a16dcdb58e72e128cc1bf9cd08" + Math.floor(Math.random()*1000));
    }
  };

  const addLog = (text: string, type: "info" | "success" | "warn" = "info") => {
    const time = new Date().toLocaleTimeString();
    setScanLogs(prev => [...prev, { text, type, timestamp: time }]);
  };

  const executePipeline = async () => {
    if (!fileName || !hash) {
      setError("Please select a media specimen file or generate hash first.");
      return;
    }

    setScanning(true);
    setScanComplete(false);
    setScanLogs([]);
    setError(null);
    setReportResult(null);

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Pipeline tasks animation sequence
    addLog(`INITIALIZING DIGITAL FORENSIC SCALES FOR: ${fileName}`, "info");
    await sleep(700);
    
    addLog(`COMPUTING CRYTOGRAPHIC HASH AND STREAM INTEGRITY...`, "info");
    await sleep(500);
    addLog(`CRYPTOGRAPHIC HASH VERIFIED: SHA-256 [${hash.slice(0, 24)}...]`, "success");
    await sleep(700);

    addLog(`EXTRACTING METADATA CONTAINERS AND EXIF TAGS...`, "info");
    await sleep(500);
    addLog(`CONTAINER PROFILE IDENTIFIED AS: ${metadataStatus}`, metadataStatus === "CLEAN" ? "success" : "warn");
    await sleep(600);

    addLog(`EXAMINING COMPRESSION DEVIATIONS AND QUANTIZATION ENVELOPE...`, "info");
    await sleep(400);
    addLog(`COMPRESSION PROFILE QUANTIZED: ${compressionProfile}`, compressionProfile === "STANDARD" ? "success" : "warn");
    await sleep(500);

    addLog(`SCANNING AUDIO TRACK FREQUENCY JITTER AND PHASE ALIGNMENT...`, "info");
    await sleep(650);
    addLog(`VOICE TRACK JITTER RATE DETERMINED AT: ${audioJitter.toFixed(1)}%`, audioJitter < 30 ? "success" : "warn");
    await sleep(500);

    addLog(`CALCULATING VISUAL ARTIFACTS AND LIGHTING VECTOR SHADING...`, "info");
    await sleep(600);
    addLog(`VISUAL ABERRANT INDEX REPORTED AT: ${visualAnomalies.toFixed(1)}%`, visualAnomalies < 30 ? "success" : "warn");
    await sleep(700);

    addLog(`DISPATCHING SPECTRAL INDICES TO VERITAS GENERATIVE AI AUDITOR...`, "info");
    
    try {
      // Connect to server route to trigger Gemini (or simulated report generator)
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          fileSize,
          mimeType,
          hash,
          audioJitter,
          visualAnomalies,
          metadataStatus,
          compressionProfile,
          confidence: calculatedConfidence,
          status: calculatedStatus
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed write to registry.");
      }

      await sleep(1000);
      addLog(`AI FORENSIC SCHEMATICS SYNTHESIZED SUCCESSFULLY.`, "success");
      addLog(`MEDIA SPECIMEN AUDITED AUTHENTICITY CONFIDENCE: ${calculatedConfidence.toFixed(1)}%`, calculatedConfidence > 75 ? "success" : "warn");
      
      setReportResult(data.report);
      setScanComplete(true);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed during audit execution.";
      addLog(`CRITICAL PIPELINE EXCEPTION: ${msg}`, "warn");
      setError(msg);
    } finally {
      setScanning(false);
    }
  };

  const handleCommit = () => {
    // Audit completed and saved in DB during POST
    router.push("/dashboard");
    router.refresh();
  };

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

      {/* Main container */}
      <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto w-full flex flex-col gap-6">
        <div>
          <h1 className="font-cyber font-bold text-lg md:text-xl tracking-wider text-slate-100 uppercase">
            Forensic Submission Console
          </h1>
          <p className="text-xs text-slate-500 font-body">
            Upload speciment, define spectral metrics deviations, and execute simulated scan to generate AI diagnostics.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded border bg-rose-955/20 border-rose-500/30 text-rose-455 text-xs font-body font-semibold">
            {error}
          </div>
        )}

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Config column inputs */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="glassmorphism p-6 rounded-xl flex flex-col gap-5">
              <h2 className="font-cyber text-xs font-bold text-cyan-400 uppercase tracking-widest border-b border-slate-900 pb-2 flex items-center gap-1.5">
                <Upload className="w-4 h-4" /> 1. Upload specimen
              </h2>

              <div 
                onClick={() => !scanning && fileInputRef.current?.click()}
                className="border-2 border-dashed border-cyan-500/10 hover:border-cyan-400/40 hover:bg-cyan-955/5 rounded-lg p-6 cursor-pointer flex flex-col items-center justify-center text-center transition-all bg-slate-950/20"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  disabled={scanning}
                  className="hidden" 
                />
                <Upload className="w-8 h-8 text-cyan-404 text-cyan-455 mb-2" />
                <p className="font-cyber text-[10px] tracking-wider text-slate-350 font-bold mb-0.5">
                  SELECT AUDIO / VIDEO SOURCE FILE
                </p>
                <p className="text-[10px] text-slate-500">
                  Calculates cryptographic hashes in-browser
                </p>
              </div>

              {/* Editable Name & Hash */}
              <div className="flex flex-col gap-3 font-body text-xs mt-2">
                <div>
                  <label className="block text-[9px] uppercase font-cyber tracking-wider text-slate-550 font-bold mb-1">
                    Filename
                  </label>
                  <input 
                    type="text" 
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    disabled={scanning}
                    placeholder="e.g. video_capture.mp4"
                    className="w-full bg-slate-950/80 border border-cyan-500/10 rounded px-3 py-2 text-xs text-slate-205 focus:outline-none focus:border-cyan-405/50 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-cyber tracking-wider text-slate-550 font-bold mb-1">
                    SHA-256 Hash identity
                  </label>
                  <input 
                    type="text" 
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    disabled={scanning}
                    placeholder="Auto-computed hash signature"
                    className="w-full bg-slate-950/80 border border-cyan-500/10 rounded px-3 py-2 text-[9px] font-mono text-cyan-400 focus:outline-none focus:border-cyan-405/50 font-semibold select-all"
                  />
                </div>
              </div>
            </div>

            {/* Forensic Slider Parameters */}
            <div className="glassmorphism p-6 rounded-xl flex flex-col gap-5">
              <h2 className="font-cyber text-xs font-bold text-cyan-400 uppercase tracking-widest border-b border-slate-900 pb-2 flex items-center gap-1.5">
                <Cpu className="w-4 h-4" /> 2. Define Spectrometric Indices
              </h2>

              <div className="flex flex-col gap-5 text-xs font-body">
                
                {/* Audio Phase Jitter slider */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-[11px]">
                    <span className="text-slate-400">Audio Jitter Index:</span>
                    <span className="font-cyber font-bold text-cyan-400">{audioJitter}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={audioJitter}
                    onChange={(e) => setAudioJitter(parseInt(e.target.value))}
                    disabled={scanning}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                {/* Visual Anomalies slider */}
                <div>
                  <div className="flex justify-between items-center mb-1 text-[11px]">
                    <span className="text-slate-400">Visual Aberration Index:</span>
                    <span className="font-cyber font-bold text-purple-400">{visualAnomalies}%</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={visualAnomalies}
                    onChange={(e) => setVisualAnomalies(parseInt(e.target.value))}
                    disabled={scanning}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-400"
                  />
                </div>

                {/* Container Metadata drop down */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[9px] uppercase font-cyber tracking-wider text-slate-500 font-bold mb-1.5">
                      Metadata Status
                    </label>
                    <select
                      value={metadataStatus}
                      onChange={(e) => setMetadataStatus(e.target.value)}
                      disabled={scanning}
                      className="w-full bg-slate-950/80 border border-cyan-500/10 rounded px-2.5 py-2 text-[11px] text-slate-350 focus:outline-none focus:border-cyan-405/50 font-body cursor-pointer"
                    >
                      <option value="CLEAN">CLEAN CONTAINER</option>
                      <option value="STRIPPED">EXIF STRIPPED</option>
                      <option value="EDITS_DETECTED">EDITS REPORTED</option>
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-[9px] uppercase font-cyber tracking-wider text-slate-500 font-bold mb-1.5">
                      Compression profile
                    </label>
                    <select
                      value={compressionProfile}
                      onChange={(e) => setCompressionProfile(e.target.value)}
                      disabled={scanning}
                      className="w-full bg-slate-950/80 border border-cyan-500/10 rounded px-2.5 py-2 text-[11px] text-slate-350 focus:outline-none focus:border-cyan-405/50 font-body cursor-pointer"
                    >
                      <option value="STANDARD">STANDARD H.264</option>
                      <option value="RECOMPRESSED">RE-COMPRESSED</option>
                      <option value="ANOMALOUS">DOUBLE ENCODED</option>
                    </select>
                  </div>
                </div>

                {/* Live calculated values projection */}
                <div className="p-3 bg-slate-950/40 rounded border border-slate-900 flex justify-between items-center text-[10px]">
                  <div>
                    <span className="text-slate-500 block uppercase font-cyber tracking-wider mb-0.5">Confidence Projection</span>
                    <span className={`font-cyber font-extrabold text-sm ${
                      calculatedConfidence >= 80 ? 'text-emerald-400' :
                      calculatedConfidence >= 50 ? 'text-amber-400' : 'text-rose-455'
                    }`}>
                      {calculatedConfidence.toFixed(0)}%
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 block uppercase font-cyber tracking-wider mb-0.5">Assigned Verdict</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-cyber font-bold tracking-wider ${
                      calculatedStatus === 'VERIFIED' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20' :
                      calculatedStatus === 'REVOKED' ? 'bg-rose-955/60 text-rose-455 border border-rose-500/20' :
                      'bg-amber-955/60 text-amber-400 border border-amber-500/20'
                    }`}>
                      {calculatedStatus}
                    </span>
                  </div>
                </div>

                {/* Execute */}
                <button
                  onClick={executePipeline}
                  disabled={scanning || !fileName || !hash}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 font-cyber font-bold tracking-widest text-[11px] text-slate-950 rounded transition-all shadow-md shadow-cyan-500/10 active:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 text-slate-950" /> RUN MOLECULAR ENGINE SCAN
                </button>

              </div>
            </div>

          </div>

          {/* Running Terminal / Execution Results Column */}
          <div className="lg:col-span-7 flex flex-col gap-6 w-full">
            
            {/* Terminal logs panel */}
            <div className="glassmorphism p-5 rounded-xl border border-cyan-500/20">
              <h3 className="font-cyber text-xs text-cyan-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4" /> 3. Forensic pipeline execution log
              </h3>

              <div className="bg-slate-960 bg-black/80 rounded-lg p-4 font-mono text-[11px] leading-relaxed text-slate-300 min-h-[220px] max-h-[300px] overflow-y-auto flex flex-col gap-1.5 border border-slate-900 border-t-2 border-t-cyan-505 select-text">
                {scanLogs.length === 0 ? (
                  <div className="text-slate-600 italic">Terminal sitting idle. Setup metrics above and execute scan to initialize.</div>
                ) : (
                  scanLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2.5">
                      <span className="text-slate-600 text-[10px] select-none">[{log.timestamp}]</span>
                      <span className={`${
                        log.type === 'success' ? 'text-emerald-400' :
                        log.type === 'warn' ? 'text-rose-400 font-bold animate-pulse' :
                        'text-slate-350'
                      }`}>{log.text}</span>
                    </div>
                  ))
                )}
                {scanning && (
                  <div className="flex items-center gap-2 text-cyan-400 animate-pulse font-semibold mt-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing forensic stage checks...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Generated Reports Confirmation Panel */}
            {scanComplete && reportResult && (
              <div className="glassmorphism p-6 rounded-xl flex flex-col gap-5 border border-purple-500/20 animate-fade-in relative z-20">
                <div className="flex items-center gap-2 border-b border-purple-500/10 pb-3">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  <h3 className="font-cyber text-xs text-purple-400 font-bold uppercase tracking-wider">
                    4. Generated forensic Ledger artifact
                  </h3>
                </div>

                <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-lg leading-relaxed text-slate-300 font-body text-xs max-h-[250px] overflow-y-auto whitespace-pre-wrap select-text">
                  {reportResult.aiReport}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-purple-955 bg-purple-950/10 border border-purple-500/15 p-4 rounded-lg">
                  <div className="text-center sm:text-left">
                    <span className="text-[9px] font-cyber text-slate-500 uppercase tracking-widest font-bold block mb-0.5">Commitment State</span>
                    <span className="text-xs font-semibold text-slate-200">Forensic file records built and seed keys saved.</span>
                  </div>

                  <button
                    onClick={handleCommit}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-slate-950 font-cyber font-bold tracking-widest text-[11px] rounded transition-all shadow-md shadow-purple-500/10 flex items-center justify-center gap-2"
                  >
                    <Clipboard className="w-4 h-4 text-slate-950" /> COMMIT TO FORENSIC LEDGER
                  </button>
                </div>
              </div>
            )}

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
