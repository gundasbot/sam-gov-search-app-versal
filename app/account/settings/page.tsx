// app/account/settings/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import {
  User, Mail, Lock, Bell, LogOut, Settings, Shield, Phone, MapPin,
  Edit2, Save, X, Loader2, CheckCircle, AlertCircle, Eye, EyeOff,
  ChevronRight, ArrowLeft, Calendar, Globe, Clock
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
type UserProfile = {
  id: string
  email: string
  name: string
  company?: string
  phone?: string
  location?: string
  timezone?: string
  createdAt: string
  updatedAt: string
  role: 'user' | 'admin'
  verified: boolean
}

type NotificationPreferences = {
  emailAlerts: boolean
  smsAlerts: boolean
  dailyDigest: boolean
  weeklyReport: boolean
  opportunityReminders: boolean
  systemNotifications: boolean
}

type SecurityLog = {
  id: string
  action: string
  device: string
  location: string
  timestamp: string
  ipAddress: string
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function clsx(...c: Array<string | boolean | null | undefined>) { 
  return c.filter(Boolean).join(' ') 
}

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatRelativeDate(d?: string | null) {
  if (!d) return 'Never'
  const diff = Date.now() - new Date(d).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(d)
}

// ─── Main Component ───────────────────────────────────────────────────────────
function UserSettingsContent() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailAlerts: true,
    smsAlerts: false,
    dailyDigest: true,
    weeklyReport: true,
    opportunityReminders: true,
    systemNotifications: true,
  })
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([])
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({})
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'sessions'>('profile')

  useEffect(() => {
    void fetchUserData()
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  async function fetchUserData() {
    try {
      setLoading(true)
      // Mock API calls - replace with actual endpoints
      const userRes = await fetch('/api/user/profile')
      const notificationsRes = await fetch('/api/user/notifications')
      const logsRes = await fetch('/api/user/security-logs')

      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData)
        setProfileForm(userData)
      }
      if (notificationsRes.ok) {
        const notifData = await notificationsRes.json()
        setNotifications(notifData)
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json()
        setSecurityLogs(logsData)
      }
    } catch (err: any) {
      setToast({ type: 'error', message: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile() {
    if (!profileForm.email?.trim()) {
      setToast({ type: 'error', message: 'Email is required' })
      return
    }
    if (!profileForm.name?.trim()) {
      setToast({ type: 'error', message: 'Name is required' })
      return
    }

    try {
      setBusyId('profile')
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save profile')
      }

      const updated = await res.json()
      setUser(updated)
      setEditingProfile(false)
      setToast({ type: 'success', message: 'Profile updated successfully!' })
    } catch (err: any) {
      setToast({ type: 'error', message: err.message })
    } finally {
      setBusyId(null)
    }
  }

  async function updatePassword() {
    if (!passwordForm.current.trim()) {
      setToast({ type: 'error', message: 'Current password is required' })
      return
    }
    if (!passwordForm.new.trim()) {
      setToast({ type: 'error', message: 'New password is required' })
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setToast({ type: 'error', message: 'Passwords do not match' })
      return
    }
    if (passwordForm.new.length < 8) {
      setToast({ type: 'error', message: 'Password must be at least 8 characters' })
      return
    }

    try {
      setBusyId('password')
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update password')
      }

      setPasswordForm({ current: '', new: '', confirm: '' })
      setShowPasswordForm(false)
      setToast({ type: 'success', message: 'Password updated successfully!' })
    } catch (err: any) {
      setToast({ type: 'error', message: err.message })
    } finally {
      setBusyId(null)
    }
  }

  async function toggleNotification(key: keyof NotificationPreferences) {
    try {
      const updated = { ...notifications, [key]: !notifications[key] }
      const res = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })

      if (!res.ok) throw new Error('Failed to update')
      setNotifications(updated)
    } catch (err: any) {
      setToast({ type: 'error', message: err.message })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }}>
      {/* Toast */}
      {toast && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none">
          <div className={clsx('relative w-full max-w-xl mx-4 rounded-2xl shadow-2xl border-2 p-5',
            toast.type === 'success' && 'border-emerald-400 bg-emerald-50',
            toast.type === 'error' && 'border-rose-400 bg-rose-50',
            toast.type === 'info' && 'border-blue-400 bg-blue-50')}>
            <div className="flex items-center gap-3 pointer-events-auto">
              {toast.type === 'success' && <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="h-6 w-6 text-rose-600 flex-shrink-0" />}
              {toast.type === 'info' && <Bell className="h-6 w-6 text-blue-600 flex-shrink-0" />}
              <p className={clsx('flex-1 text-sm font-medium', 
                toast.type === 'success' && 'text-emerald-800', 
                toast.type === 'error' && 'text-rose-800', 
                toast.type === 'info' && 'text-blue-800')}>{toast.message}</p>
              <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 sm:px-8 py-8">
        {/* Back Nav */}
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center flex-shrink-0">
                  <User className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{user?.name || 'User Settings'}</h1>
                  <p className="text-slate-600 text-sm mt-0.5">{user?.email}</p>
                </div>
              </div>
              {user?.verified && (
                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">Verified Account</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => setEditingProfile(!editingProfile)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm transition-colors"
            >
              <Edit2 className="h-4 w-4" /> 
              {editingProfile ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-0.5 mb-8 overflow-x-auto border-b border-slate-200">
          {['profile', 'notifications', 'security', 'sessions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={clsx(
                'px-4 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px',
                activeTab === tab
                  ? 'text-slate-900 border-slate-900'
                  : 'text-slate-600 border-transparent hover:text-slate-700'
              )}
            >
              {tab === 'profile' && <span className="flex items-center gap-2"><User className="h-4 w-4" /> Profile</span>}
              {tab === 'notifications' && <span className="flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</span>}
              {tab === 'security' && <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Security</span>}
              {tab === 'sessions' && <span className="flex items-center gap-2"><Globe className="h-4 w-4" /> Sessions</span>}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <User className="h-5 w-5 text-slate-600" /> Basic Information
              </h2>

              {editingProfile ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={profileForm.name || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none text-sm"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      value={profileForm.email || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none text-sm"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Company</label>
                    <input
                      type="text"
                      value={profileForm.company || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none text-sm"
                      placeholder="Your company name"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={profileForm.phone || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none text-sm"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={profileForm.location || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none text-sm"
                        placeholder="City, State"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Timezone</label>
                    <select
                      value={profileForm.timezone || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none text-sm bg-white"
                    >
                      <option value="">Select timezone</option>
                      <option value="EST">Eastern (EST)</option>
                      <option value="CST">Central (CST)</option>
                      <option value="MST">Mountain (MST)</option>
                      <option value="PST">Pacific (PST)</option>
                    </select>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={saveProfile}
                      disabled={busyId === 'profile'}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {busyId === 'profile' ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                      ) : (
                        <><Save className="h-4 w-4" /> Save Changes</>
                      )}
                    </button>
                    <button
                      onClick={() => { setEditingProfile(false); setProfileForm(user || {}) }}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Name</p>
                      <p className="text-slate-900 font-semibold">{user?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</p>
                      <p className="text-slate-900 font-semibold flex items-center gap-2">
                        {user?.email}
                        {user?.verified && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                      </p>
                    </div>
                  </div>
                  {user?.company && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Company</p>
                        <p className="text-slate-900 font-semibold">{user.company}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Phone</p>
                        <p className="text-slate-900 font-semibold">{user.phone || '—'}</p>
                      </div>
                    </div>
                  )}
                  {user?.location && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Location</p>
                        <p className="text-slate-900 font-semibold">{user.location}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Timezone</p>
                        <p className="text-slate-900 font-semibold">{user.timezone || '—'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-slate-600" /> Account Status
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Member Since</p>
                  <p className="text-slate-900 font-semibold">{formatDate(user?.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Last Updated</p>
                  <p className="text-slate-900 font-semibold">{formatDate(user?.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-slate-600" /> Password
                </h2>
              </div>

              {showPasswordForm ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Current Password *</label>
                    <input
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none text-sm"
                      placeholder="Enter your current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">New Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.new}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none text-sm pr-10"
                        placeholder="Enter your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">Must be at least 8 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password *</label>
                    <input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none text-sm"
                      placeholder="Confirm your new password"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={updatePassword}
                      disabled={busyId === 'password'}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {busyId === 'password' ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>
                      ) : (
                        <><Save className="h-4 w-4" /> Update Password</>
                      )}
                    </button>
                    <button
                      onClick={() => { setShowPasswordForm(false); setPasswordForm({ current: '', new: '', confirm: '' }) }}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Change your password to keep your account secure</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Bell className="h-5 w-5 text-slate-600" /> Notification Preferences
              </h2>

              <div className="space-y-4">
                {[
                  { key: 'emailAlerts', label: 'Email Alerts', description: 'Receive email notifications for matching opportunities' },
                  { key: 'smsAlerts', label: 'SMS Alerts', description: 'Get text messages for urgent opportunities' },
                  { key: 'dailyDigest', label: 'Daily Digest', description: 'Receive a daily summary of new opportunities' },
                  { key: 'weeklyReport', label: 'Weekly Report', description: 'Get a comprehensive weekly report' },
                  { key: 'opportunityReminders', label: 'Opportunity Reminders', description: 'Reminders for upcoming opportunity deadlines' },
                  { key: 'systemNotifications', label: 'System Notifications', description: 'Important updates and security alerts' },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{label}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{description}</p>
                    </div>
                    <button
                      onClick={() => toggleNotification(key as keyof NotificationPreferences)}
                      className={clsx(
                        'relative inline-flex h-8 w-14 items-center rounded-full transition-colors flex-shrink-0',
                        notifications[key as keyof NotificationPreferences]
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      )}
                    >
                      <span
                        className={clsx(
                          'inline-block h-6 w-6 transform rounded-full bg-white transition-transform',
                          notifications[key as keyof NotificationPreferences] ? 'translate-x-7' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Shield className="h-5 w-5 text-slate-600" /> Two-Factor Authentication
              </h2>
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <p className="font-semibold text-slate-900">Enable Two-Factor Authentication</p>
                  <p className="text-sm text-slate-600 mt-0.5">Add an extra layer of security to your account</p>
                </div>
                <button className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors">
                  Enable 2FA
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {securityLogs.length > 0 ? (
                  securityLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">{log.action}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-600 mt-1">
                          <span>{log.device}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{log.location}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{log.ipAddress}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 whitespace-nowrap">{formatRelativeDate(log.timestamp)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm text-center py-8">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Globe className="h-5 w-5 text-slate-600" /> Active Sessions
              </h2>
              <p className="text-slate-600 text-sm mb-6">Manage all the devices and browsers you're signed into</p>
              
              <div className="space-y-3">
                <div className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">Chrome on macOS</p>
                      <p className="text-sm text-slate-600 mt-1">San Francisco, CA • 192.168.1.1</p>
                      <p className="text-xs text-emerald-700 font-medium mt-2 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                        Current session
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 whitespace-nowrap">Just now</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">Safari on iPhone</p>
                      <p className="text-sm text-slate-600 mt-1">San Francisco, CA • 192.168.1.50</p>
                      <p className="text-xs text-slate-500 font-medium mt-2">Last active 2 days ago</p>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors">
                      Sign out
                    </button>
                  </div>
                </div>
              </div>

              <button className="w-full mt-6 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors">
                Sign out all other sessions
              </button>
            </div>
          </div>
        )}

        {/* Sign Out Button */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors shadow-lg">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UserSettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="h-8 w-8 text-slate-400 animate-spin" /></div>}>
      <UserSettingsContent />
    </Suspense>
  )
}
