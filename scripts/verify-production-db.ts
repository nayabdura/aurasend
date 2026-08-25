import { PrismaClient } from '@prisma/client';

async function verifyProductionDb() {
  let dbEnv = 'FAIL';
  let prismaClient = 'FAIL';
  let dbConn = 'FAIL';
  let schema = 'FAIL';
  let userQuery = 'FAIL';

  // 1. DATABASE ENV Check
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
    dbEnv = 'PASS';
  }

  // 2. PRISMA CLIENT Check
  let prisma: PrismaClient | null = null;
  try {
    prisma = new PrismaClient();
    if (prisma) prismaClient = 'PASS';
  } catch (e) {}

  // 3. DATABASE CONNECTION & SCHEMA & USER QUERY Check
  if (prisma) {
    try {
      await prisma.$connect();
      dbConn = 'PASS';

      // Check User model/table query
      const userCount = await prisma.user.count();
      if (typeof userCount === 'number') {
        schema = 'PASS';
        userQuery = 'PASS';
      }
    } catch (e: any) {
      // Ignore exception details to prevent credential leakage
    } finally {
      await prisma.$disconnect();
    }
  }

  console.log(`DATABASE ENV: ${dbEnv}`);
  console.log(`PRISMA CLIENT: ${prismaClient}`);
  console.log(`DATABASE CONNECTION: ${dbConn}`);
  console.log(`SCHEMA: ${schema}`);
  console.log(`USER QUERY: ${userQuery}`);
}

verifyProductionDb();
