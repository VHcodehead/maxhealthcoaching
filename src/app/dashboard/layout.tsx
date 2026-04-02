'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Dumbbell,
  TrendingUp,
  Gift,
  LogOut,
  Menu,
  X,
  Activity,
  Pill,
  MessageSquare,
} from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/meals', label: 'Meal Plan', icon: UtensilsCrossed },
  { href: '/dashboard/training', label: 'Training', icon: Dumbbell },
  { href: '/dashboard/supplements', label: 'Supplements', icon: Pill },
  { href: '/checkin', label: 'Check-in', icon: Activity },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/progress', label: 'Progress', icon: TrendingUp },
  { href: '/dashboard/referral', label: 'Referral', icon: Gift },
]

interface UserProfile {
  full_name: string | null
  email: string | null
}

function SidebarContent({
  user,
  pathname,
  onSignOut,
  onNavClick,
  unreadCount,
}: {
  user: UserProfile | null
  pathname: string
  onSignOut: () => void
  onNavClick?: () => void
  unreadCount?: number
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">
          Max<span className="text-emerald-600">Health</span>
        </span>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavClick}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon
                  className={`h-4.5 w-4.5 transition-colors ${
                    isActive
                      ? 'text-emerald-600'
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                />
                {item.label}
                {item.href === '/dashboard/messages' && unreadCount && unreadCount > 0 ? (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-semibold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : isActive ? (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                ) : null}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User section */}
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar size="default">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
              {user?.full_name
                ? user.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : '??'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">
              {user?.full_name || 'Loading...'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email || ''}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/messages?count_only=true')
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.unreadTotal) setUnreadCount(data.unreadTotal)
        })
        .catch(() => { /* non-critical */ })
    }
  }, [status])

  // Redirect to login if unauthenticated
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  const user: UserProfile | null = session?.user
    ? {
        full_name: session.user.name || null,
        email: session.user.email || null,
      }
    : null

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const currentPageLabel =
    navItems.find((item) =>
      item.href === '/dashboard'
        ? pathname === '/dashboard'
        : pathname.startsWith(item.href)
    )?.label || 'Dashboard'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-white lg:flex lg:flex-col">
        <SidebarContent
          user={user}
          pathname={pathname}
          onSignOut={handleSignOut}
          unreadCount={unreadCount}
        />
      </aside>

      {/* Mobile Header + Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-3 border-b bg-white px-4 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <SidebarContent
                user={user}
                pathname={pathname}
                onSignOut={handleSignOut}
                onNavClick={() => setMobileOpen(false)}
                unreadCount={unreadCount}
              />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold">
              Max<span className="text-emerald-600">Health</span>
            </span>
          </div>
          <span className="ml-auto text-sm text-muted-foreground">
            {currentPageLabel}
          </span>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
