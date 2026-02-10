// components/AddressBookModal.tsx
'use client'

import { useState } from 'react'
import { X, Mail, Building2, User, Loader2, Plus, Trash2, Check } from 'lucide-react'

interface RecipientContact {
  id: string
  email: string
  name?: string | null
  organization?: string | null
  notes?: string | null
  useCount: number
  lastUsedAt?: string | null
  createdAt: string
}

interface AddressBookModalProps {
  isOpen: boolean
  onClose: () => void
  contacts: RecipientContact[]
  selectedContacts: string[]
  onToggleContact: (id: string) => void
  onApply: () => void
  onAddContact: (contact: Omit<RecipientContact, 'id' | 'useCount' | 'createdAt'>) => Promise<void>
  onDeleteContact: (id: string) => Promise<void>
  loading?: boolean
}

export default function AddressBookModal({
  isOpen,
  onClose,
  contacts,
  selectedContacts,
  onToggleContact,
  onApply,
  onAddContact,
  onDeleteContact,
  loading = false,
}: AddressBookModalProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContact, setNewContact] = useState({
    email: '',
    name: '',
    organization: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleAddContact() {
    if (!newContact.email) return

    try {
      setSaving(true)
      await onAddContact({
        email: newContact.email,
        name: newContact.name || undefined,
        organization: newContact.organization || undefined,
        notes: newContact.notes || undefined,
        lastUsedAt: undefined,
      })
      setNewContact({ email: '', name: '', organization: '', notes: '' })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding contact:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await onDeleteContact(id)
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Error deleting contact:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-xl p-6 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-cyan-400" />
            <h3 className="text-xl font-bold text-white">Address Book</h3>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-semibold">
              {contacts.length} contacts
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Add Contact Form */}
        {showAddForm ? (
          <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-white">Add New Contact</h4>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-sm text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  value={newContact.organization}
                  onChange={(e) => setNewContact({ ...newContact, organization: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500"
                  placeholder="Company Name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500"
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <button
              onClick={handleAddContact}
              disabled={!newContact.email || saving}
              className="mt-3 px-4 py-2 rounded-lg bg-cyan-500 hover:opacity-90 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Contact
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="mb-6 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-sm transition-colors flex items-center gap-2 w-fit"
          >
            <Plus className="h-4 w-4" />
            Add New Contact
          </button>
        )}

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No contacts yet</p>
              <p className="text-slate-500 text-xs mt-1">Add your first contact above</p>
            </div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedContacts.includes(contact.id)
                    ? 'bg-cyan-500/10 border-cyan-500/50'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
                onClick={() => onToggleContact(contact.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedContacts.includes(contact.id)
                          ? 'bg-cyan-500 border-cyan-500'
                          : 'border-slate-600'
                      }`}
                    >
                      {selectedContacts.includes(contact.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium truncate">{contact.email}</p>
                        {contact.useCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-xs">
                            Used {contact.useCount}x
                          </span>
                        )}
                      </div>
                      {contact.name && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-300 mb-1">
                          <User className="h-3.5 w-3.5" />
                          <span>{contact.name}</span>
                        </div>
                      )}
                      {contact.organization && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-400">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{contact.organization}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirmId(contact.id)
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Delete Confirmation */}
                {deleteConfirmId === contact.id && (
                  <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
                    <p className="text-sm text-slate-300">Delete this contact?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirmId(null)
                        }}
                        className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(contact.id)
                        }}
                        className="px-3 py-1 rounded-lg bg-red-500 hover:opacity-90 text-white text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <p className="text-sm text-slate-400">
            {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onApply}
              disabled={selectedContacts.length === 0}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Recipients
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
