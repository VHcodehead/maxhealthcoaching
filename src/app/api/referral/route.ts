import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile with referral code
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { referralCode: true },
    });

    // Get referrals
    const referrals = await prisma.referral.findMany({
      where: { referrerId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      referral_code: profile?.referralCode,
      referrals,
      total_referrals: referrals.length,
      completed_referrals: referrals.filter(r => r.status === 'completed').length,
    });
  } catch (error) {
    console.error('Referral error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
