import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { resetPasswordSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Hash the incoming raw token to compare with the stored hashed token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find token record that matches and has not expired
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        hashedToken,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12);

    // In a transaction: update user password and delete the token (single-use)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.delete({
        where: { id: tokenRecord.id },
      }),
    ]);

    return NextResponse.json({
      message: 'Password reset successful. You can now sign in.',
    });
  } catch (error) {
    console.error('[reset-password] error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
