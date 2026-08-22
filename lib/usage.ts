import prisma from './prisma';

export interface EntitlementCheckResult {
  allowed: boolean;
  limit: number;
  current: number;
  remaining: number;
  message?: string;
}

export function getPeriodStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function getPeriodEnd(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

export const DEFAULT_PLAN_LIMITS: Record<string, Record<string, number>> = {
  free: {
    ai_generations: 10,
    emails_per_month: 50,
    contacts: 100,
    connected_inboxes: 1,
    campaigns: 1,
    email_verifications: 10,
  },
  starter: {
    ai_generations: 100,
    emails_per_month: 500,
    contacts: 500,
    connected_inboxes: 3,
    campaigns: 5,
    email_verifications: 100,
  },
  pro: {
    ai_generations: 500,
    emails_per_month: 5000,
    contacts: 5000,
    connected_inboxes: 10,
    campaigns: 25,
    email_verifications: 500,
  },
  business: {
    ai_generations: 2000,
    emails_per_month: 50000,
    contacts: 50000,
    connected_inboxes: 50,
    campaigns: -1,
    email_verifications: 2000,
  },
  unlimited: {
    ai_generations: -1,
    emails_per_month: -1,
    contacts: -1,
    connected_inboxes: -1,
    campaigns: -1,
    email_verifications: -1,
  },
};

export async function getUserLimit(userId: number, featureKey: string): Promise<number> {
  if (!process.env.DATABASE_URL) {
    return DEFAULT_PLAN_LIMITS.unlimited[featureKey] ?? -1;
  }

  try {
    const override = await prisma.entitlement.findUnique({
      where: { userId_featureKey: { userId, featureKey } },
    });
    if (override) return override.grantedLimit;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const planSlug = user?.plan || 'free';

    const dbPlan = await prisma.plan.findUnique({
      where: { slug: planSlug },
      include: { limits: true },
    });

    if (dbPlan) {
      const limitObj = dbPlan.limits.find((l: any) => l.featureKey === featureKey);
      if (limitObj) return limitObj.limitValue;
    }

    return DEFAULT_PLAN_LIMITS[planSlug]?.[featureKey] ?? DEFAULT_PLAN_LIMITS.free[featureKey] ?? 0;
  } catch (e) {
    return DEFAULT_PLAN_LIMITS.free[featureKey] ?? 0;
  }
}

export async function getRemainingUsage(userId: number, featureKey: string): Promise<EntitlementCheckResult> {
  if (!process.env.DATABASE_URL) {
    return { allowed: true, limit: -1, current: 0, remaining: 999999 };
  }

  const limit = await getUserLimit(userId, featureKey);
  if (limit === -1) {
    return { allowed: true, limit: -1, current: 0, remaining: 999999 };
  }

  const periodStart = getPeriodStart();
  const usageRecord = await prisma.usageRecord.findUnique({
    where: {
      userId_featureKey_periodStart: {
        userId,
        featureKey,
        periodStart,
      },
    },
  });

  const current = usageRecord ? usageRecord.count : 0;
  const remaining = Math.max(0, limit - current);
  const allowed = current < limit;

  return {
    allowed,
    limit,
    current,
    remaining,
    message: allowed
      ? undefined
      : `You have reached your monthly limit of ${limit.toLocaleString()} for ${featureKey.replace(/_/g, ' ')}. Please upgrade your plan.`,
  };
}

export async function checkUsageLimit(userId: number, featureKey: string): Promise<boolean> {
  const res = await getRemainingUsage(userId, featureKey);
  return res.allowed;
}

export async function consumeUsage(userId: number, featureKey: string, amount = 1): Promise<boolean> {
  if (!process.env.DATABASE_URL) return true;

  const limit = await getUserLimit(userId, featureKey);

  if (limit === -1) {
    const periodStart = getPeriodStart();
    const periodEnd = getPeriodEnd();
    await prisma.usageRecord.upsert({
      where: { userId_featureKey_periodStart: { userId, featureKey, periodStart } },
      update: { count: { increment: amount } },
      create: { userId, featureKey, count: amount, periodStart, periodEnd },
    });
    return true;
  }

  const periodStart = getPeriodStart();
  const periodEnd = getPeriodEnd();

  try {
    const updated = await prisma.$transaction(async (tx: any) => {
      const existing = await tx.usageRecord.findUnique({
        where: { userId_featureKey_periodStart: { userId, featureKey, periodStart } },
      });

      const currentCount = existing ? existing.count : 0;
      if (currentCount + amount > limit) {
        return false;
      }

      await tx.usageRecord.upsert({
        where: { userId_featureKey_periodStart: { userId, featureKey, periodStart } },
        update: { count: { increment: amount } },
        create: { userId, featureKey, count: amount, periodStart, periodEnd },
      });

      return true;
    });

    return updated;
  } catch (e) {
    return false;
  }
}

export async function recordUsage(userId: number, featureKey: string, count = 1): Promise<void> {
  await consumeUsage(userId, featureKey, count);
}

export async function checkPlanAccess(userId: number, featureKey: string): Promise<boolean> {
  return checkUsageLimit(userId, featureKey);
}
