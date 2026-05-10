import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { isEmailAdmin } from '@/lib/admin'
import { authOptions } from '@/lib/auth'

const resend = new Resend(process.env.RESEND_API_KEY)

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

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Precise GovCon <noreply@precisegovcon.com>',
      to: ['your-email@example.com'], // Replace with your email
      subject: 'Test Email - Precise GovCon Logo',
      html: `
        <div style="text-align:center;padding:40px;background:#1e3a4c;">
          <img 
            src="https://precisegovcon.com/logo.png" 
            alt="PRECISE GOVCON" 
            width="220"
            style="display:inline-block;"
          />
          <h1 style="color:#fff;">Test Email</h1>
          <p style="color:#e2e8f0;">If you see the logo above, it's working!</p>
        </div>
      `,
    })

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 })
  }
}
