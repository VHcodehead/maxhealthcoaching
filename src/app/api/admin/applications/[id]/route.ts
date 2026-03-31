import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'coach' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json() as { action: 'approve' | 'reject' };
    const { action } = body;

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({ where: { id } });

    if (!profile || profile.subscriptionStatus !== 'pending_approval') {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (action === 'approve') {
      await prisma.profile.update({
        where: { id },
        data: { subscriptionStatus: 'none' },
      });

      // Non-blocking email send
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://maxhealthfitness.com';
      const loginUrl = `${appUrl}/login`;
      const user = await prisma.user.findUnique({ where: { id: profile.userId } });
      if (user?.email) {
        try {
          await sendApprovalEmail(user.email, profile.fullName, loginUrl);
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError);
        }
      }
    } else {
      await prisma.profile.update({
        where: { id },
        data: { subscriptionStatus: 'rejected' },
      });

      // Non-blocking email send
      const user = await prisma.user.findUnique({ where: { id: profile.userId } });
      if (user?.email) {
        try {
          await sendRejectionEmail(user.email, profile.fullName);
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError);
        }
      }
    }

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error('Admin application action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
