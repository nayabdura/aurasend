import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { sendActivationEmail } from '@/lib/transactionalEmail';
import { DEFAULT_PLAN_LIMITS } from '@/lib/usage';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    let event;
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
      }
    } else {
      // Development fallback parse
      event = JSON.parse(body);
    }

    const eventId = event.id;

    // 1. Idempotency Guard — Check PaymentEvent table
    const existingEvent = await prisma.paymentEvent.findUnique({
      where: { providerEventId: eventId },
    });

    if (existingEvent) {
      return NextResponse.json({ received: true, note: 'Event already processed' });
    }

    // Record Event
    await prisma.paymentEvent.create({
      data: {
        providerEventId: eventId,
        eventType: event.type,
        provider: 'stripe',
        payload: JSON.stringify(event),
        processed: false,
      },
    });

    // 2. Handle Stripe Event Types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = parseInt(session.metadata?.userId || session.client_reference_id || '0');
        const planSlug = session.metadata?.planSlug || 'starter';

        if (userId > 0) {
          // Update User plan & Stripe IDs
          const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
          const planId = plan ? plan.id : 2;

          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: planSlug,
              planStatus: 'ACTIVE',
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
            },
          });

          // Create/Update Subscription Record
          await prisma.subscription.upsert({
            where: { stripeSubscriptionId: session.subscription || `sub_mock_${userId}` },
            update: {
              userId,
              planId,
              status: 'ACTIVE',
              stripeCustomerId: session.customer,
            },
            create: {
              userId,
              planId,
              status: 'ACTIVE',
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription || `sub_mock_${userId}`,
            },
          });

          // Update Entitlements
          const limits = DEFAULT_PLAN_LIMITS[planSlug] || DEFAULT_PLAN_LIMITS.starter;
          for (const [featureKey, grantedLimit] of Object.entries(limits)) {
            await prisma.entitlement.upsert({
              where: { userId_featureKey: { userId, featureKey } },
              update: { grantedLimit, source: 'plan' },
              create: { userId, featureKey, grantedLimit, source: 'plan' },
            });
          }

          // Trigger Activation Email
          await sendActivationEmail(userId, planSlug.toUpperCase());
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        const stripeSubId = sub.id;
        const status = sub.status === 'active' ? 'ACTIVE' : sub.status === 'past_due' ? 'PAST_DUE' : 'CANCELED';

        const dbSub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: stripeSubId },
        });

        if (dbSub) {
          await prisma.subscription.update({
            where: { id: dbSub.id },
            data: { status },
          });

          await prisma.user.update({
            where: { id: dbSub.userId },
            data: {
              planStatus: status === 'ACTIVE' ? 'ACTIVE' : status === 'PAST_DUE' ? 'PAST_DUE' : 'CANCELED',
            },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer;
        const amount = invoice.amount_paid;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.payment.create({
            data: {
              userId: user.id,
              amount,
              currency: invoice.currency || 'usd',
              status: 'succeeded',
              stripeInvoiceId: invoice.id,
              stripePaymentIntentId: invoice.payment_intent,
            },
          });
        }
        break;
      }
    }

    // Mark event as processed
    await prisma.paymentEvent.update({
      where: { providerEventId: eventId },
      data: { processed: true, processedAt: new Date() },
    });

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('Webhook processing error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
