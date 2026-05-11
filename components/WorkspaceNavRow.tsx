import Link from 'next/link'
import {
  ArrowLeft,
  Bell,
  Bookmark,
  Search,
  BookUser,
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
  // Banner (current page header)
  bannerBg: string
  bannerBorder: string
  // Nav button (pointing TO this page)
  navBg: string
  navHover: string
  navBorder: string
  navActiveBg: string
}

const PAGE_META: Record<WorkspaceNavKey, PageMeta> = {
  'alerts-hub': {
    href: '/alerts',
    label: 'Alerts & Searches Hub',
    description: 'Your central workspace — searches, alerts, saved opportunities, and contacts.',
    icon: ArrowLeft,
    bannerBg: 'bg-orange-600',
    bannerBorder: 'border-orange-700',
    navBg: 'bg-orange-600',
    navHover: 'hover:bg-orange-700',
    navBorder: 'border-orange-700',
    navActiveBg: 'bg-orange-700',
  },
  'saved-alerts': {
    href: '/alerts/manage-alerts',
    label: 'Manage Saved Alerts',
    description: 'Create and schedule automated email alerts for new matching opportunities.',
    icon: Bell,
    bannerBg: 'bg-blue-700',
    bannerBorder: 'border-blue-800',
    navBg: 'bg-blue-700',
    navHover: 'hover:bg-blue-800',
    navBorder: 'border-blue-800',
    navActiveBg: 'bg-blue-800',
  },
  'saved-searches': {
    href: '/alerts/manage-searches',
    label: 'Manage Saved Searches',
    description: 'Build and tune search filters by keywords, agencies, NAICS, set-asides, and geography.',
    icon: Bookmark,
    bannerBg: 'bg-cyan-600',
    bannerBorder: 'border-cyan-700',
    navBg: 'bg-cyan-600',
    navHover: 'hover:bg-cyan-700',
    navBorder: 'border-cyan-700',
    navActiveBg: 'bg-cyan-700',
  },
  'saved-opportunities': {
    href: '/dashboard/saved-opportunities',
    label: 'Manage Saved Opportunities',
    description: 'Review tracked opportunities, watch deadlines, and prioritize your pursuits.',
    icon: Search,
    bannerBg: 'bg-emerald-600',
    bannerBorder: 'border-emerald-700',
    navBg: 'bg-emerald-600',
    navHover: 'hover:bg-emerald-700',
    navBorder: 'border-emerald-700',
    navActiveBg: 'bg-emerald-700',
  },
  recipients: {
    href: '/contacts',
    label: 'Alert Recipients',
    description: 'Centralize and manage alert recipients and contacts for your team.',
    icon: BookUser,
    bannerBg: 'bg-indigo-600',
    bannerBorder: 'border-indigo-700',
    navBg: 'bg-indigo-600',
    navHover: 'hover:bg-indigo-700',
    navBorder: 'border-indigo-700',
    navActiveBg: 'bg-indigo-700',
  },
}

const NAV_ORDER: WorkspaceNavKey[] = [
  'alerts-hub',
  'saved-alerts',
  'saved-searches',
  'saved-opportunities',
  'recipients',
]

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export default function WorkspaceNavRow({ active, count, className }: WorkspaceNavRowProps) {
  const currentMeta = active ? PAGE_META[active] : null
  const CurrentIcon = currentMeta?.icon ?? null

  const navItems = NAV_ORDER.filter((key) => key !== active).map((key) => ({
    key,
    ...PAGE_META[key],
  }))

  return (
    <div className={cx('space-y-3', className)}>
      {/* ── Page identity banner ────────────────────────────────── */}
      {currentMeta && (
        <div
          className={cx(
            'rounded-2xl px-5 py-4 shadow-md border',
            currentMeta.bannerBg,
            currentMeta.bannerBorder
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="shrink-0 bg-white/20 rounded-xl p-2.5">
                {CurrentIcon && <CurrentIcon className="w-6 h-6 text-white" />}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-black text-white leading-tight">{currentMeta.label}</h1>
                <p className="text-white/75 text-sm mt-0.5 leading-snug">{currentMeta.description}</p>
              </div>
            </div>
            {count !== undefined && count > 0 && (
              <div className="shrink-0 bg-white/20 text-white font-black text-lg px-4 py-1.5 rounded-xl border border-white/30">
                {count}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Navigation buttons to sibling pages ─────────────────── */}
      <div className="flex flex-wrap gap-2">
        {navItems.map((item) => {
          const NavIcon = item.icon
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cx(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white border transition-colors shadow-sm',
                item.navBg,
                item.navHover,
                item.navBorder
              )}
            >
              <NavIcon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
