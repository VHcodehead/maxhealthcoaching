'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Loader2,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  FileText,
  Star,
  AlertTriangle,
} from 'lucide-react'
import type { BlogPost, Transformation } from '@/types/database'

export default function ContentPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Blog
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [postDialogOpen, setPostDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [postForm, setPostForm] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    published: false,
    featured_image: '',
  })
  const [savingPost, setSavingPost] = useState(false)

  // Transformations
  const [transformations, setTransformations] = useState<Transformation[]>([])
  const [transformDialogOpen, setTransformDialogOpen] = useState(false)
  const [editingTransform, setEditingTransform] = useState<Transformation | null>(null)
  const [transformForm, setTransformForm] = useState({
    client_name: '',
    before_photo: '',
    after_photo: '',
    weight_lost: '',
    duration: '',
    quote: '',
    featured: false,
  })
  const [savingTransform, setSavingTransform] = useState(false)

  const loadContent = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/coach/content')
      if (!res.ok) {
        throw new Error('Failed to load content')
      }
      const data = await res.json()
      setPosts(data.posts || [])
      setTransformations(data.transformations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadContent()
  }, [loadContent])

  // -- Blog Post CRUD --

  function openNewPost() {
    setEditingPost(null)
    setPostForm({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      published: false,
      featured_image: '',
    })
    setPostDialogOpen(true)
  }

  function openEditPost(post: BlogPost) {
    setEditingPost(post)
    setPostForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      published: post.published,
      featured_image: post.featured_image || '',
    })
    setPostDialogOpen(true)
  }

  async function handleSavePost() {
    try {
      setSavingPost(true)

      if (editingPost) {
        const res = await fetch('/api/coach/content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'post',
            id: editingPost.id,
            title: postForm.title,
            slug: postForm.slug,
            content: postForm.content,
            excerpt: postForm.excerpt,
            published: postForm.published,
            featured_image: postForm.featured_image || null,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update post')
        }
      } else {
        const res = await fetch('/api/coach/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'post',
            title: postForm.title,
            slug: postForm.slug,
            content: postForm.content,
            excerpt: postForm.excerpt,
            published: postForm.published,
            featured_image: postForm.featured_image || null,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create post')
        }
      }

      setPostDialogOpen(false)
      await loadContent()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save post')
    } finally {
      setSavingPost(false)
    }
  }

  async function handleDeletePost(id: string) {
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      const res = await fetch('/api/coach/content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'post', id }),
      })
      if (!res.ok) {
        throw new Error('Failed to delete post')
      }
      setPosts((prev) => prev.filter((p) => p.id !== id))
    } catch {
      alert('Failed to delete post')
    }
  }

  // -- Transformation CRUD --

  function openNewTransformation() {
    setEditingTransform(null)
    setTransformForm({
      client_name: '',
      before_photo: '',
      after_photo: '',
      weight_lost: '',
      duration: '',
      quote: '',
      featured: false,
    })
    setTransformDialogOpen(true)
  }

  function openEditTransformation(t: Transformation) {
    setEditingTransform(t)
    setTransformForm({
      client_name: t.client_name,
      before_photo: t.before_photo || '',
      after_photo: t.after_photo || '',
      weight_lost: t.weight_lost,
      duration: t.duration,
      quote: t.quote,
      featured: t.featured,
    })
    setTransformDialogOpen(true)
  }

  async function handleSaveTransformation() {
    try {
      setSavingTransform(true)

      if (editingTransform) {
        const res = await fetch('/api/coach/content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'transformation',
            id: editingTransform.id,
            client_name: transformForm.client_name,
            before_photo: transformForm.before_photo || null,
            after_photo: transformForm.after_photo || null,
            weight_lost: transformForm.weight_lost,
            duration: transformForm.duration,
            quote: transformForm.quote,
            featured: transformForm.featured,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update transformation')
        }
      } else {
        const res = await fetch('/api/coach/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'transformation',
            client_name: transformForm.client_name,
            before_photo: transformForm.before_photo || null,
            after_photo: transformForm.after_photo || null,
            weight_lost: transformForm.weight_lost,
            duration: transformForm.duration,
            quote: transformForm.quote,
            featured: transformForm.featured,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create transformation')
        }
      }

      setTransformDialogOpen(false)
      await loadContent()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save transformation')
    } finally {
      setSavingTransform(false)
    }
  }

  async function handleDeleteTransformation(id: string) {
    if (!confirm('Are you sure you want to delete this transformation?')) return
    try {
      const res = await fetch('/api/coach/content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'transformation', id }),
      })
      if (!res.ok) {
        throw new Error('Failed to delete transformation')
      }
      setTransformations((prev) => prev.filter((t) => t.id !== id))
    } catch {
      alert('Failed to delete transformation')
    }
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <AlertTriangle className="size-12 text-destructive" />
        <p className="text-lg text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content Management</h1>
        <p className="text-muted-foreground">
          Manage blog posts and client transformations
        </p>
      </div>

      <Tabs defaultValue="blog">
        <TabsList>
          <TabsTrigger value="blog">
            <FileText className="mr-1.5 size-4" />
            Blog Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="transformations">
            <Star className="mr-1.5 size-4" />
            Transformations ({transformations.length})
          </TabsTrigger>
        </TabsList>

        {/* Blog Posts Tab */}
        <TabsContent value="blog">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Blog Posts</CardTitle>
                  <CardDescription>
                    Create and manage articles for your site
                  </CardDescription>
                </div>
                <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={openNewPost}
                    >
                      <Plus className="mr-1 size-4" />
                      New Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingPost ? 'Edit Post' : 'New Blog Post'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingPost
                          ? 'Update this blog post'
                          : 'Create a new blog post for your site'}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="post-title">Title</Label>
                        <Input
                          id="post-title"
                          value={postForm.title}
                          onChange={(e) => {
                            setPostForm((prev) => ({
                              ...prev,
                              title: e.target.value,
                              slug: editingPost
                                ? prev.slug
                                : generateSlug(e.target.value),
                            }))
                          }}
                          placeholder="Post title..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="post-slug">Slug</Label>
                        <Input
                          id="post-slug"
                          value={postForm.slug}
                          onChange={(e) =>
                            setPostForm((prev) => ({
                              ...prev,
                              slug: e.target.value,
                            }))
                          }
                          placeholder="post-url-slug"
                        />
                      </div>

                      <div>
                        <Label htmlFor="post-excerpt">Excerpt</Label>
                        <Input
                          id="post-excerpt"
                          value={postForm.excerpt}
                          onChange={(e) =>
                            setPostForm((prev) => ({
                              ...prev,
                              excerpt: e.target.value,
                            }))
                          }
                          placeholder="Short description..."
                        />
                      </div>

                      <div>
                        <Label htmlFor="post-content">Content</Label>
                        <textarea
                          id="post-content"
                          value={postForm.content}
                          onChange={(e) =>
                            setPostForm((prev) => ({
                              ...prev,
                              content: e.target.value,
                            }))
                          }
                          placeholder="Write your article..."
                          rows={12}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                        />
                      </div>

                      <div>
                        <Label htmlFor="post-image">Featured Image URL</Label>
                        <Input
                          id="post-image"
                          value={postForm.featured_image}
                          onChange={(e) =>
                            setPostForm((prev) => ({
                              ...prev,
                              featured_image: e.target.value,
                            }))
                          }
                          placeholder="https://..."
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="post-published"
                          checked={postForm.published}
                          onChange={(e) =>
                            setPostForm((prev) => ({
                              ...prev,
                              published: e.target.checked,
                            }))
                          }
                          className="size-4 rounded border accent-emerald-600"
                        />
                        <Label htmlFor="post-published">
                          Publish immediately
                        </Label>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setPostDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleSavePost}
                        disabled={
                          savingPost || !postForm.title || !postForm.slug
                        }
                      >
                        {savingPost && (
                          <Loader2 className="mr-1 size-4 animate-spin" />
                        )}
                        {editingPost ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="p-0">
              {posts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12">
                  <FileText className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No blog posts yet. Create your first one!
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">
                          {post.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          /{post.slug}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={post.published ? 'default' : 'secondary'}
                            className={
                              post.published
                                ? 'bg-emerald-100 text-emerald-700'
                                : ''
                            }
                          >
                            {post.published ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(post.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEditPost(post)}
                              >
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transformations Tab */}
        <TabsContent value="transformations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Client Transformations</CardTitle>
                  <CardDescription>
                    Showcase client before/after results
                  </CardDescription>
                </div>
                <Dialog
                  open={transformDialogOpen}
                  onOpenChange={setTransformDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={openNewTransformation}
                    >
                      <Plus className="mr-1 size-4" />
                      New Transformation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>
                        {editingTransform
                          ? 'Edit Transformation'
                          : 'New Transformation'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingTransform
                          ? 'Update this transformation'
                          : 'Add a new client transformation'}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="transform-name">Client Name</Label>
                        <Input
                          id="transform-name"
                          value={transformForm.client_name}
                          onChange={(e) =>
                            setTransformForm((prev) => ({
                              ...prev,
                              client_name: e.target.value,
                            }))
                          }
                          placeholder="Client name..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="transform-before">
                            Before Photo URL
                          </Label>
                          <Input
                            id="transform-before"
                            value={transformForm.before_photo}
                            onChange={(e) =>
                              setTransformForm((prev) => ({
                                ...prev,
                                before_photo: e.target.value,
                              }))
                            }
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="transform-after">
                            After Photo URL
                          </Label>
                          <Input
                            id="transform-after"
                            value={transformForm.after_photo}
                            onChange={(e) =>
                              setTransformForm((prev) => ({
                                ...prev,
                                after_photo: e.target.value,
                              }))
                            }
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="transform-weight">Weight Lost</Label>
                          <Input
                            id="transform-weight"
                            value={transformForm.weight_lost}
                            onChange={(e) =>
                              setTransformForm((prev) => ({
                                ...prev,
                                weight_lost: e.target.value,
                              }))
                            }
                            placeholder="e.g. 15kg"
                          />
                        </div>
                        <div>
                          <Label htmlFor="transform-duration">Duration</Label>
                          <Input
                            id="transform-duration"
                            value={transformForm.duration}
                            onChange={(e) =>
                              setTransformForm((prev) => ({
                                ...prev,
                                duration: e.target.value,
                              }))
                            }
                            placeholder="e.g. 12 weeks"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="transform-quote">
                          Client Quote
                        </Label>
                        <textarea
                          id="transform-quote"
                          value={transformForm.quote}
                          onChange={(e) =>
                            setTransformForm((prev) => ({
                              ...prev,
                              quote: e.target.value,
                            }))
                          }
                          placeholder="What the client said about their experience..."
                          rows={3}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="transform-featured"
                          checked={transformForm.featured}
                          onChange={(e) =>
                            setTransformForm((prev) => ({
                              ...prev,
                              featured: e.target.checked,
                            }))
                          }
                          className="size-4 rounded border accent-emerald-600"
                        />
                        <Label htmlFor="transform-featured">
                          Feature on homepage
                        </Label>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setTransformDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleSaveTransformation}
                        disabled={
                          savingTransform || !transformForm.client_name
                        }
                      >
                        {savingTransform && (
                          <Loader2 className="mr-1 size-4 animate-spin" />
                        )}
                        {editingTransform ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="p-0">
              {transformations.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12">
                  <Star className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No transformations yet. Add your first one!
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Weight Lost</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transformations.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">
                          {t.client_name}
                        </TableCell>
                        <TableCell>{t.weight_lost}</TableCell>
                        <TableCell>{t.duration}</TableCell>
                        <TableCell>
                          {t.featured ? (
                            <Badge className="bg-amber-100 text-amber-700">
                              Featured
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(t.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEditTransformation(t)}
                              >
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  handleDeleteTransformation(t.id)
                                }
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
