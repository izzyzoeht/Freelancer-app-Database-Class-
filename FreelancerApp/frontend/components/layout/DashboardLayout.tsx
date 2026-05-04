'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface NavItem { href: string; label: string; icon: string }

const EMPLOYER_NAV: NavItem[] = [
  { href: '/employer/dashboard',  label: 'Dashboard',      icon: '⊞' },
  { href: '/employer/browse',     label: 'Browse Trades',  icon: '⌕' },
  { href: '/bookings',            label: 'My Bookings',    icon: '📋' },
  { href: '/notifications',       label: 'Notifications',  icon: '🔔' },
  { href: '/profile',             label: 'Profile',        icon: '👤' },
]

const TRADESPERSON_NAV: NavItem[] = [
  { href: '/tradesperson/dashboard', label: 'Dashboard',   icon: '⊞' },
  { href: '/tradesperson/jobs',      label: 'Browse Jobs', icon: '⌕' },
  { href: '/bookings',               label: 'My Bookings', icon: '📋' },
  { href: '/reviews',                label: 'Reviews',     icon: '★' },
  { href: '/notifications',          label: 'Notifications', icon: '🔔' },
  { href: '/profile',                label: 'Profile',     icon: '👤' },
]

const JUNIOR_NAV: NavItem[] = [
  { href: '/junior/dashboard',  label: 'Dashboard',      icon: '⊞' },
  { href: '/junior/setup',      label: 'My Setup',       icon: '📁' },
  { href: '/junior/jobs',       label: 'Browse Jobs',    icon: '⌕' },
  { href: '/notifications',     label: 'Notifications',  icon: '🔔' },
  { href: '/profile',           label: 'Profile',        icon: '👤' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const nav =
    user?.user_type === 'Employer'     ? EMPLOYER_NAV :
    user?.user_type === 'Tradesperson' ? TRADESPERSON_NAV :
    JUNIOR_NAV

  return (
    <div className="min-h-screen flex bg-cream">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-navy flex flex-col shrink-0 sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/10">
          <Link href="/" className="font-display text-2xl text-teal">TradeConnect</Link>
          {user && (
            <p className="text-white/40 text-xs mt-1 truncate">
              {user.first_name} {user.last_name} · {user.user_type}
            </p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          {nav.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-teal/20 text-teal'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all font-medium"
          >
            ← Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
