import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { isEmailAdmin } from '@/lib/admin'
import { authOptions } from '@/lib/auth'
import { dbQuery } from '@/lib/db'
import { sendAccessRequestConfirmation } from '@/lib/email'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.toLowerCase().trim()
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = await isEmailAdmin(email)
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return null
}

export async function GET() {
  const authError = await requireAdmin()
  if (authError) return authError

  const to = 'YOUR_EMAIL@gmail.com'

  const result = await sendAccessRequestConfirmation({ to, name: 'Test User', company: 'Precise GovCon' })

  const messageId = (result as any)?.data?.id ?? null

  await dbQuery(
    `insert into email_audit_log (email_type, recipient, provider_message_id, status)
     values ($1, $2, $3, $4)`,
    ['test', to.toLowerCase(), messageId, 'sent']
  )

  return NextResponse.json({
    ok: true,
    messageId,
  })
}
