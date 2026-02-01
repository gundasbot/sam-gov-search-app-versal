'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'

type Mode = 'profile' | 'contact'

type ApiProfile = {
  first_name?: string
  last_name?: string
  phone?: string
  company?: string
  title?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  phone_verified?: boolean
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function formatPhoneUI(input: string) {
  const raw = String(input || '').trim()
  if (!raw) return ''
  const isPlus = raw.startsWith('+')
  const digits = raw.replace(/\D/g, '')
  if (isPlus) return '+' + digits.slice(0, 15)
  const d = digits.slice(0, 10)
  if (d.length <= 3) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function normalizePhoneDB(input: string) {
  const raw = String(input || '').trim()
  if (!raw) return ''
  const isPlus = raw.startsWith('+')
  const digits = raw.replace(/\D/g, '')
  return isPlus ? '+' + digits.slice(0, 15) : digits.slice(0, 10)
}

function isValidPhone(input: string) {
  const norm = normalizePhoneDB(input)
  if (!norm) return true
  if (norm.startsWith('+')) {
    const digits = norm.slice(1)
    return digits.length >= 8 && digits.length <= 15
  }
  return norm.length === 10
}

async function safeJson(res: Response) {
  const text = await res.text()
  try {
    return { ok: res.ok, data: JSON.parse(text) as any }
  } catch {
    return { ok: false, data: { error: text.slice(0, 200) } as any }
  }
}

export default function ProfileContactForm({ mode }: { mode: Mode }) {
  const { data: session, status } = useSession()

  const [base, setBase] = useState<ApiProfile | null>(null)
  const [form, setForm] = useState<ApiProfile>({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string>('')

  const email = String(session?.user?.email || '').trim()
  const emailOk = !email || isValidEmail(email)
  const phoneOk = isValidPhone(String(form.phone || ''))

  const fields = useMemo(() => {
    if (mode === 'profile') {
      return [
        { key: 'first_name' as const, label: 'First Name', placeholder: 'First name' },
        { key: 'last_name' as const, label: 'Last Name', placeholder: 'Last name' },
        { key: 'phone' as const, label: 'Phone', placeholder: '(555) 555-1234 or +15555551234' },
        { key: 'city' as const, label: 'City', placeholder: 'City' },
        { key: 'state' as const, label: 'State', placeholder: 'State' },
      ]
    }
    return [
      { key: 'phone' as const, label: 'Phone', placeholder: '(555) 555-1234 or +15555551234' },
      { key: 'company' as const, label: 'Company', placeholder: 'Company' },
      { key: 'title' as const, label: 'Job Title', placeholder: 'Title' },
      { key: 'address_line1' as const, label: 'Address Line 1', placeholder: 'Street address' },
      { key: 'address_line2' as const, label: 'Address Line 2', placeholder: 'Apt, suite, etc.' },
      { key: 'city' as const, label: 'City', placeholder: 'City' },
      { key: 'state' as const, label: 'State', placeholder: 'State' },
      { key: 'postal_code' as const, label: 'ZIP/Postal', placeholder: 'ZIP/Postal' },
      { key: 'country' as const, label: 'Country', placeholder: 'Country' },
    ]
  }, [mode])

  useEffect(() => {
    if (status !== 'authenticated') return
    ;(async () => {
      const res = await fetch('/api/account/profile')
      const j = await safeJson(res)
      if (!j.ok) return
      const full: ApiProfile = {
        first_name: j.data.first_name || '',
        last_name: j.data.last_name || '',
        phone: j.data.phone || '',
        company: j.data.company || '',
        title: j.data.title || '',
        address_line1: j.data.address_line1 || '',
        address_line2: j.data.address_line2 || '',
        city: j.data.city || '',
        state: j.data.state || '',
        postal_code: j.data.postal_code || '',
        country: j.data.country || '',
        phone_verified: !!j.data.phone_verified,
      }
      setBase(full)
      setForm({ ...full, phone: formatPhoneUI(full.phone || '') })
    })()
  }, [status])

  const update =
    (key: keyof ApiProfile) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      setMsg('')
      setForm((p) => ({ ...p, [key]: key === 'phone' ? formatPhoneUI(v) : v }))
    }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    if (!base) return
    if (!emailOk) return setMsg('Invalid email')
    if (!phoneOk) return setMsg('Invalid phone')

    setSaving(true)
    try {
      // Merge to avoid wiping fields not shown
      const payload: ApiProfile = { ...base }

      if (mode === 'profile') {
        payload.first_name = String(form.first_name || '').trim()
        payload.last_name = String(form.last_name || '').trim()
        payload.phone = normalizePhoneDB(String(form.phone || ''))
        payload.city = String(form.city || '').trim()
        payload.state = String(form.state || '').trim()
      } else {
        payload.phone = normalizePhoneDB(String(form.phone || ''))
        payload.company = String(form.company || '').trim()
        payload.title = String(form.title || '').trim()
        payload.address_line1 = String(form.address_line1 || '').trim()
        payload.address_line2 = String(form.address_line2 || '').trim()
        payload.city = String(form.city || '').trim()
        payload.state = String(form.state || '').trim()
        payload.postal_code = String(form.postal_code || '').trim()
        payload.country = String(form.country || '').trim()
      }

      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await safeJson(res)
      if (!j.ok) throw new Error(j.data?.error || 'Save failed')

      const full: ApiProfile = {
        first_name: j.data.first_name || '',
        last_name: j.data.last_name || '',
        phone: j.data.phone || '',
        company: j.data.company || '',
        title: j.data.title || '',
        address_line1: j.data.address_line1 || '',
        address_line2: j.data.address_line2 || '',
        city: j.data.city || '',
        state: j.data.state || '',
        postal_code: j.data.postal_code || '',
        country: j.data.country || '',
        phone_verified: !!j.data.phone_verified,
      }
      setBase(full)
      setForm({ ...full, phone: formatPhoneUI(full.phone || '') })
      setMsg('✅ Saved')
    } catch (err: any) {
      setMsg(`❌ ${err?.message || 'Save failed'}`)
    } finally {
      setSaving(false)
    }
  }

  if (status !== 'authenticated') return <div className="text-slate-200">Please log in</div>

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white">
          {mode === 'profile' ? 'Profile' : 'Contact Information'}
        </h2>
        <p className="text-slate-400">
          {mode === 'profile'
            ? 'Names, phone, email, and location'
            : 'Update your contact details'}{' '}
          • <span className="text-slate-500">{email || '—'}</span>
        </p>
      </div>

      <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((f) => {
          const id = `${mode}_${String(f.key)}`
          const isPhone = f.key === 'phone'
          const invalid = isPhone ? !phoneOk && !!form.phone : false
          return (
            <div key={String(f.key)} className={mode === 'profile' && f.key === 'phone' ? 'md:col-span-2' : ''}>
              <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-2">
                {f.label}
              </label>
              <input
                id={id}
                name={String(f.key)}
                value={String((form as any)[f.key] || '')}
                onChange={update(f.key)}
                disabled={saving}
                inputMode={isPhone ? 'tel' : 'text'}
                className={`w-full px-4 py-3 bg-slate-700/80 border rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
                  invalid ? 'border-red-500/60 focus:ring-red-500/40' : 'border-slate-600 focus:ring-emerald-500/50'
                }`}
                placeholder={f.placeholder}
              />
            </div>
          )
        })}

        {msg && (
          <div className="col-span-full text-sm text-slate-200">
            {msg}
          </div>
        )}

        <div className="col-span-full">
          <button
            type="submit"
            disabled={saving || !emailOk || !phoneOk}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-6 py-4 rounded-2xl font-semibold text-white"
          >
            {saving ? 'Saving…' : mode === 'profile' ? 'Save Profile' : 'Save Contact Info'}
          </button>
        </div>
      </form>
    </div>
  )
}
