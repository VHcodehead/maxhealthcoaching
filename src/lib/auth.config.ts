import type { NextAuthConfig } from 'next-auth';

// Edge-compatible auth config (no Node.js imports like Prisma/bcrypt)
// Used by middleware for JWT verification only
export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [], // Providers added in full auth.ts
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role ?? 'client';
        token.subscriptionStatus = user.subscriptionStatus ?? 'none';
        token.onboardingCompleted = user.onboardingCompleted ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.subscriptionStatus = token.subscriptionStatus as string;
      session.user.onboardingCompleted = token.onboardingCompleted as boolean;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
