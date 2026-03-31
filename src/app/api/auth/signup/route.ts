import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { applicationSchema } from '@/lib/validations';
import { rateLimit, SIGNUP_LIMIT } from '@/lib/rate-limit';
import { sendVerificationEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP — 3 signups per IP per hour
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      (request as any).ip ||
      'unknown';
    const { success: rateLimitOk } = rateLimit(`signup:${ip}`, SIGNUP_LIMIT);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many attempts, try again later' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = applicationSchema.safeParse(body);

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
          subscriptionStatus: 'pending_approval',
          applicationGoal: parsed.data.goal,
          applicationExperience: parsed.data.experience,
          applicationCommitment: parsed.data.commitment,
          applicationGender: parsed.data.gender,
          applicationAge: parsed.data.age,
          applicationHeightFt: parsed.data.height_ft,
          applicationHeightIn: parsed.data.height_in,
          applicationWeightLbs: parsed.data.weight_lbs,
          applicationMotivation: parsed.data.motivation,
          applicationSource: parsed.data.source ?? null,
        },
      });

      return newUser;
    });

    // Send verification email (non-blocking — failure does not affect signup)
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          hashedToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour expiry
        },
      });

      const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;
      await sendVerificationEmail(parsed.data.email, parsed.data.full_name, verifyUrl);
    } catch (emailError) {
      console.error('Verification email error (non-blocking):', emailError);
    }

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
