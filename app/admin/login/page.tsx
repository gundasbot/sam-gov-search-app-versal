'use client'

import { useEffect, useState } from 'react'
import { Shield, Users, Activity, Settings, Key, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react'

interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  email_verified: Date | null
  created_at: Date
  updated_at: Date
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminAccess()
    fetchUsers()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const res = await fetch('/api/admin/verify')
      const data = await res.json()
      setIsAdmin(data.isAdmin)
    } catch (error) {
      console.error('Error checking admin access:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Admin Access Required</h2>
          <p className="text-slate-400 mb-6">You do not have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-480 mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-400" />
            Admin Dashboard
          </h1>
          <p className="text-slate-400">Manage users and system settings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Admin Users</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Verified Emails</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.email_verified).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Today's Signups</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => {
                    const today = new Date()
                    const userDate = new Date(u.created_at)
                    return userDate.toDateString() === today.toDateString()
                  }).length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/50 text-left text-sm text-slate-400">
                    <th className="p-4 font-semibold">User</th>
                    <th className="p-4 font-semibold">Role</th>
                    <th className="p-4 font-semibold">Email Status</th>
                    <th className="p-4 font-semibold">Joined</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-slate-700 hover:bg-slate-800/30">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : 'No Name Set'
                            }
                          </p>
                          <p className="text-sm text-slate-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {user.email_verified ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-sm text-green-400">Verified</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-400" />
                              <span className="text-sm text-red-400">Unverified</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {user.role === 'user' ? (
                            <button
                              onClick={() => updateUserRole(user.id, 'admin')}
                              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm transition-colors"
                            >
                              Make Admin
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserRole(user.id, 'user')}
                              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
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
          )}
        </div>

        {/* Admin Tools */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-6 h-6 text-blue-400" />
              <h3 className="font-bold">System Settings</h3>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Configure application settings and preferences.
            </p>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-6 h-6 text-emerald-400" />
              <h3 className="font-bold">API Keys</h3>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Manage API keys and access tokens.
            </p>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-purple-400" />
              <h3 className="font-bold">Email Templates</h3>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Edit email templates and notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
