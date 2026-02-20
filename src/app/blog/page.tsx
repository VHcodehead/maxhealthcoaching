'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  createdAt: string;
}

// Placeholder posts
const placeholderPosts: Post[] = [
  {
    id: '1',
    title: 'The Complete Guide to Calculating Your Macros',
    slug: 'complete-guide-calculating-macros',
    excerpt: 'Learn how to calculate your ideal protein, carbs, and fat intake for any fitness goal.',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: '5 Common Mistakes People Make When Cutting',
    slug: 'common-cutting-mistakes',
    excerpt: 'Avoid these pitfalls that sabotage fat loss and learn what to do instead.',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'How to Build Muscle on a Budget',
    slug: 'build-muscle-on-budget',
    excerpt: 'High-protein meals that won\'t break the bank. Meal prep strategies for the budget-conscious lifter.',
    createdAt: new Date().toISOString(),
  },
];

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>(placeholderPosts);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    fetch('/api/blog')
      .then((res) => res.json())
      .then(({ posts }) => {
        if (posts && posts.length > 0) {
          setPosts(posts);
        }
      })
      .catch(() => {
        // Keep placeholder posts on error
      });
  }, []);

  const handleSubscribe = async () => {
    if (!email) return;
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'blog' }),
      });
      setSubscribed(true);
    } catch {
      // Silent fail
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold tracking-tight">
            Max<span className="text-emerald-600">Health</span>
          </a>
          <Button asChild variant="outline" size="sm">
            <a href="/pricing">Get Started</a>
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3">MaxHealth Blog</h1>
          <p className="text-zinc-500">Evidence-based fitness and nutrition insights to fuel your journey.</p>
        </div>

        {/* Email signup */}
        <div className="bg-zinc-50 rounded-xl p-6 mb-12 text-center">
          {subscribed ? (
            <p className="text-emerald-600 font-medium">You&apos;re subscribed! Check your inbox.</p>
          ) : (
            <>
              <p className="font-medium mb-2">Get fitness tips in your inbox</p>
              <div className="flex gap-2 max-w-sm mx-auto">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button onClick={handleSubscribe} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
                  Subscribe
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="space-y-6">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <a href={`/blog/${post.slug}`}>
                <Card className="hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-6 flex gap-6">
                    {post.featuredImage ? (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-32 h-24 object-cover rounded-lg shrink-0 hidden sm:block"
                      />
                    ) : (
                      <div className="w-32 h-24 bg-zinc-100 rounded-lg shrink-0 hidden sm:flex items-center justify-center">
                        <Badge variant="secondary">Article</Badge>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold mb-1 line-clamp-2">{post.title}</h2>
                      <p className="text-sm text-zinc-500 line-clamp-2 mb-2">{post.excerpt}</p>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(post.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-300 shrink-0 self-center hidden sm:block" />
                  </CardContent>
                </Card>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
