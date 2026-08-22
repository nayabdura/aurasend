import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

    if (!dbUser?.stripeCustomerId) {
      return NextResponse.json({ error: 'No active billing profile found for user.' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${appUrl}/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to open customer portal' }, { status: 500 });
  }
}
