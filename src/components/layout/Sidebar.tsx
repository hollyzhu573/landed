'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BookOpen,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from 'lucide-react'
import { useSearch } from '@/src/lib/search-context'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/jobs',       label: 'Jobs',        icon: Briefcase },
  { href: '/networking', label: 'Networking',  icon: Users },
  { href: '/prep',       label: 'Prep',        icon: BookOpen },
]

const STORAGE_KEY = 'landed:sidebar-collapsed'

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { setOpen: openSearch } = useSearch()

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) setCollapsed(stored === 'true')
    setMounted(true)
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  // Render a same-width shell before localStorage is read to avoid layout shift
  if (!mounted) return (
    <aside className="sticky top-0 h-screen w-56 shrink-0 bg-[var(--color-sidebar-bg)]" />
  )

  return (
    <aside
      className={`
        sticky top-0 h-screen shrink-0 flex flex-col bg-[var(--color-sidebar-bg)]
        transition-[width] duration-200 ease-in-out overflow-hidden
        ${collapsed ? 'w-[60px]' : 'w-56'}
      `}
    >
      {/* Wordmark */}
      <div className={`flex h-14 shrink-0 items-center border-b border-[var(--color-sidebar-border)] ${collapsed ? 'justify-center px-0' : 'px-5'}`}>
        {collapsed ? (
          <span className="text-lg font-semibold tracking-tight text-white">L</span>
        ) : (
          <span className="text-lg font-semibold tracking-tight text-white">Landed</span>
        )}
      </div>

      {/* Search */}
      <div className="shrink-0 border-b border-[var(--color-sidebar-border)] px-2 py-2">
        <button
          onClick={() => openSearch(true)}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors text-[var(--color-sidebar-text)] hover:bg-white/8 hover:text-white ${collapsed ? 'justify-center' : ''}`}
          aria-label="Search"
        >
          <Search size={16} className="shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-xs">Search…</span>
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
            </>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-2 py-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <div key={href} className="relative group">
              <Link
                href={href}
                className={`
                  relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors
                  ${active
                    ? 'bg-[var(--color-sidebar-active)] text-[var(--color-sidebar-text-active)]'
                    : 'text-[var(--color-sidebar-text)] hover:bg-white/8 hover:text-white'}
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-white/50" />
                )}
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>

              {/* Tooltip (collapsed only) */}
              {collapsed && (
                <div
                  className="
                    pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2
                    rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white
                    opacity-0 transition-opacity group-hover:opacity-100
                    whitespace-nowrap
                  "
                >
                  {label}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom nav: Profile + collapse */}
      <div className="shrink-0 border-t border-[var(--color-sidebar-border)] px-2 py-3 flex flex-col gap-0.5">
        {/* Profile link */}
        <div className="relative group">
          {(() => {
            const active = pathname === '/profile' || pathname.startsWith('/profile')
            return (
              <Link
                href="/profile"
                className={`
                  relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors
                  ${active
                    ? 'bg-[var(--color-sidebar-active)] text-[var(--color-sidebar-text-active)]'
                    : 'text-[var(--color-sidebar-text)] hover:bg-white/8 hover:text-white'}
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-white/50" />
                )}
                <User size={18} className="shrink-0" />
                {!collapsed && <span>Profile</span>}
              </Link>
            )
          })()}
          {collapsed && (
            <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
              Profile
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className={`
            flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium
            text-[var(--color-sidebar-text)] transition-colors hover:bg-white/8 hover:text-white
            ${collapsed ? 'justify-center' : ''}
          `}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <PanelLeftOpen size={18} className="shrink-0" />
            : <><PanelLeftClose size={18} className="shrink-0" /><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  )
}
