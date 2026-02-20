import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signUpSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const referralCode = crypto.randomBytes(6).toString('hex');

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: parsed.data.email,
          passwordHash,
        },
      });

      await tx.profile.create({
        data: {
          userId: newUser.id,
          email: parsed.data.email,
          fullName: parsed.data.full_name,
          role: 'client',
          referralCode,
        },
      });

      return newUser;
    });

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
