// Contact List Manager Component
// app/components/Contactlistmanager.tsx

import { useState } from 'react'
import { Users, Plus, Trash2, Edit, Mail, Check, X, Upload, Download } from 'lucide-react'

interface ContactList {
  id: string
  name: string
  description?: string
  emails: string[]
  createdAt: string
  updatedAt: string
}

interface ContactListManagerProps {
  isOpen: boolean
  onClose: () => void
  onSelectList?: (emails: string[]) => void
}

export function ContactListManager({ isOpen, onClose, onSelectList }: ContactListManagerProps) {
  const [lists, setLists] = useState<ContactList[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newListName, setNewListName] = useState('')
  const [newListDesc, setNewListDesc] = useState('')
  const [newListEmails, setNewListEmails] = useState('')

  if (!isOpen) return null

  const handleCreateList = () => {
    const emails = newListEmails
      .split(/[,\n]/)
      .map(e => e.trim())
      .filter(e => e && e.includes('@'))

    if (!newListName.trim() || emails.length === 0) {
      alert('Please provide a list name and at least one valid email')
      return
    }

    const newList: ContactList = {
      id: Date.now().toString(),
      name: newListName,
      description: newListDesc,
      emails,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setLists([...lists, newList])
    setNewListName('')
    setNewListDesc('')
    setNewListEmails('')
    setIsCreating(false)
  }

  const handleDeleteList = (id: string) => {
    if (confirm('Are you sure you want to delete this contact list?')) {
      setLists(lists.filter(l => l.id !== id))
    }
  }

  const handleSelectList = (list: ContactList) => {
    if (onSelectList) {
      onSelectList(list.emails)
      onClose()
    }
  }

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const emails = text
        .split(/[,\n]/)
        .map(e => e.trim())
        .filter(e => e && e.includes('@'))
      
      setNewListEmails(emails.join('\n'))
    }
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl border border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Contact List Manager</h3>
                <p className="text-sm text-purple-100 mt-0.5">Manage email lists for mass subscriptions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Create New List Button */}
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-4 rounded-xl border-2 border-dashed border-slate-600 hover:border-purple-500 bg-slate-800/50 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-slate-300 hover:text-white"
            >
              <Plus className="h-5 w-5" />
              <span className="font-semibold">Create New Contact List</span>
            </button>
          )}

          {/* Create New List Form */}
          {isCreating && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white">New Contact List</h4>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  List Name *
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g., Marketing Team, Sales Contacts"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  placeholder="Brief description of this list"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-300">
                    Email Addresses *
                  </label>
                  <label className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer transition-colors flex items-center gap-2">
                    <Upload className="h-3.5 w-3.5" />
                    Import CSV
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleImportCSV}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  value={newListEmails}
                  onChange={(e) => setNewListEmails(e.target.value)}
                  placeholder="Enter email addresses (one per line or comma-separated)&#10;example@company.com&#10;another@company.com"
                  rows={6}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                />
                <p className="text-xs text-slate-400 mt-2">
                  {newListEmails.split(/[,\n]/).filter(e => e.trim() && e.includes('@')).length} valid emails
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreateList}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Check className="h-4 w-4" />
                  Create List
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Existing Lists */}
          <div className="space-y-3">
            {lists.length === 0 && !isCreating && (
              <div className="text-center py-12 text-slate-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No contact lists yet. Create your first one above!</p>
              </div>
            )}

            {lists.map((list) => (
              <div
                key={list.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Mail className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-white">{list.name}</h5>
                        {list.description && (
                          <p className="text-sm text-slate-400">{list.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-400 ml-11">
                      <span>{list.emails.length} email{list.emails.length !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>Updated {new Date(list.updatedAt).toLocaleDateString()}</span>
                    </div>

                    {/* Show first 3 emails as preview */}
                    <div className="flex flex-wrap gap-1.5 mt-3 ml-11">
                      {list.emails.slice(0, 3).map((email, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-700 text-xs text-slate-300"
                        >
                          {email}
                        </span>
                      ))}
                      {list.emails.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-700 text-xs text-slate-400">
                          +{list.emails.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {onSelectList && (
                      <button
                        onClick={() => handleSelectList(list)}
                        className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors"
                      >
                        Use List
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteList(list.id)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            {lists.length} contact list{lists.length !== 1 ? 's' : ''} • Total {lists.reduce((acc, l) => acc + l.emails.length, 0)} emails
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}