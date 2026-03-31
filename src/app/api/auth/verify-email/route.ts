import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(
      new URL('/verify-email?status=error&message=Invalid+verification+link', request.url)
    );
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const record = await prisma.emailVerificationToken.findFirst({
    where: {
      hashedToken,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!record) {
    return NextResponse.redirect(
      new URL('/verify-email?status=error&message=Expired+or+invalid+link', request.url)
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    });
    await tx.emailVerificationToken.delete({
      where: { id: record.id },
    });
  });

  return NextResponse.redirect(
    new URL('/verify-email?status=success', request.url)
  );
}
