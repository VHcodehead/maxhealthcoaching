import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Blog error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
