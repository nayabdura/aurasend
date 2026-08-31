import 'server-only';
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function createMissingDbProxy(): any {
  const handler: ProxyHandler<any> = {
    get(_target, _prop) {
      const dummyFn = () => {
        throw new Error('Prisma database is not configured. Please set DATABASE_URL in your Vercel Environment Variables.');
      };
      return new Proxy(dummyFn, handler);
    },
    apply() {
      throw new Error('Prisma database is not configured. Please set DATABASE_URL in your Vercel Environment Variables.');
    },
  };
  return new Proxy({}, handler);
}

export const prisma: PrismaClient =
  globalThis.prismaGlobal ??
  (process.env.DATABASE_URL
    ? new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      })
    : createMissingDbProxy());

if (process.env.DATABASE_URL) {
  globalThis.prismaGlobal = prisma;
}

export default prisma;
