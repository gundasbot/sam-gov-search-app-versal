'use client'

import { useEffect, useState } from 'react'
import { Shield, Users, Activity, Settings, Key, Mail, Calendar, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  created_at: Date
  updated_at: Date
  phone: string | null
  company: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
}

export default function AdminDashboard() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    checkAdminAccess()
    fetchUsers()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const res = await fetch('/api/admin/verify')
      const data = await res.json()
      setIsAdmin(data.isAdmin)
      if (!data.isAdmin) {
        router.push('/account/profile')
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
    }
  }

  const fetchUsers = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) {
        if (res.status === 403) {
          setIsAdmin(false)
          router.push('/account/profile')
        }
        throw new Error('Failed to fetch users')
      }
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: newRole })
      })
      
      if (res.ok) {
        fetchUsers() // Refresh the list
      }
    } catch (error) {
      console.error('Error updating user role:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Admin Access Required</h2>
          <p className="text-slate-400 mb-6">You do not have permission to access this page.</p>
          <button
            onClick={() => router.push('/account/profile')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
          >
            Back to Profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                Admin Dashboard
              </h1>
              <p className="text-slate-400">Manage users and system settings</p>
            </div>
            <button
              onClick={fetchUsers}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Users</p>
                <p className="text-xl sm:text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Admin Users</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
            </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Today's Signups</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {users.filter(u => {
                    const today = new Date()
                    const userDate = new Date(u.created_at)
                    return userDate.toDateString() === today.toDateString()
                  }).length}
                </p>
              </div>
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
            </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">This Week</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {users.filter(u => {
                    const weekAgo = new Date()
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    return new Date(u.created_at) > weekAgo
                  }).length}
                </p>
              </div>
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden mb-6">
          <div className="p-4 sm:p-6 border-b border-slate-700">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management ({users.length} users)
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50 text-left text-xs sm:text-sm text-slate-400">
                  <th className="p-3 sm:p-4 font-semibold">User</th>
                  <th className="p-3 sm:p-4 font-semibold">Role</th>
                  <th className="p-3 sm:p-4 font-semibold hidden sm:table-cell">Location</th>
                  <th className="p-3 sm:p-4 font-semibold">Joined</th>
                  <th className="p-3 sm:p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-700 hover:bg-slate-800/30">
                    <td className="p-3 sm:p-4">
                      <div>
                        <p className="font-medium text-sm sm:text-base">
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}`
                            : <span className="text-slate-500">No Name</span>
                          }
                        </p>
                        <p className="text-xs sm:text-sm text-slate-400 truncate max-w-[150px] sm:max-w-none">
                          {user.email}
                        </p>
                        {user.company && (
                          <p className="text-xs text-slate-500 mt-1">{user.company}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 hidden sm:table-cell">
                      <div className="text-xs sm:text-sm text-slate-400">
                        {user.city && user.state ? `${user.city}, ${user.state}` : 'Not set'}
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-slate-400">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex gap-2">
                        {user.role === 'user' ? (
                          <button
                            onClick={() => updateUserRole(user.id, 'admin')}
                            className="px-2 py-1 sm:px-3 sm:py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs sm:text-sm transition-colors"
                            title="Make Admin"
                          >
                            Make Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => updateUserRole(user.id, 'user')}
                            className="px-2 py-1 sm:px-3 sm:py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs sm:text-sm transition-colors"
                            title="Remove Admin"
                          >
                            Remove Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && !loading && (
            <div className="p-8 text-center">
              <p className="text-slate-400">No users found</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Settings className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold">System Settings</h3>
            </div>
            <p className="text-slate-400 text-sm">
              Configure application settings and preferences.
            </p>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Key className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold">API Keys</h3>
            </div>
            <p className="text-slate-400 text-sm">
              Manage API keys and access tokens.
            </p>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold">Email Templates</h3>
            </div>
            <p className="text-slate-400 text-sm">
              Edit email templates and notifications.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-500">
            Admin Dashboard • Precise GovCon • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
