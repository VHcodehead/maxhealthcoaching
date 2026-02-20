import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function stripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return _stripe;
}

export const PLANS = {
  basic: {
    name: 'Basic',
    price: '$149/mo',
    priceAmount: 14900,
    priceId: process.env.STRIPE_PRICE_BASIC!,
    features: [
      'Personalized macro targets',
      'Custom 7-day meal plan with recipes',
      'Custom training program',
      'Weekly check-in tracking',
      'Progress photo storage',
    ],
    cta: 'Start Basic',
  },
  pro: {
    name: 'Pro',
    price: '$299/mo',
    priceAmount: 29900,
    priceId: process.env.STRIPE_PRICE_PRO!,
    popular: true,
    features: [
      'Everything in Basic',
      'Bi-weekly plan adjustments',
      'Priority coach review',
      'Meal swap alternatives',
      'Advanced progress analytics',
      'Grocery lists',
    ],
    cta: 'Start Pro',
  },
  elite: {
    name: 'Elite',
    price: '$499/mo',
    priceAmount: 49900,
    priceId: process.env.STRIPE_PRICE_ELITE!,
    features: [
      'Everything in Pro',
      'Weekly 1-on-1 coach check-in',
      'Unlimited plan regenerations',
      'Direct messaging with coach',
      'Custom supplement guidance',
      'Priority support',
    ],
    cta: 'Start Elite',
  },
} as const;
