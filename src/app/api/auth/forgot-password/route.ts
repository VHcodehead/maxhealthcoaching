import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimit, RESET_LIMIT } from '@/lib/rate-limit';
import { forgotPasswordSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Rate limiting per email address
    const limiter = rateLimit(`reset:${email}`, RESET_LIMIT);
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many attempts, try again later.' },
        { status: 429 }
      );
    }

    // Look up user by email, include profile for name
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    // Always return generic message to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If that email is registered, we've sent a password reset link.",
      });
    }

    // Delete any existing reset tokens for this user (clean slate)
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Store hashed token with 1-hour expiry
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    // Build reset URL with raw token (hashed version stored in DB)
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    const name = user.profile?.fullName ?? 'there';
    await sendPasswordResetEmail(user.email, name, resetUrl);

    return NextResponse.json({
      message: "If that email is registered, we've sent a password reset link.",
    });
  } catch (error) {
    console.error('[forgot-password] error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
