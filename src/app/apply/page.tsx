import type { Metadata } from 'next';
import { ApplyClient } from './ApplyClient';

export const metadata: Metadata = {
  title: 'Apply for Coaching — CoachMax',
  description:
    "Apply for 1:1 coaching with Max. This isn't a sales page — it's a short application to see if we're a fit.",
  robots: { index: true, follow: true },
};

export default function ApplyPage() {
  return <ApplyClient />;
}
