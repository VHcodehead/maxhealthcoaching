import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { saveFile } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const checkInId = formData.get('check_in_id') as string;
    const photoType = formData.get('photo_type') as string;

    if (!file || !checkInId || !photoType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['front', 'side', 'back'].includes(photoType)) {
      return NextResponse.json({ error: 'Invalid photo type' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, or WebP.' }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const storagePath = `${session.user.id}/${checkInId}/${photoType}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await saveFile(storagePath, buffer);

    // Save reference
    const photo = await prisma.progressPhoto.create({
      data: {
        userId: session.user.id,
        checkInId,
        photoType,
        storagePath,
      },
    });

    return NextResponse.json({ success: true, photo });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
