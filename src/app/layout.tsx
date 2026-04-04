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
  title: 'MaxHealth Coaching — Your Personal Training Partner',
  description:
    'Premium personal training and nutrition coaching tailored to your goals. Science-backed programs, expert guidance, and real results with MaxHealth Coaching.',
  openGraph: {
    title: 'MaxHealth Coaching — Your Personal Training Partner',
    description:
      'Premium personal training and nutrition coaching tailored to your goals. Science-backed programs, expert guidance, and real results.',
    url: 'https://maxhealthcoaching.com',
    siteName: 'MaxHealth Coaching',
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
