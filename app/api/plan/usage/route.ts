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

    return NextResponse.json({
      plan: user.role === 'master' ? 'master' : 'active',
      usage: usageData,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 });
  }
}
