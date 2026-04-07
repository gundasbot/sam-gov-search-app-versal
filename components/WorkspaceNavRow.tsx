import Link from 'next/link'
import {
  ArrowLeft,
  Bell,
  Bookmark,
  Search,
  BookUser,
  type LucideIcon,
} from 'lucide-react'

type WorkspaceNavKey =
  | 'alerts-hub'
  | 'saved-alerts'
  | 'saved-searches'
  | 'saved-opportunities'
  | 'recipients'

interface WorkspaceNavRowProps {
  active?: WorkspaceNavKey
  className?: string
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

const NAV_ITEMS: Array<{
  key: WorkspaceNavKey
  href: string
  label: string
  icon: LucideIcon
  color: string
}> = [
  {
    key: 'alerts-hub',
    href: '/alerts',
    label: 'Alerts Hub',
    icon: ArrowLeft,
    color: 'bg-orange-600 hover:bg-orange-700 border-orange-700',
  },
  {
    key: 'saved-alerts',
    href: '/alerts/manage-alerts',
    label: 'Manage Saved Alerts',
    icon: Bell,
    color: 'bg-blue-700 hover:bg-blue-800 border-blue-800',
  },
  {
    key: 'saved-searches',
    href: '/alerts/manage-searches',
    label: 'Manage Saved Searches',
    icon: Bookmark,
    color: 'bg-cyan-600 hover:bg-cyan-700 border-cyan-700',
  },
  {
    key: 'saved-opportunities',
    href: '/dashboard/saved-opportunities',
    label: 'Manage Saved Opportunities',
    icon: Search,
    color: 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700',
  },
  {
    key: 'recipients',
    href: '/contacts',
    label: 'Manage your Alert Recipients',
    icon: BookUser,
    color: 'bg-indigo-600 hover:bg-indigo-700 border-indigo-700',
  },
]

export default function WorkspaceNavRow({ active, className }: WorkspaceNavRowProps) {
  const items = active ? NAV_ITEMS.filter(item => item.key !== active) : NAV_ITEMS

  return (
    <div className={cx('flex flex-wrap gap-2.5', className)}>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cx(
              'inline-flex min-w-[220px] flex-1 items-center justify-start gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white border transition-all shadow-md',
              item.color
            )}
          >
            <Icon className="w-4 h-4" /> {item.label}
          </Link>
        )
      })}
    </div>
  )
}
