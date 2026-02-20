import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
