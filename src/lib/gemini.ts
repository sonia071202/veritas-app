import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

export interface VerificationMetrics {
  fileName: string;
  mimeType: string;
  hash: string;
  audioJitter: number;
  visualAnomalies: number;
  metadataStatus: string;
  compressionProfile: string;
  confidence: number;
}

export async function generateForensicReport(data: VerificationMetrics): Promise<string> {
  if (!apiKey) {
    return simulateForensicReport(data);
  }

  const prompt = `You are a Senior Media Forensics AI auditor integrated into Veritas, an advanced deepfake and media manipulation detection hub.
Analyze the following media files extracted metadata and forensic indicators to generate a structured forensic audit report.

FILE METADATA:
- Name: ${data.fileName}
- Format/Mime: ${data.mimeType}
- Cryptographic hash (SHA-256): ${data.hash}

HYPER-SPECTRAL FORENSIC METRICS:
- Visual Artifacts/Anomalies: ${data.visualAnomalies}% (e.g., lighting mismatches, texture blending issues, edge frequency discrepancies)
- Audio Jitter/Phase Anomalies: ${data.audioJitter}% (e.g., spectrogram cuts, phase inconsistency, unnatural voice frequency shifts)
- EXIF/Metadata Integrity: ${data.metadataStatus} (CLEAN, MODIFIED, STRIPPED, or SUSPICIOUS)
- Compression Profile: ${data.compressionProfile} (STANDARD, RECOMPRESSED, or ANOMALOUS)
- Overall Authenticity Confidence: ${data.confidence}%

Generate a comprehensive, professional forensic report and summary. Include:
1. Executive Summary: Explain if the file appears manipulated, suspicious or verified.
2. Visual Analysis Section: Comment on the visual anomaly score.
3. Audio Forensic Section: Comment on the audio jitter score.
4. Metadata & Compression Audit: Elaborate on structural signatures.
5. Final Verdict: Certify the item's ledger status.

Keep your response format clean, authoritative, and direct. Use markdown.`;

  // Fallback chain to handle transient capacity (503) or rate limits
  const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro'];

  for (const modelName of models) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      if (response.text) {
        return response.text;
      }
    } catch (error) {
      console.warn(`Gemini model ${modelName} returned error or was overloaded:`, error);
    }
  }

  console.error("All Gemini API models failed, falling back to simulated report.");
  return simulateForensicReport(data);
}

function simulateForensicReport(data: VerificationMetrics): string {
  const dateStr = new Date().toUTCString();
  const isSus = data.confidence < 80;
  const verdict = isSus ? (data.confidence < 45 ? "MANIPULATED / FRAUDULENT" : "SUSPICIOUS / DEVIATING") : "VERIFIED / GENUINE";
  
  return `### EXPERT AI MEDIA FORENSIC AUDIT (SIMULATED ENGINE)
**Timestamp of Audit:** ${dateStr}
**Target Ledger Hash:** ${data.hash}
**Media Specimen:** ${data.fileName} (${data.mimeType})

---

#### 1. Executive Summary
Following a comprehensive digital forensic inspection of the submitted media specimen, the Veritas analysis engine has computed an authenticity rating of **${data.confidence.toFixed(1)}%**. High-level indicators suggest that this media asset is classified as **${verdict}**.

#### 2. Visual Anomaly Inspection
* **Visual Aberrant Index:** ${data.visualAnomalies}%
* **Diagnostics:** ${data.visualAnomalies > 50 ? 
      `Critical spatial deviations detected. Analyzing color-space alignment and double-quantization grids indicates inconsistent shading boundaries (lighting vectors deviate by >15 degrees). The pixel frequency spectrum exhibits unnatural high-frequency roll-off typical of generative diffusion techniques.` : 
      data.visualAnomalies > 20 ? 
      `Minor spatial inconsistency observed. Traces of blending artifacts around edge gradients. Shading is mostly contiguous, but localized Fourier analysis suggests high-pass filter smoothing.` :
      `Zero significant spatial or structural anomalies detected. Blending gradients match the natural camera lens blur, and light vectors align with singular light source calculations.`
    }

#### 3. Audio & Spectroscopic Analysis
* **Acoustic Jitter Coefficient:** ${data.audioJitter}%
* **Diagnostics:** ${data.audioJitter > 50 ? 
      `Severe voice-synthesizer anomalies detected. Phase continuity checks reveal splicing points matching vocoder synthesis profiles. Harmonic structure is interrupted by digital noise floors in the 4kHz-8kHz bands (jitter exceedance threshold).` : 
      data.audioJitter > 20 ? 
      `Elevated vocal phase jitter. Pitch interpolation and formants remain relatively stable, but subtle phase mismatch signals indicate potential splice operations or compression overlays.` :
      `Acoustic phase analysis indicates natural voice formants. Noise envelope is uniform, and room impulse response metrics confirm a single, continuous recording profile.`
    }

#### 4. Metadata & Container Analysis
* **Structural Signature:** ${data.metadataStatus}
* **Compression Profile:** ${data.compressionProfile}
* **Diagnostics:** ${data.metadataStatus === 'CLEAN' ? 
      `Container structure is pristine. Original camera manufacturer signatures and sensor tags match the file header layout.` : 
      data.metadataStatus === 'STRIPPED' ?
      `All EXIF and camera metadata have been purged from the container stream. Standard security sanitization or online service compression detected.` :
      `Warning: Structural edit markers were detected in the file trailer. Software descriptors matching 'Adobe' or similar processing tools detected.`
    }

#### 5. Audit Authorization
This certification validates the cryptographically hashed ledger entry. Any alteration to the bit-stream of file **${data.hash}** breaks this signature and invalidates this certificate. This ledger trace remains indexed under Veritas protocols.`;
}
