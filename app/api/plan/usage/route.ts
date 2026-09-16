import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getRemainingUsage } from '@/lib/usage';

export async function GET(req: Request) {
  try {
    const user = await requireAuth();

    const features = ['ai_generations', 'emails_per_month', 'contacts', 'connected_inboxes', 'campaigns'];
    const usageData: Record<string, any> = {};

    for (const f of features) {
      usageData[f] = await getRemainingUsage(user.id, f);
    }

    const isMaster = ['MASTER', 'ADMIN'].includes(String(user.role || '').toUpperCase());

    return NextResponse.json({
      plan: isMaster ? 'unlimited' : 'starter',
      planName: isMaster ? 'Unlimited Master' : 'Starter Plan',
      planStatus: 'active',
      limits: {
        gmailAccounts: {
          used: usageData.connected_inboxes?.used || 0,
          max: isMaster ? -1 : 3,
          formatted: isMaster ? 'Unlimited' : '3',
        },
        monthlyEmails: {
          used: usageData.emails_per_month?.used || 0,
          max: isMaster ? -1 : 500,
          formatted: isMaster ? 'Unlimited' : '500',
        },
        contacts: {
          used: usageData.contacts?.used || 0,
          max: isMaster ? -1 : 1000,
          formatted: isMaster ? 'Unlimited' : '1,000',
        },
        campaigns: {
          used: usageData.campaigns?.used || 0,
          max: isMaster ? -1 : 5,
          formatted: isMaster ? 'Unlimited' : '5',
        },
      },
      features: {
        canUseAI: true,
        canUseEnrichment: true,
        canUseFollowUps: true,
        canUsePerAccountLeads: true,
        canUseAnalytics: true,
      },
      usage: usageData,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 });
  }
}
