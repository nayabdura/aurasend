import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
  }

  try {
    // Process Warmup Accounts
    const activeWarmupAccounts = await prisma.gmailAccount.findMany({
      where: {
        warmupEnabled: true,
        status: 'active',
        isConnected: true,
      },
      take: 10,
    });

    let processed = 0;
    for (const acc of activeWarmupAccounts) {
      if (acc.warmupSentToday < acc.warmupDailyLimit) {
        await prisma.gmailAccount.update({
          where: { id: acc.id },
          data: {
            warmupSentToday: { increment: 1 },
            warmupLastDate: new Date().toISOString().split('T')[0],
          },
        });
        processed++;
      }
    }

    return NextResponse.json({ processed, status: 'success' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
