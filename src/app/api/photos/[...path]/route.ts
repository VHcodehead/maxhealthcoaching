import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFile } from '@/lib/storage';

const MIME_TYPES: Record<string, string> = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'webp': 'image/webp',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { path: segments } = await params;
  const filePath = segments.join('/');

  // Users can only access their own photos, coaches can access all
  const isCoach = session.user.role === 'coach' || session.user.role === 'admin';
  if (!isCoach && !filePath.startsWith(session.user.id + '/')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const data = await getFile(filePath);
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
