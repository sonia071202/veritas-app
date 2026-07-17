const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const reports = await prisma.mediaReport.findMany({
    orderBy: { registration: 'desc' }
  });
  console.log("Number of reports in DB:", reports.length);
  reports.slice(0, 5).forEach(r => {
    console.log(`- ${r.fileName} Status: ${r.status} Hash: ${r.hash}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
