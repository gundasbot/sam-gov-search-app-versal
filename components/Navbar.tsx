'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Search, LayoutDashboard, Info, LogOut, LogIn, User, Settings } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import SignInModal from './SignInModal'

export default function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  
  const isActive = (path: string) => pathname === path

  return (
    <>
      <nav className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-md overflow-hidden">
                <Image 
                  src="/precise-govcon-logo.jpg" 
                  alt="Precise Analytics Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <div className="text-white font-bold text-xl">Precise Analytics</div>
                <div className="text-slate-400 text-xs">Federal Contract Intelligence</div>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              <Link
                href="/"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/') 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Home
              </Link>

              {session && (
                <Link
                  href="/search"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive('/search') 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Search
                </Link>
              )}

              {session && (
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive('/dashboard') 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              )}

              <Link
                href="/about"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/about') 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Info className="w-4 h-4" />
                About
              </Link>

              {/* LOGGED IN USER - ACCOUNT DROPDOWN */}
              {session ? (
                <div className="relative ml-2">
                  <button
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-white text-sm font-medium">Account</span>
                  </button>

                  {/* Account Dropdown Menu */}
                  {accountMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setAccountMenuOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 py-2">
                        <div className="px-4 py-3 border-b border-slate-700">
                          <p className="text-xs text-slate-400">Signed in as</p>
                          <p className="text-sm font-medium text-white truncate mt-1">
                            {session.user?.email}
                          </p>
                        </div>

                        <Link
                          href="/account/profile"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span className="text-sm">Account Settings</span>
                        </Link>

                        <button
                          onClick={() => {
                            setAccountMenuOpen(false)
                            signOut({ callbackUrl: '/' })
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-slate-700 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Sign Out</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* LOGGED OUT USER - SIGN IN BUTTON (OPENS MODAL) */
                <button
                  onClick={() => {
                    console.log('🔵 Sign In button clicked! Opening modal...')
                    setShowSignInModal(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors ml-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sign In Modal - Only shows when showSignInModal is true */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => {
          console.log('🔴 Closing modal...')
          setShowSignInModal(false)
        }}
      />
    </>
  )
}
