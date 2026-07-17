import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Serverless auto-migration utility to make SQLite writable on Vercel/Netlify
const isServerless = process.env.VERCEL === '1' || process.env.NETLIFY === 'true' || process.env.NODE_ENV === 'production';

if (isServerless) {
  try {
    const tempDir = '/tmp';
    const dbName = 'dev.db';
    const targetDbPath = path.join(tempDir, dbName);

    // Copy pre-seeded database to /tmp if it doesn't already exist
    if (!fs.existsSync(targetDbPath)) {
      const sourceDbPath = path.join(process.cwd(), 'prisma', dbName);
      if (fs.existsSync(sourceDbPath)) {
        fs.copyFileSync(sourceDbPath, targetDbPath);
        console.log(`Successfully moved database to writable path: ${targetDbPath}`);
      } else {
        console.warn(`Source seed database not found at: ${sourceDbPath}`);
      }
    }

    // Direct Prisma to use the writable database in /tmp
    process.env.DATABASE_URL = `file:${targetDbPath}`;
  } catch (err) {
    console.error('Failed to configure serverless SQLite database:', err);
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

