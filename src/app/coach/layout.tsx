'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  UserPlus,
  FileText,
  Settings,
  LogOut,
  Menu,
  LayoutDashboard,
} from 'lucide-react'

const navItems = [
  { label: 'Overview', href: '/coach', icon: LayoutDashboard },
  { label: 'Clients', href: '/coach/clients', icon: Users },
  { label: 'Leads', href: '/coach/leads', icon: UserPlus },
  { label: 'Content', href: '/coach/content', icon: FileText },
  { label: 'Settings', href: '/coach/settings', icon: Settings },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-6">
        <span className="text-xl font-bold text-emerald-600">MaxHealth</span>
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          Coach
        </Badge>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === '/coach'
              ? pathname === '/coach'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* Sign out */}
      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-background lg:block">
        <SidebarContent />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <SidebarContent onNavigate={() => setSheetOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-emerald-600">MaxHealth</span>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              Coach
            </Badge>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
