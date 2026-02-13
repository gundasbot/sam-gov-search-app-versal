// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL || 'Precise GovCon <noreply@precisegovcon.com>'
const TO_TEAM = process.env.SALES_EMAIL || 'contact@precisegovcon.com'
const SUPPORT = 'support@precisegovcon.com'
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://precisegovcon.com'

// Precise GovCon brand colors
const BRAND = {
  navy: '#1e3a4c',
  navyLight: '#2d5266',
  navyDark: '#0f2a36',
  green: '#7cb342',
  greenLight: '#a5d6a5',
  greenDark: '#558b2f',
  orange: '#ff9800',
  orangeLight: '#ffb74d',
  orangeDark: '#f57c00',
  cyan: '#06b6d4',
  teal: '#10b981',
  darkBg: '#0a1a1f',
  darkerBg: '#051013',
  cardBg: '#0d2229',
  textLight: '#e2e8f0',
  textMuted: '#94a3b8',
}

// Logo URL - using the same domain as noreply@precisegovcon.com
const LOGO_URL = `${SITE}/logo.png`

const INQUIRY_LABELS: Record<string, string> = {
  contract: 'Contract Opportunity',
  consulting: 'Consulting Services',
  partnership: 'Partnership Inquiry',
  subcontracting: 'Subcontracting',
  support: 'Technical Support',
  other: 'General Inquiry',
}

function clamp(v: unknown, max = 120) { 
  return String(v ?? '').trim().slice(0, max) 
}

// ── Shared email wrapper ───────────────────────────────────────────────────
function emailWrap(preheader: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Precise GovCon</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .email-padding { padding: 24px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${BRAND.darkerBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;color:transparent;font-size:1px;line-height:1px;">
    ${preheader}
  </div>
  
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.darkerBg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" 
          style="max-width:600px;width:100%;background:${BRAND.darkBg};border-radius:24px;overflow:hidden;border:1px solid rgba(124,179,66,0.25);box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
          
          <!-- TOP GRADIENT BAR -->
          <tr>
            <td style="height:6px;background:linear-gradient(90deg, ${BRAND.green}, ${BRAND.orange}, ${BRAND.navy}, ${BRAND.green});background-size:300% 100%;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          ${body}

          <!-- FOOTER -->
          <tr>
            <td style="background:${BRAND.navy};padding:32px 40px;text-align:center;border-top:1px solid rgba(124,179,66,0.2);">
              <div style="margin-bottom:16px;">
                <img 
                  src="${LOGO_URL}" 
                  alt="Precise GovCon" 
                  width="160" 
                  style="display:inline-block;width:160px;height:auto;border:0;max-width:100%;opacity:0.9;"
                />
              </div>
              <p style="margin:16px 0 0 0;color:${BRAND.textMuted};font-size:12px;line-height:1.6;">
                © ${new Date().getFullYear()} Precise GovCon LLC · Veteran-Owned Small Business<br>
                Richmond, Virginia · Federal Contract Intelligence
              </p>
              <p style="margin:12px 0 0 0;color:#475569;font-size:11px;">
                <a href="${SITE}" style="color:${BRAND.green};text-decoration:none;border-bottom:1px solid ${BRAND.green};">${SITE}</a> · 
                <a href="mailto:${SUPPORT}" style="color:${BRAND.green};text-decoration:none;border-bottom:1px solid ${BRAND.green};">${SUPPORT}</a>
              </p>
            </td>
          </tr>

          <!-- BOTTOM GRADIENT BAR -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg, ${BRAND.green}, ${BRAND.orange}, ${BRAND.navy});font-size:0;line-height:0;">&nbsp;</td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Team notification email ────────────────────────────────────────────────
function teamEmailHtml(p: {
  name: string; email: string; phone: string; company: string;
  inquiryLabel: string; message: string; fileNames: string[];
}) {
  const rows: [string, string][] = [
    ['Full Name', p.name],
    ['Email',     `<a href="mailto:${p.email}" style="color:${BRAND.green};text-decoration:none;font-weight:600;">${p.email}</a>`],
    ['Phone',     p.phone   || '—'],
    ['Company',   p.company || '—'],
    ['Inquiry',   `<span style="display:inline-block;background:${BRAND.orange};color:#fff;padding:6px 16px;border-radius:100px;font-size:13px;font-weight:700;letter-spacing:0.5px;">${p.inquiryLabel}</span>`],
    ...(p.fileNames.length ? [['Attachments', p.fileNames.join(', ')] as [string, string]] : []),
  ]

  const body = `
  <!-- ORANGE LABEL BAR -->
  <tr>
    <td style="background:${BRAND.orange};padding:14px 40px;text-align:center;">
      <span style="color:#fff;font-size:12px;font-weight:900;letter-spacing:2px;text-transform:uppercase;">
        ⚡ NEW INQUIRY — ${p.inquiryLabel.toUpperCase()} ⚡
      </span>
    </td>
  </tr>

  <tr>
    <td style="padding:40px;background:${BRAND.darkBg};">
      
      <!-- Header with logo -->
      <div style="margin-bottom:32px;text-align:center;">
        <img 
          src="${LOGO_URL}"
          alt="PRECISE GOVCON"
          width="160"
          style="display:inline-block;width:160px;height:auto;border:0;outline:none;max-width:100%;"
        />
      </div>
      
      <h2 style="margin:0 0 24px 0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
        Contact Form Submission
      </h2>

      <!-- Contact details table -->
      <table width="100%" cellpadding="0" cellspacing="0" 
        style="border-radius:16px;overflow:hidden;border:1px solid rgba(124,179,66,0.25);margin-bottom:28px;background:rgba(30,58,76,0.6);">
        <tr>
          <td colspan="2" style="background:rgba(124,179,66,0.15);padding:12px 20px;border-bottom:1px solid rgba(124,179,66,0.25);">
            <span style="font-size:12px;font-weight:800;color:${BRAND.green};text-transform:uppercase;letter-spacing:1px;">📋 CONTACT DETAILS</span>
          </td>
        </tr>
        ${rows.map(([k, v]) => `
        <tr>
          <td style="padding:14px 20px;width:120px;border-bottom:1px solid rgba(124,179,66,0.15);
                    font-size:13px;font-weight:700;color:${BRAND.textMuted};vertical-align:top;">${k}</td>
          <td style="padding:14px 20px;border-bottom:1px solid rgba(124,179,66,0.15);
                    font-size:15px;color:#ffffff;">${v}</td>
        </tr>`).join('')}
      </table>

      ${p.message ? `
      <!-- Message block -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-radius:16px;overflow:hidden;border:1px solid rgba(255,152,0,0.3);">
        <tr>
          <td style="background:rgba(255,152,0,0.1);padding:12px 20px;border-bottom:1px solid rgba(255,152,0,0.2);">
            <span style="font-size:12px;font-weight:800;color:${BRAND.orange};text-transform:uppercase;letter-spacing:1px;">💬 MESSAGE</span>
          </td>
        </tr>
        <tr>
          <td style="padding:20px;background:rgba(30,58,76,0.6);font-size:15px;color:#e2e8f0;line-height:1.7;">
            ${p.message.replace(/\n/g, '<br>')}
          </td>
        </tr>
      </table>` : ''}

      <p style="margin:0;font-size:12px;color:${BRAND.textMuted};text-align:right;">
        Submitted ${new Date().toLocaleString('en-US', { 
          timeZone: 'America/New_York',
          dateStyle: 'full',
          timeStyle: 'short'
        })} EST
      </p>
    </td>
  </tr>`

  return emailWrap(`New ${p.inquiryLabel} from ${p.name}`, body)
}

// ── Customer confirmation email - Clean professional style ─────────────────
function customerEmailHtml(p: {
  firstName: string; email: string; inquiryLabel: string;
}) {
  const body = `
  <!-- HEADER - Navy with Logo -->
  <tr>
    <td style="background:${BRAND.navy};padding:40px 40px 24px;text-align:center;">
      <!-- Logo - Same as noreply@precisegovcon.com -->
      <div style="margin-bottom:16px;">
        <img 
          src="${LOGO_URL}"
          alt="PRECISE GOVCON"
          width="220"
          style="display:inline-block;width:220px;height:auto;border:0;outline:none;max-width:100%;"
        />
      </div>
      
      <!-- Tagline -->
      <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND.green};margin-top:8px;">
        CONTRACTING INTELLIGENCE
      </div>
      
      <!-- Federal Contract Intelligence -->
      <div style="font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${BRAND.textMuted};margin-top:16px;border-top:1px solid ${BRAND.green}30;border-bottom:1px solid ${BRAND.green}30;padding:12px 0;display:inline-block;">
        FEDERAL CONTRACT INTELLIGENCE
      </div>
    </td>
  </tr>

  <!-- GREEN LABEL BAR -->
  <tr>
    <td style="background:${BRAND.green};padding:12px 40px;text-align:center;">
      <span style="color:#fff;font-size:13px;font-weight:900;letter-spacing:2px;text-transform:uppercase;">
        INQUIRY RECEIVED — ${p.inquiryLabel.toUpperCase()}
      </span>
    </td>
  </tr>

  <!-- CONTENT -->
  <tr>
    <td style="padding:48px 40px;background:${BRAND.darkBg};">

      <!-- Greeting -->
      <h2 style="margin:0 0 8px 0;font-size:28px;font-weight:800;color:#ffffff;">
        Thanks, ${p.firstName || 'there'}!
      </h2>
      
      <!-- Message -->
      <p style="margin:0 0 32px 0;color:${BRAND.textMuted};font-size:16px;line-height:1.6;">
        We've received your <strong style="color:${BRAND.orange};">${p.inquiryLabel}</strong> inquiry 
        and will be in touch within <strong style="color:${BRAND.green};">2–3 business days</strong>.
      </p>

      <!-- Divider -->
      <div style="height:1px;background:linear-gradient(90deg, transparent, ${BRAND.green}40, transparent);margin:32px 0;"></div>

      <!-- WHAT HAPPENS NEXT Header -->
      <h3 style="margin:0 0 24px 0;font-size:18px;font-weight:800;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">
        WHAT HAPPENS NEXT
      </h3>

      <!-- Steps - Clean and Simple -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr>
          <td style="padding:8px 0 16px 0;border-bottom:1px solid ${BRAND.green}20;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="40" valign="top" style="font-size:20px;line-height:1.4;">1️⃣</td>
                <td style="padding-left:12px;color:${BRAND.textLight};font-size:16px;line-height:1.5;">
                  Our team reviews your inquiry and your specific needs
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 0 16px 0;border-bottom:1px solid ${BRAND.green}20;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="40" valign="top" style="font-size:20px;line-height:1.4;">2️⃣</td>
                <td style="padding-left:12px;color:${BRAND.textLight};font-size:16px;line-height:1.5;">
                  A specialist contacts you within 2–3 business days
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 0 8px 0;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="40" valign="top" style="font-size:20px;line-height:1.4;">3️⃣</td>
                <td style="padding-left:12px;color:${BRAND.textLight};font-size:16px;line-height:1.5;">
                  We discuss your goals and map out the best path forward
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <div style="height:1px;background:linear-gradient(90deg, transparent, ${BRAND.green}40, transparent);margin:32px 0;"></div>

      <!-- Urgent Question -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 0 0;">
        <tr>
          <td align="center">
            <p style="margin:0 0 8px 0;color:${BRAND.textMuted};font-size:15px;">
              Have an urgent question?
            </p>
            <a href="mailto:${SUPPORT}" 
               style="color:${BRAND.green};font-size:16px;font-weight:600;text-decoration:none;border-bottom:2px solid ${BRAND.green};padding-bottom:2px;">
              ${SUPPORT}
            </a>
          </td>
        </tr>
      </table>

    </td>
  </tr>`

  return emailWrap(`We received your ${p.inquiryLabel} inquiry, ${p.firstName}!`, body)
}

// ── ICS calendar helper ────────────────────────────────────────────────────
function buildICS(name: string, email: string, date: string, time: string, label: string): Buffer {
  const convertTo24 = (t: string) => {
    const [tm, mod] = t.split(' '); 
    let [h, m] = tm.split(':')
    if (h === '12') h = '00'
    if (mod === 'PM') h = String(parseInt(h) + 12)
    return `${h.padStart(2,'0')}:${m || '00'}:00`
  }
  const ts = new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z'
  const start = new Date(date + 'T' + convertTo24(time))
  const end = new Date(start.getTime() + 30 * 60000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z'
  
  return Buffer.from([
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Precise GovCon//EN',
    'CALSCALE:GREGORIAN','METHOD:REQUEST','BEGIN:VEVENT',
    `UID:${ts}-${email}@precisegovcon.com`,`DTSTAMP:${ts}`,
    `DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,
    `SUMMARY:Consultation – ${name}`,
    `DESCRIPTION:Inquiry: ${label}\\nClient: ${name}\\nEmail: ${email}`,
    'STATUS:CONFIRMED','SEQUENCE:0',
    `ORGANIZER;CN=Precise GovCon:mailto:${TO_TEAM}`,
    `ATTENDEE;CN=${name};RSVP=TRUE:mailto:${email}`,
    'BEGIN:VALARM','TRIGGER:-PT15M','ACTION:DISPLAY',
    'DESCRIPTION:Consultation in 15 minutes','END:VALARM',
    'END:VEVENT','END:VCALENDAR',
  ].join('\r\n'))
}

// ── POST ───────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      firstName, lastName, email, phone, company,
      message, preferredDate, preferredTime,
      inquiryType, attachments,
    } = body

    const name = (body.name?.trim()) ||
      [firstName, lastName].filter(Boolean).map((s: string) => s.trim()).join(' ')

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const inquiryLabel = INQUIRY_LABELS[inquiryType] || inquiryType || 'General Inquiry'

    const fileAttachments = Array.isArray(attachments)
      ? attachments.map((a: { filename: string; content: string }) => ({
          filename: a.filename,
          content: Buffer.from(a.content, 'base64'),
        }))
      : []

    const fileNames = fileAttachments.map((a: { filename: string }) => a.filename)

    const icsBuffer = (preferredDate && preferredTime)
      ? buildICS(name, email, preferredDate, preferredTime, inquiryLabel)
      : null

    console.log(`=== Contact: ${name} <${email}> — ${inquiryLabel} ===`)

    if (process.env.RESEND_API_KEY) {
      // 1. Team notification
      await resend.emails.send({
        from: FROM,
        to: TO_TEAM,
        subject: `New ${inquiryLabel} – ${name}`,
        html: teamEmailHtml({
          name, email,
          phone: phone || '',
          company: company || '',
          inquiryLabel,
          message: message || '',
          fileNames,
        }),
        replyTo: email,
        attachments: [
          ...fileAttachments,
          ...(icsBuffer ? [{ filename: 'meeting.ics', content: icsBuffer }] : []),
        ],
      })
      console.log('✅ Team email sent')

      // 2. Customer confirmation
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: `We received your ${inquiryLabel} inquiry – Precise GovCon`,
        html: customerEmailHtml({
          firstName: firstName || name.split(' ')[0] || 'there',
          email,
          inquiryLabel,
        }),
        replyTo: TO_TEAM,
        attachments: [
          ...(icsBuffer ? [{ filename: 'consultation.ics', content: icsBuffer }] : []),
        ],
      })
      console.log('✅ Customer confirmation sent to', email)
    } else {
      console.warn('⚠️  RESEND_API_KEY not set — emails not sent')
    }

    return NextResponse.json({ success: true, message: `Confirmation sent to ${email}.` })

  } catch (error) {
    console.error('Contact POST error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// ── GET – load user contact info (auth required) ───────────────────────────
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        phone: true, company: true, title: true,
        address_line1: true, address_line2: true,
        city: true, state: true, postal_code: true, country: true,
      },
    })
    return NextResponse.json(user)
  } catch (error) {
    console.error('Contact GET error:', error)
    return NextResponse.json({ error: 'Failed to load contact info' }, { status: 500 })
  }
}

// ── PUT – save user contact info (auth required) ───────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const updateData: any = {}
    if (body.phone !== undefined) updateData.phone = clamp(body.phone, 40) || null
    if (body.company !== undefined) updateData.company = clamp(body.company) || null
    if (body.title !== undefined) updateData.title = clamp(body.title) || null
    if (body.address_line1 !== undefined) updateData.address_line1 = clamp(body.address_line1,160) || null
    if (body.address_line2 !== undefined) updateData.address_line2 = clamp(body.address_line2,160) || null
    if (body.city !== undefined) updateData.city = clamp(body.city, 80) || null
    if (body.state !== undefined) updateData.state = clamp(body.state, 40) || null
    if (body.zip !== undefined) updateData.postal_code = clamp(body.zip, 20) || null
    if (body.country !== undefined) updateData.country = clamp(body.country, 60) || null

    const existing = await prisma.users.findUnique({ where: { email }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const updated = await prisma.users.update({
      where: { email },
      data: updateData,
      select: {
        phone: true, company: true, title: true,
        address_line1: true, address_line2: true,
        city: true, state: true, postal_code: true, country: true,
      },
    })
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Contact PUT error:', error)
    return NextResponse.json({ error: 'Failed to save contact info', details: error.message }, { status: 500 })
  }
}