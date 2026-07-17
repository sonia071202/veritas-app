import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veritas | AI-Powered Media Forensic Authentication Hub",
  description: "Verify media cryptographic integrity, combat deepfakes, and analyze audiovisual digital manipulations with premium AI-driven forensic reporting.",
  keywords: ["Forensics", "Deepfake Detection", "Media Integrity", "SHA-256 Ledger", "AI Verification", "Veritas"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full flex flex-col bg-cyber-bg text-slate-100 cyber-grid antialiased">
        <main className="flex-1 flex flex-col relative z-10 w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
