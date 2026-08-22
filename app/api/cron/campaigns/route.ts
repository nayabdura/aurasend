import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { consumeUsage } from '@/lib/usage';

export async function GET(req: Request) {
  // 1. Verify Vercel Cron Secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
  }

  try {
    const now = new Date();

    // 2. Atomic Job Locking — Select running campaign and lock it for 5 minutes
    const campaignToProcess = await prisma.$transaction(async (tx: any) => {
      const campaign = await tx.campaign.findFirst({
        where: {
          status: 'running',
          OR: [{ lockUntil: null }, { lockUntil: { lt: now } }],
        },
        include: {
          user: true,
          template: true,
        },
      });

      if (!campaign) return null;

      // Lock campaign for 5 mins
      const lockUntil = new Date(now.getTime() + 5 * 60 * 1000);
      await tx.campaign.update({
        where: { id: campaign.id },
        data: { lockUntil },
      });

      return campaign;
    });

    if (!campaignToProcess) {
      return NextResponse.json({ processed: 0, message: 'No active campaigns ready to send.' });
    }

    // 3. Find pending leads in batch (max 20)
    const pendingLeads = await prisma.lead.findMany({
      where: {
        campaignId: campaignToProcess.id,
        userId: campaignToProcess.userId,
        status: 'pending',
        isSuppressed: false,
      },
      take: 20,
    });

    let sentCount = 0;
    let failCount = 0;

    // 4. Process Batch
    for (const lead of pendingLeads) {
      // Check user email quota
      const allowed = await consumeUsage(campaignToProcess.userId, 'emails_per_month', 1);
      if (!allowed) {
        // Pause campaign if quota reached
        await prisma.campaign.update({
          where: { id: campaignToProcess.id },
          data: { status: 'paused', lockUntil: null },
        });
        break;
      }

      // Check idempotency: Ensure email_logs does not have a sent record for lead
      const existingLog = await prisma.emailLog.findFirst({
        where: { leadId: lead.id, type: 'sent' },
      });

      if (existingLog) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { status: 'sent' },
        });
        continue;
      }

      // Mark lead as sent (or queue dispatch)
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: 'sent', sentAt: BigInt(Date.now()) },
      });

      await prisma.emailLog.create({
        data: {
          userId: campaignToProcess.userId,
          workspaceId: campaignToProcess.workspaceId,
          leadId: lead.id,
          type: 'sent',
          timestamp: BigInt(Date.now()),
        },
      });

      sentCount++;
    }

    // 5. Release Job Lock
    await prisma.campaign.update({
      where: { id: campaignToProcess.id },
      data: { lockUntil: null },
    });

    return NextResponse.json({
      campaignId: campaignToProcess.id,
      sentCount,
      failCount,
    });
  } catch (e: any) {
    console.error('Vercel Cron Campaign Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
