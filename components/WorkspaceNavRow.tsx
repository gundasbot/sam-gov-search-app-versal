import Link from 'next/link'
import {
  ArrowLeft,
  Bell,
  Bookmark,
  Search,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

export type WorkspaceNavKey =
  | 'alerts-hub'
  | 'saved-alerts'
  | 'saved-searches'
  | 'saved-opportunities'
  | 'recipients'

interface WorkspaceNavRowProps {
  active?: WorkspaceNavKey
  count?: number
  className?: string
}

interface PageMeta {
  href: string
  label: string
  description: string
  icon: LucideIcon
  accent: 'orange' | 'teal' | 'emerald' | 'cyan'
}

const ACCENT = {
  orange: {
    gradient: 'linear-gradient(135deg, #f97316, #fb923c)',
    shadow: 'shadow-[0_16px_34px_rgba(255,122,24,0.24)]',
    soft: 'bg-orange-50 border-orange-200 text-orange-800',
    ring: 'ring-orange-300',
  },
  teal: {
    gradient: 'linear-gradient(135deg, #0f766e, #14b8a6)',
    shadow: 'shadow-[0_16px_34px_rgba(6,95,70,0.22)]',
    soft: 'bg-teal-50 border-teal-200 text-teal-800',
    ring: 'ring-teal-300',
  },
  emerald: {
    gradient: 'linear-gradient(135deg, #059669, #22c55e)',
    shadow: 'shadow-[0_16px_34px_rgba(16,185,129,0.22)]',
    soft: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    ring: 'ring-emerald-300',
  },
  cyan: {
    gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    shadow: 'shadow-[0_16px_34px_rgba(6,182,212,0.18)]',
    soft: 'bg-cyan-50 border-cyan-200 text-cyan-800',
    ring: 'ring-cyan-300',
  },
}

const PAGE_META: Record<WorkspaceNavKey, PageMeta> = {
  'alerts-hub': {
    href: '/alerts',
    label: 'Alerts & Searches Hub',
    description: 'Your central workspace — searches, alerts, saved opportunities, and contacts.',
    icon: ArrowLeft,
    accent: 'orange',
  },
  'saved-alerts': {
    href: '/alerts/manage-alerts',
    label: 'Manage Saved Alerts',
    description: 'Create and schedule automated email alerts for new matching opportunities.',
    icon: Bell,
    accent: 'teal',
  },
  'saved-searches': {
    href: '/alerts/manage-searches',
    label: 'Manage Saved Searches',
    description: 'Build and tune search filters by keywords, agencies, NAICS, set-asides, and geography.',
    icon: Bookmark,
    accent: 'orange',
  },
  'saved-opportunities': {
    href: '/dashboard/saved-opportunities',
    label: 'Manage Saved Opportunities',
    description: 'Review tracked opportunities, watch deadlines, and prioritize your pursuits.',
    icon: Search,
    accent: 'emerald',
  },
  recipients: {
    href: '/contacts',
    label: 'Alert Recipients',
    description: 'Centralize and manage alert recipients and contacts for your team.',
    icon: UserRound,
    accent: 'cyan',
  },
}

const NAV_ORDER: WorkspaceNavKey[] = [
  'saved-searches',
  'saved-alerts',
  'saved-opportunities',
  'recipients',
]

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export default function WorkspaceNavRow({ active, count, className }: WorkspaceNavRowProps) {
  const currentMeta = active ? PAGE_META[active] : null
  const CurrentIcon = currentMeta?.icon ?? null
  const a = currentMeta ? ACCENT[currentMeta.accent] : null

  const navItems = NAV_ORDER.map((key) => ({
    key,
    ...PAGE_META[key],
  }))

  return (
    <div className={cx('space-y-3', className)}>
      {/* Page identity banner */}
      {currentMeta && a && (
        <div className={cx('overflow-hidden rounded-2xl text-white', a.shadow)} style={{ background: a.gradient }}>
          <div className="px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="shrink-0 rounded-xl bg-white/18 p-2.5 ring-1 ring-white/25">
                  {CurrentIcon && <CurrentIcon className="h-6 w-6 text-white" />}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-black leading-tight text-white sm:text-2xl">{currentMeta.label}</h1>
                  <p className="mt-0.5 text-sm font-semibold leading-snug text-white/95">{currentMeta.description}</p>
                </div>
              </div>
              {count !== undefined && count > 0 && (
                <div className="shrink-0 rounded-xl bg-white/20 px-4 py-1.5 text-lg font-black text-white ring-1 ring-white/25">
                  {count}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cross-page navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/alerts"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Alerts & Searches Hub
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {navItems.map((item) => {
          const NavIcon = item.icon
          const navA = ACCENT[item.accent]
          const isActive = item.key === active
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cx(
                'group rounded-2xl px-5 py-4 text-left text-white transition-transform hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                navA.shadow,
                isActive && cx('ring-4', navA.ring)
              )}
              style={{ background: navA.gradient }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <NavIcon className="h-5 w-5 shrink-0 text-white" />
                  <span className="text-base font-black leading-tight text-white">{item.label}</span>
                </div>
                {isActive && (
                  <span className="shrink-0 rounded-full bg-white/22 px-2.5 py-1 text-xs font-black text-white ring-1 ring-white/25">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-semibold leading-snug text-white/95">{item.description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
