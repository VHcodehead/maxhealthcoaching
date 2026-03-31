import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { authConfig } from '@/lib/auth.config';
import { rateLimit, LOGIN_LIMIT } from '@/lib/rate-limit';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        // Rate limiting by email — 5 attempts per 15 minutes
        const { success: rateLimitOk } = rateLimit(`login:${email}`, LOGIN_LIMIT);
        if (!rateLimitOk) {
          throw new Error('Too many login attempts. Please try again later.');
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { profile: true },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.profile?.fullName || '',
          role: user.profile?.role || 'client',
          subscriptionStatus: user.profile?.subscriptionStatus || 'none',
          onboardingCompleted: user.profile?.onboardingCompleted || false,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
});
