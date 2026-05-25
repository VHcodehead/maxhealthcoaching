import type { Metadata } from 'next';
import { HomeClient } from '@/components/marketing/home/HomeClient';

export const metadata: Metadata = {
  title: 'CoachMax — 1:1 Coaching with Max',
  description:
    'Personal weekly oversight from a competitor. Real adjustments to food, training, cardio, and recovery — delivered through My Pocket Coach. From $800 / 12 weeks.',
  openGraph: {
    title: 'CoachMax — 1:1 Coaching with Max',
    description:
      'Personal weekly oversight from a competitor. Real adjustments. No templates. From $800 / 12 weeks plus the My Pocket Coach app.',
    siteName: 'CoachMax',
    type: 'website',
  },
};

export default function HomePage() {
  return <HomeClient />;
}
