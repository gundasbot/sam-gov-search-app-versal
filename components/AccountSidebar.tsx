// components/AccountSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  User, 
  Mail, 
  Key, 
  CreditCard, 
  Bell,
  LogOut,
  Settings,
  Shield,
  FileText
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const navigation = [
  {
    name: 'Profile',
    href: '/account/profile',
    icon: User,
    description: 'Personal information',
  },
  {
    name: 'Contact Info',
    href: '/account/contact',
    icon: Mail,
    description: 'Email & phone',
  },
  {
    name: 'Password',
    href: '/account/password',
    icon: Key,
    description: 'Security settings',
  },
  {
    name: 'My Plan',
    href: '/account/plan',
    icon: CreditCard,
    description: 'Subscription & billing',
  },
  {
    name: 'Subscriptions',
    href: '/account/subscriptions',
    icon: Bell,
    description: 'Email preferences',
  },
  {
    name: 'Documents',
    href: '/account/documents',
    icon: FileText,
    description: 'Saved searches & exports',
  },
  {
    name: 'Security',
    href: '/account/security',
    icon: Shield,
    description: 'Two-factor auth & sessions',
  },
];

export default function AccountSidebar() {
  const pathname = usePathname();

  return (
    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700 rounded-2xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Account Settings</h2>
            <p className="text-sm text-slate-400">Manage your profile and preferences</p>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-gray-800/60 border border-transparent hover:border-gray-700'
                }
              `}
            >
              <div className={`
                p-2 rounded-lg
                ${isActive 
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-400' 
                  : 'bg-gray-800/60'
                }
              `}>
                <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs opacity-75">{item.description}</div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out Button */}
      <div className="mt-8 pt-6 border-t border-gray-700">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-300 border border-red-500/20 hover:border-red-500/40"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>

      {/* Stats */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700">
        <div className="text-sm text-slate-400 mb-2">Account Status</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-sm font-medium text-emerald-400">Active</span>
        </div>
        <div className="text-xs text-slate-500 mt-2">All systems operational</div>
      </div>
    </div>
  );
}