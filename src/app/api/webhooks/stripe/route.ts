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

  // Log every incoming webhook event for production debugging
  console.log(`[Stripe Webhook] ${event.type} | ${event.id} | customer: ${(event.data.object as any).customer || 'N/A'}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      try {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) {
          console.error(`[Stripe Webhook] checkout.session.completed missing user_id in metadata | session: ${session.id} | customer: ${customerId}`);
          break;
        }

        // Idempotency: skip if profile already has this subscriptionId
        const existing = await prisma.profile.findFirst({
          where: { userId },
          select: { stripeSubscriptionId: true },
        });
        if (existing?.stripeSubscriptionId === subscriptionId) {
          console.log(`[Stripe Webhook] Idempotent skip: checkout.session.completed for user ${userId}`);
          break;
        }

        await prisma.profile.updateMany({
          where: { userId },
          data: {
            subscriptionStatus: 'active',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            updatedAt: new Date(),
          },
        });
      } catch (err) {
        console.error(`[Stripe Webhook] Error handling checkout.session.completed:`, err);
      }
      break;
    }

    case 'customer.subscription.updated': {
      try {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const status = subscription.status === 'active' ? 'active'
          : subscription.status === 'past_due' ? 'past_due'
          : subscription.status === 'trialing' ? 'trialing'
          : 'canceled';

        // Idempotency: skip if status is already up to date
        const existing = await prisma.profile.findFirst({
          where: { stripeCustomerId: customerId },
          select: { subscriptionStatus: true },
        });
        if (existing?.subscriptionStatus === status) {
          console.log(`[Stripe Webhook] Idempotent skip: subscription.updated status already '${status}' for customer ${customerId}`);
          break;
        }

        await prisma.profile.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus: status,
            currentPeriodEnd: new Date(((subscription as Stripe.Subscription & { current_period_end: number }).current_period_end) * 1000),
            updatedAt: new Date(),
          },
        });
      } catch (err) {
        console.error(`[Stripe Webhook] Error handling customer.subscription.updated:`, err);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      try {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Idempotency: skip if already canceled
        const existing = await prisma.profile.findFirst({
          where: { stripeCustomerId: customerId },
          select: { subscriptionStatus: true },
        });
        if (existing?.subscriptionStatus === 'canceled') {
          console.log(`[Stripe Webhook] Idempotent skip: subscription.deleted already canceled for customer ${customerId}`);
          break;
        }

        await prisma.profile.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus: 'canceled',
            updatedAt: new Date(),
          },
        });
      } catch (err) {
        console.error(`[Stripe Webhook] Error handling customer.subscription.deleted:`, err);
      }
      break;
    }

    case 'invoice.payment_failed': {
      try {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Idempotency: skip if already past_due
        const existing = await prisma.profile.findFirst({
          where: { stripeCustomerId: customerId },
          select: { subscriptionStatus: true },
        });
        if (existing?.subscriptionStatus === 'past_due') {
          console.log(`[Stripe Webhook] Idempotent skip: invoice.payment_failed already past_due for customer ${customerId}`);
          break;
        }

        await prisma.profile.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus: 'past_due',
            updatedAt: new Date(),
          },
        });
      } catch (err) {
        console.error(`[Stripe Webhook] Error handling invoice.payment_failed:`, err);
      }
      break;
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
