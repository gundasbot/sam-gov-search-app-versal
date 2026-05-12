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
  accent: 'orange' | 'blue' | 'cyan' | 'emerald' | 'indigo'
}

const ACCENT = {
  orange: {
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    leftBorder: 'border-l-4 border-l-orange-500',
    titleColor: 'text-orange-700',
    countBg: 'bg-orange-100 text-orange-700 border border-orange-200',
    navClasses: 'bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300',
  },
  blue: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    leftBorder: 'border-l-4 border-l-blue-500',
    titleColor: 'text-blue-700',
    countBg: 'bg-blue-100 text-blue-700 border border-blue-200',
    navClasses: 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300',
  },
  cyan: {
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    leftBorder: 'border-l-4 border-l-cyan-500',
    titleColor: 'text-cyan-700',
    countBg: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
    navClasses: 'bg-cyan-50 border border-cyan-200 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-300',
  },
  emerald: {
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    leftBorder: 'border-l-4 border-l-emerald-500',
    titleColor: 'text-emerald-700',
    countBg: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    navClasses: 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300',
  },
  indigo: {
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    leftBorder: 'border-l-4 border-l-indigo-500',
    titleColor: 'text-indigo-700',
    countBg: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    navClasses: 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300',
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
    accent: 'blue',
  },
  'saved-searches': {
    href: '/alerts/manage-searches',
    label: 'Manage Saved Searches',
    description: 'Build and tune search filters by keywords, agencies, NAICS, set-asides, and geography.',
    icon: Bookmark,
    accent: 'cyan',
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
    icon: BookUser,
    accent: 'indigo',
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
  const a = currentMeta ? ACCENT[currentMeta.accent] : null

  const navItems = NAV_ORDER.filter((key) => key !== active).map((key) => ({
    key,
    ...PAGE_META[key],
  }))

  return (
    <div className={cx('space-y-3', className)}>
      {/* ── Page identity banner ────────────────────────────────── */}
      {currentMeta && a && (
        <div className={cx('rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden', a.leftBorder)}>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className={cx('shrink-0 rounded-xl p-2.5', a.iconBg)}>
                  {CurrentIcon && <CurrentIcon className={cx('w-6 h-6', a.iconColor)} />}
                </div>
                <div className="min-w-0">
                  <h1 className={cx('text-2xl font-black leading-tight', a.titleColor)}>{currentMeta.label}</h1>
                  <p className="text-slate-500 text-sm mt-0.5 leading-snug">{currentMeta.description}</p>
                </div>
              </div>
              {count !== undefined && count > 0 && (
                <div className={cx('shrink-0 font-black text-lg px-4 py-1.5 rounded-xl', a.countBg)}>
                  {count}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation buttons to sibling pages ─────────────────── */}
      <div className="flex flex-wrap gap-2">
        {navItems.map((item) => {
          const NavIcon = item.icon
          const navA = ACCENT[item.accent]
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cx(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm',
                navA.navClasses
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
