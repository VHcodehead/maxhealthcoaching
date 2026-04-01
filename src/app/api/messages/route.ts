import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const countOnly = searchParams.get('count_only') === 'true';

    if (countOnly) {
      // Mode 2: Return unread counts
      const unreadMessages = await prisma.message.findMany({
        where: {
          receiverId: session.user.id,
          read: false,
        },
        select: {
          id: true,
          senderId: true,
        },
      });

      const unreadTotal = unreadMessages.length;

      // Check if caller is a coach to provide per-client breakdown
      const profile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { role: true },
      });

      if (profile?.role === 'coach') {
        const unreadByUser: Record<string, number> = {};
        for (const msg of unreadMessages) {
          unreadByUser[msg.senderId] = (unreadByUser[msg.senderId] ?? 0) + 1;
        }
        return NextResponse.json({ unreadTotal, unreadByUser });
      }

      return NextResponse.json({ unreadTotal });
    }

    if (userId) {
      // Mode 1: Load message thread between authenticated user and userId
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: userId },
            { senderId: userId, receiverId: session.user.id },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json({ messages });
    }

    return NextResponse.json(
      { error: 'Provide user_id for thread load or count_only=true for unread counts' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content } = body;

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Content must be 2000 characters or less' },
        { status: 400 }
      );
    }

    // Validate receiverId
    if (!receiverId || typeof receiverId !== 'string') {
      return NextResponse.json({ error: 'receiverId is required' }, { status: 400 });
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content: content.trim(),
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { senderId } = body;

    if (!senderId || typeof senderId !== 'string') {
      return NextResponse.json({ error: 'senderId is required' }, { status: 400 });
    }

    const result = await prisma.message.updateMany({
      where: {
        senderId,
        receiverId: session.user.id,
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error('Messages PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
