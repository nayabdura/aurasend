import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { StripeCheckoutSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = StripeCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { planSlug, billingInterval } = parsed.data;
    const priceId = STRIPE_PRICE_IDS[planSlug]?.[billingInterval];

    if (!priceId) {
      return NextResponse.json({ error: `Invalid plan selection: ${planSlug}` }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: user.email,
      client_reference_id: user.id.toString(),
      metadata: {
        userId: user.id.toString(),
        planSlug,
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings/billing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create checkout session' }, { status: 500 });
  }
}
