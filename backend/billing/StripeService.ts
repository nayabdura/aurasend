import 'server-only';
import Stripe from 'stripe';
import config from '../config';
import UserRepository from '../repositories/UserRepository';

export class StripeService {
  private static getStripe(): Stripe {
    if (!config.stripe.secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured.');
    }
    return new Stripe(config.stripe.secretKey, {
      apiVersion: '2024-04-10' as any,
    });
  }

  static async createCheckoutSession(userId: number, priceId: string, successUrl: string, cancelUrl: string) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new Error('User not found.');

    const stripe = StripeService.getStripe();

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id.toString() },
      });
      customerId = customer.id;
      await UserRepository.updatePlanStatus(userId, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId: user.id.toString() },
    });

    return session;
  }

  static async createCustomerPortalSession(userId: number, returnUrl: string) {
    const user = await UserRepository.findById(userId);
    if (!user || !user.stripeCustomerId) {
      throw new Error('No Stripe customer profile found.');
    }

    const stripe = StripeService.getStripe();
    return stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });
  }

  static constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    const stripe = StripeService.getStripe();
    return stripe.webhooks.constructEvent(payload, signature, config.stripe.webhookSecret);
  }
}

export default StripeService;
