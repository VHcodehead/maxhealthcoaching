import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function verifyCoach() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== 'coach' && session.user.role !== 'admin') return null;
  return session.user;
}

export async function GET() {
  try {
    const user = await verifyCoach();
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [posts, transformations] = await Promise.all([
      prisma.blogPost.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transformation.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({ posts, transformations });
  } catch (error) {
    console.error('Coach content GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyCoach();
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, ...data } = body;

    if (type === 'post') {
      const post = await prisma.blogPost.create({
        data: {
          title: data.title,
          slug: data.slug,
          content: data.content || '',
          excerpt: data.excerpt || '',
          published: data.published ?? false,
          authorId: user.id,
          featuredImage: data.featured_image || null,
        },
      });
      return NextResponse.json({ success: true, post });
    }

    if (type === 'transformation') {
      const transformation = await prisma.transformation.create({
        data: {
          clientName: data.client_name || '',
          beforePhoto: data.before_photo || null,
          afterPhoto: data.after_photo || null,
          weightLost: data.weight_lost || '',
          duration: data.duration || '',
          quote: data.quote || '',
          featured: data.featured ?? false,
          approved: data.approved ?? false,
        },
      });
      return NextResponse.json({ success: true, transformation });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Coach content POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyCoach();
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    if (type === 'post') {
      const post = await prisma.blogPost.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.content !== undefined && { content: data.content }),
          ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
          ...(data.published !== undefined && { published: data.published }),
          ...(data.featured_image !== undefined && { featuredImage: data.featured_image }),
        },
      });
      return NextResponse.json({ success: true, post });
    }

    if (type === 'transformation') {
      const transformation = await prisma.transformation.update({
        where: { id },
        data: {
          ...(data.client_name !== undefined && { clientName: data.client_name }),
          ...(data.before_photo !== undefined && { beforePhoto: data.before_photo }),
          ...(data.after_photo !== undefined && { afterPhoto: data.after_photo }),
          ...(data.weight_lost !== undefined && { weightLost: data.weight_lost }),
          ...(data.duration !== undefined && { duration: data.duration }),
          ...(data.quote !== undefined && { quote: data.quote }),
          ...(data.featured !== undefined && { featured: data.featured }),
          ...(data.approved !== undefined && { approved: data.approved }),
        },
      });
      return NextResponse.json({ success: true, transformation });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Coach content PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyCoach();
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
    }

    if (type === 'post') {
      await prisma.blogPost.delete({ where: { id } });
    } else if (type === 'transformation') {
      await prisma.transformation.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Coach content DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
