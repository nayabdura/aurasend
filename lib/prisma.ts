import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  (process.env.DATABASE_URL
    ? new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      })
    : (new Proxy({}, {
        get: () => () => {
          throw new Error('Prisma database is not configured. Please set DATABASE_URL in your environment variables.');
        },
      }) as any));

if (process.env.DATABASE_URL) {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
