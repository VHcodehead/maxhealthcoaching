import type { Metadata } from 'next';
import { Inter, Bebas_Neue } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'CoachMax — 1:1 Coaching with Max',
  description:
    'Personal weekly oversight from a competitor. Real adjustments to food, training, cardio, and recovery — delivered through My Pocket Coach.',
  openGraph: {
    title: 'CoachMax — 1:1 Coaching with Max',
    description:
      'Personal weekly oversight from a competitor. Real adjustments. No templates.',
    siteName: 'CoachMax',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${bebasNeue.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
