import 'server-only';
import prisma from '../database/prisma';

export class UsageRepository {
  static async getUsageRecord(userId: number, featureKey: string, periodStart: Date) {
    return prisma.usageRecord.findUnique({
      where: {
        userId_featureKey_periodStart: {
          userId,
          featureKey,
          periodStart,
        },
      },
    });
  }

  static async incrementUsage(userId: number, featureKey: string, periodStart: Date, periodEnd: Date, amount = 1) {
    return prisma.usageRecord.upsert({
      where: {
        userId_featureKey_periodStart: {
          userId,
          featureKey,
          periodStart,
        },
      },
      update: {
        count: { increment: amount },
      },
      create: {
        userId,
        featureKey,
        periodStart,
        periodEnd,
        count: amount,
      },
    });
  }

  static async getEntitlement(userId: number, featureKey: string) {
    return prisma.entitlement.findUnique({
      where: {
        userId_featureKey: {
          userId,
          featureKey,
        },
      },
    });
  }
}

export default UsageRepository;
