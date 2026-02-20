import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

const publicRoutes = ['/', '/login', '/signup', '/pricing', '/quiz', '/tools', '/results', '/blog', '/success', '/api/webhooks/stripe', '/api/leads', '/api/quiz'];

export default auth((req) => {
  const path = req.nextUrl.pathname;

  // Public routes - no auth needed
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith('/blog/') || path.startsWith('/api/webhooks/'));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Auth API routes
  if (path.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Not logged in -> redirect to login
  if (!req.auth?.user) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  const { role, subscriptionStatus, onboardingCompleted } = req.auth.user;

  // Coach routes - require coach/admin role
  if (path.startsWith('/coach')) {
    if (role !== 'coach' && role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Client routes that require active subscription
  const paidRoutes = ['/onboarding', '/dashboard', '/checkin', '/generating'];
  const requiresPayment = paidRoutes.some(route => path.startsWith(route));

  if (requiresPayment && role === 'client') {
    if (subscriptionStatus !== 'active' && subscriptionStatus !== 'trialing') {
      const url = req.nextUrl.clone();
      url.pathname = '/pricing';
      url.searchParams.set('reason', 'subscription_required');
      return NextResponse.redirect(url);
    }
  }

  // If accessing dashboard but onboarding not complete, redirect to onboarding
  if (path.startsWith('/dashboard') && role === 'client' && !onboardingCompleted) {
    const url = req.nextUrl.clone();
    url.pathname = '/onboarding';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
