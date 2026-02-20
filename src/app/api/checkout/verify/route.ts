import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const checkoutSession = await stripe().checkout.sessions.retrieve(session_id);

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const userId = checkoutSession.metadata?.user_id;
    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const customerId = checkoutSession.customer as string;
    const subscriptionId = checkoutSession.subscription as string;

    // Activate the subscription in the database immediately
    await prisma.profile.updateMany({
      where: { userId },
      data: {
        subscriptionStatus: 'active',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    console.error('Checkout verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
