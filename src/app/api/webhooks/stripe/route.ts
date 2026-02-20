import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (userId) {
        await prisma.profile.updateMany({
          where: { userId },
          data: {
            subscriptionStatus: 'active',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            updatedAt: new Date(),
          },
        });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const status = subscription.status === 'active' ? 'active'
        : subscription.status === 'past_due' ? 'past_due'
        : subscription.status === 'trialing' ? 'trialing'
        : 'canceled';

      await prisma.profile.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          subscriptionStatus: status,
          currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
          updatedAt: new Date(),
        },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await prisma.profile.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          subscriptionStatus: 'canceled',
          updatedAt: new Date(),
        },
      });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await prisma.profile.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          subscriptionStatus: 'past_due',
          updatedAt: new Date(),
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
