'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  Globe,
  Target,
  LayoutDashboard,
  Zap,
  Network,
  Share2,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePulsePlanStore } from '@/lib/store'
import { todayStr } from '@/lib/utils'

const NAV = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/daily', icon: CalendarDays, label: 'Daily Plan' },
  { href: '/yearly', icon: Target, label: 'Year Goals' },
  { href: '/mindmap', icon: Network, label: 'Mind Map' },
  { href: '/scraper', icon: Globe, label: 'Discover' },
]

export function Sidebar() {
  const pathname = usePathname()
  const tasks = usePulsePlanStore((s) => s.tasks)
  const today = todayStr()
  const pendingToday = tasks.filter((t) => t.date === today && !t.completed).length
  const pending = usePulsePlanStore((s) =>
    s.scrapedActivities.filter((a) => a.status === 'pending').length
  )
  const trashCount = usePulsePlanStore((s) => s.trashedTasks.length + s.trashedGoals.length)

  return (
    <aside className="w-14 md:w-60 shrink-0 h-screen flex flex-col bg-neumo-bg p-3 md:p-4 gap-3">
      {/* Logo */}
      <div className="rounded-2xl bg-neumo-bg shadow-neumo-sm px-3 md:px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
            }}
          >
            <Zap size={16} className="text-white" />
          </div>
          <div className="hidden md:block">
            <p className="font-semibold text-sm text-neumo-text">Pulse Plan</p>
            <p className="text-[10px] text-neumo-muted leading-none mt-0.5">v1.0 · Beta</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 rounded-2xl bg-neumo-bg shadow-neumo-sm p-2 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          const badge = href === '/' ? pendingToday : href === '/scraper' ? pending : 0

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'shadow-neumo-press text-neumo-accent'
                  : 'text-neumo-muted hover:text-neumo-text hover:shadow-neumo-xs'
              )}
            >
              <Icon
                size={17}
                className={cn(
                  'shrink-0 transition-colors',
                  active ? 'text-neumo-accent' : 'text-neumo-subtle group-hover:text-neumo-text'
                )}
              />
              <span className="hidden md:block">{label}</span>
              {badge > 0 && (
                <span
                  className="hidden md:flex ml-auto text-[10px] font-semibold w-5 h-5 rounded-full items-center justify-center text-white"
                  style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    boxShadow: '0 2px 6px rgba(102, 126, 234, 0.4)',
                  }}
                >
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Trash + Share */}
      <div className="rounded-2xl bg-neumo-bg shadow-neumo-sm p-2 space-y-1">
        <Link
          href="/trash"
          className={cn(
            'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            pathname === '/trash'
              ? 'shadow-neumo-press text-neumo-text'
              : 'text-neumo-muted hover:text-neumo-text hover:shadow-neumo-xs'
          )}
        >
          <Trash2 size={17} className="shrink-0 text-neumo-subtle group-hover:text-neumo-text transition-colors" />
          <span className="hidden md:flex items-center gap-2 flex-1">
            Trash
            {trashCount > 0 && (
              <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-neumo-bg shadow-neumo-press text-neumo-muted">
                {trashCount}
              </span>
            )}
          </span>
        </Link>
        <Link
          href="/share"
          target="_blank"
          className={cn(
            'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            'text-neumo-muted hover:text-neumo-text hover:shadow-neumo-xs'
          )}
        >
          <Share2 size={17} className="shrink-0 text-neumo-subtle group-hover:text-neumo-text transition-colors" />
          <span className="hidden md:block">Share View</span>
        </Link>
      </div>

      {/* Footer */}
      <div className="rounded-2xl bg-neumo-bg shadow-neumo-sm px-3 py-3">
        <div className="hidden md:flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              boxShadow: '2px 2px 5px #BEC8D4, -2px -2px 5px #FFFFFF',
            }}
          >
            V
          </div>
          <div>
            <p className="text-xs font-medium text-neumo-text">Victor</p>
            <p className="text-[10px] text-neumo-muted">Vibe Coding</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
