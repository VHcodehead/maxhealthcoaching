'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  createdAt: string;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/blog/${slug}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        setPost(data?.post ?? null);
        setLoading(false);
      })
      .catch(() => {
        setPost(null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
          <p className="text-zinc-500 mb-4">This article doesn&apos;t exist or has been removed.</p>
          <Button asChild variant="outline">
            <a href="/blog"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Blog</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold tracking-tight">
            Max<span className="text-emerald-600">Health</span>
          </a>
          <Button asChild variant="ghost" size="sm">
            <a href="/blog"><ArrowLeft className="w-4 h-4 mr-1" /> All Posts</a>
          </Button>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-12">
        <Badge variant="secondary" className="mb-4">Article</Badge>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{post.title}</h1>
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-8">
          <Calendar className="w-4 h-4" />
          {format(new Date(post.createdAt), 'MMMM d, yyyy')}
        </div>

        <div className="prose prose-zinc max-w-none prose-headings:tracking-tight prose-a:text-emerald-600">
          {/* Render markdown content as HTML - for now just whitespace-pre-wrap */}
          <div className="whitespace-pre-wrap text-zinc-700 leading-relaxed">
            {post.content}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-12 bg-zinc-900 rounded-xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">Ready to put this into action?</h3>
          <p className="text-zinc-400 text-sm mb-4">
            Get a personalized meal plan and training program tailored to your body and goals.
          </p>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <a href="/pricing">Get Your Custom Plan <ArrowRight className="w-4 h-4 ml-1" /></a>
          </Button>
        </div>
      </article>
    </div>
  );
}
