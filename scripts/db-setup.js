const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');

async function main() {
  console.log("Running Prisma Db Push to build SQLite database...");
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: process.cwd() });
  } catch (error) {
    console.error("Prisma push failed:", error);
    process.exit(1);
  }

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  console.log("Seeding databases with default accounts...");

  const usersToSeed = [
    {
      email: 'admin@veritas.io',
      name: 'Veritas Admin',
      role: 'ADMIN',
      password: 'VeritasAdmin123!'
    },
    {
      email: 'analyst@veritas.io',
      name: 'Forensic Analyst',
      role: 'ANALYST',
      password: 'VeritasAnalyst123!'
    },
    {
      email: 'auditor@veritas.io',
      name: 'Media Auditor',
      role: 'AUDITOR',
      password: 'VeritasAuditor123!'
    }
  ];

  try {
    for (const u of usersToSeed) {
      const existing = await prisma.user.findUnique({
        where: { email: u.email }
      });
      if (!existing) {
        const passwordHash = await bcrypt.hash(u.password, 10);
        const created = await prisma.user.create({
          data: {
            email: u.email,
            name: u.name,
            role: u.role,
            passwordHash
          }
        });
        console.log(`Created user: ${created.name} (${created.role})`);
      } else {
        console.log(`User already exists: ${u.email}`);
      }
    }

    // Seed sample reports
    const analystUser = await prisma.user.findUnique({ where: { email: 'analyst@veritas.io' } });
    if (analystUser) {
      const reportsToSeed = [
        {
          hash: 'e2dbd98d28e75cfca67a2a53d32b2e887f4c5a90c1f5449cb9431e51b68ea8af',
          fileName: 'press_conference_original.mp4',
          fileSize: 15420310,
          mimeType: 'video/mp4',
          analystId: analystUser.id,
          audioJitter: 2.4,
          visualAnomalies: 1.8,
          metadataStatus: 'CLEAN',
          compressionProfile: 'STANDARD',
          confidence: 98.2,
          status: 'VERIFIED',
          aiReport: `### EXPERT AI MEDIA FORENSIC AUDIT (VERITAS CERTIFIED)
**Target Ledger Hash:** e2dbd98d28e75cfca67a2a53d32b2e887f4c5a90c1f5449cb9431e51b68ea8af
**Media Specimen:** press_conference_original.mp4 (video/mp4)

---

#### 1. Executive Summary
Following a comprehensive digital forensic inspection of the submitted media specimen, the Veritas analysis engine has computed an authenticity rating of **98.2%**. Indicators suggest that this media asset is classified as **VERIFIED / GENUINE**.

#### 2. Visual Anomaly Inspection
- Visual Aberdent Index: 1.8%
- Diagnostics: Zero significant spatial or structural anomalies detected. Blending gradients match the natural camera lens blur, and light vectors align with singular light source calculations.

#### 3. Audio & Spectroscopic Analysis
- Acoustic Jitter Coefficient: 2.4%
- Diagnostics: Acoustic phase analysis indicates natural voice formants. Noise envelope is uniform, and room impulse response metrics confirm a single, continuous recording profile.

#### 4. Metadata & Container Analysis
- Structural Signature: CLEAN
- Compression Profile: STANDARD
- Diagnostics: Container structure is pristine. Original camera manufacturer signatures and sensor tags match the file header layout.`
        },
        {
          hash: 'fa857c1a84f33ebd02941df2a16dcdb58e72e128cc1bf9cd081bfca67a38b1f2',
          fileName: 'ceo_financial_update_synthesized.wav',
          fileSize: 4102920,
          mimeType: 'audio/wav',
          analystId: analystUser.id,
          audioJitter: 82.5,
          visualAnomalies: 45.3,
          metadataStatus: 'STRIPPED',
          compressionProfile: 'ANOMALOUS',
          confidence: 22.4,
          status: 'REVOKED',
          aiReport: `### EXPERT AI MEDIA FORENSIC AUDIT (REVOKED RECORD)
**Target Ledger Hash:** fa857c1a84f33ebd02941df2a16dcdb58e72e128cc1bf9cd081bfca67a38b1f2
**Media Specimen:** ceo_financial_update_synthesized.wav (audio/wav)

---

#### 1. Executive Summary
Following a comprehensive digital forensic inspection of the submitted media specimen, the Veritas analysis engine has computed an authenticity rating of **22.4%**. High-level indicators suggest that this media asset is classified as **MANIPULATED / FRAUDULENT**, and certificate has been revoked.

#### 2. Audio & Spectroscopic Analysis
- Acoustic Jitter Coefficient: 82.5%
- Diagnostics: Severe voice-synthesizer anomalies detected. Phase continuity checks reveal splicing points matching vocoder synthesis profiles. Harmonic structure is interrupted by digital noise floors in the 4kHz-8kHz bands (jitter exceedance threshold).`
        }
      ];

      for (const r of reportsToSeed) {
        const existing = await prisma.mediaReport.findUnique({ where: { hash: r.hash } });
        if (!existing) {
          await prisma.mediaReport.create({ data: r });
          console.log(`Seeded media report: ${r.fileName} (${r.status})`);
        }
      }
    }

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
