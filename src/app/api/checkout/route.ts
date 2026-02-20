import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe, PLANS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const planKey = body.plan as keyof typeof PLANS;

    if (!PLANS[planKey]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const plan = PLANS[planKey];

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    let customerId = profile?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe().customers.create({
        email: profile?.email || session.user.email,
        name: profile?.fullName || undefined,
        metadata: { user_id: session.user.id },
      });
      customerId = customer.id;

      await prisma.profile.update({
        where: { userId: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkoutSession = await stripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        user_id: session.user.id,
        plan: planKey,
      },
      subscription_data: {
        metadata: {
          user_id: session.user.id,
          plan: planKey,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
