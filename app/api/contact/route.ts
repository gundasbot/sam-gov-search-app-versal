// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const resend  = new Resend(process.env.RESEND_API_KEY)
const FROM    = process.env.RESEND_FROM_EMAIL || 'Precise GovCon <contact@precisegovcon.com>'
const TO_TEAM = process.env.SALES_EMAIL       || 'contact@preciseanalytics.io'
const SUPPORT = 'support@precisegovcon.com'
const SITE    = 'https://precisegovcon.com'
// Always use the hosted public URL — no CID/inline attachments
const LOGO_URL = `${SITE}/logo.png`

const INQUIRY_LABELS: Record<string, string> = {
  contract:       'Contract Opportunity',
  consulting:     'Consulting Services',
  partnership:    'Partnership Inquiry',
  subcontracting: 'Subcontracting',
  support:        'Technical Support',
  other:          'General Inquiry',
}

function clamp(v: unknown, max = 120) { return String(v ?? '').trim().slice(0, max) }

// ── Shared email wrapper ───────────────────────────────────────────────────
function emailWrap(preheader: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Precise GovCon</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheader}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:32px 16px">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0"
  style="max-width:620px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10)">

  <!-- TOP GRADIENT BAR -->
  <tr><td style="height:5px;background:linear-gradient(90deg,#06b6d4 0%,#10b981 50%,#f97316 100%);font-size:0;line-height:0">&nbsp;</td></tr>

  <!-- BRANDED HEADER (dark navy matching app) -->
  <tr>
    <td style="background:linear-gradient(135deg,#021020 0%,#031e38 100%);padding:28px 40px;text-align:center">
      <!--
        Logo + brand name side-by-side, matching the app header.
        White pill behind logo ensures visibility on dark bg in all email clients.
      -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 10px">
        <tr>
          <!-- Logo in white pill -->
          <td style="vertical-align:middle;padding-right:14px">
            <div style="background:#ffffff;border-radius:12px;padding:8px;display:inline-block">
              <img src="${LOGO_URL}"
                   alt="Precise GovCon"
                   width="48" height="48"
                   style="display:block;border:0;outline:none;border-radius:8px">
            </div>
          </td>
          <!-- Brand name -->
          <td style="vertical-align:middle;text-align:left">
            <div style="font-size:22px;font-weight:900;letter-spacing:.04em;line-height:1.1">
              <span style="color:#ffffff">PRECISE </span><span style="color:#f97316">GOVCON</span>
            </div>
            <div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#67e8f9;margin-top:3px">
              contracting intelligence
            </div>
          </td>
        </tr>
      </table>
      <div style="font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#475569;margin-top:4px">
        Federal Contract Intelligence
      </div>
    </td>
  </tr>

  ${body}

  <!-- FOOTER -->
  <tr>
    <td style="background:#021020;padding:24px 40px;text-align:center">
      <div style="display:inline-block;background:#ffffff;border-radius:10px;padding:6px 10px;margin-bottom:10px;opacity:.85">
        <img src="${LOGO_URL}" alt="" width="28" height="28"
             style="display:block;border:0;border-radius:6px">
      </div>
      <p style="margin:0;color:#67e8f9;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">
        Precise GovCon
      </p>
      <p style="margin:5px 0 0;color:#475569;font-size:12px">
        Helping businesses unlock federal contracting opportunities
      </p>
      <p style="margin:5px 0 0;color:#475569;font-size:11px">
        © ${new Date().getFullYear()} Precise GovCon &nbsp;·&nbsp;
        <a href="${SITE}" style="color:#06b6d4;text-decoration:none">${SITE}</a>
      </p>
    </td>
  </tr>

  <!-- BOTTOM GRADIENT BAR -->
  <tr><td style="height:4px;background:linear-gradient(90deg,#06b6d4 0%,#10b981 50%,#f97316 100%);font-size:0;line-height:0">&nbsp;</td></tr>

</table>
</td></tr>
</table>
</body></html>`
}

// ── Team notification email ────────────────────────────────────────────────
function teamEmailHtml(p: {
  name: string; email: string; phone: string; company: string;
  inquiryLabel: string; message: string; fileNames: string[];
}) {
  const rows: [string, string][] = [
    ['Full Name', p.name],
    ['Email',     `<a href="mailto:${p.email}" style="color:#0891b2;text-decoration:none">${p.email}</a>`],
    ['Phone',     p.phone   || '—'],
    ['Company',   p.company || '—'],
    ['Inquiry',   `<span style="display:inline-block;background:#f97316;color:#fff;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700">${p.inquiryLabel}</span>`],
    ...(p.fileNames.length ? [['Attachments', p.fileNames.join(', ')] as [string, string]] : []),
  ]

  const body = `
  <!-- ORANGE LABEL BAR -->
  <tr>
    <td style="background:#f97316;padding:12px 40px">
      <span style="color:#fff;font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase">
        New Inquiry — ${p.inquiryLabel}
      </span>
    </td>
  </tr>

  <tr><td style="padding:36px 40px">
    <h2 style="margin:0 0 24px;font-size:22px;font-weight:900;color:#0f172a">
      Contact Form Submission
    </h2>

    <!-- Contact details table -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:28px">
      <tr>
        <td colspan="2" style="background:#f8fafc;padding:8px 18px;border-bottom:1px solid #e2e8f0">
          <span style="font-size:11px;font-weight:800;color:#06b6d4;text-transform:uppercase;letter-spacing:.1em">Contact Details</span>
        </td>
      </tr>
      ${rows.map(([k, v]) => `
      <tr>
        <td style="padding:12px 18px;width:130px;border-bottom:1px solid #f1f5f9;
                   font-size:13px;font-weight:700;color:#64748b;vertical-align:top">${k}</td>
        <td style="padding:12px 18px;border-bottom:1px solid #f1f5f9;
                   font-size:15px;color:#0f172a">${v}</td>
      </tr>`).join('')}
    </table>

    ${p.message ? `
    <!-- Message block -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      <tr>
        <td style="background:#f8fafc;padding:8px 18px;border:1px solid #e2e8f0;
                   border-bottom:none;border-radius:8px 8px 0 0">
          <span style="font-size:11px;font-weight:800;color:#06b6d4;text-transform:uppercase;letter-spacing:.1em">Message</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 18px;border:1px solid #e2e8f0;border-top:none;
                   border-radius:0 0 8px 8px;font-size:15px;color:#334155;line-height:1.7">
          ${p.message.replace(/\n/g, '<br>')}
        </td>
      </tr>
    </table>` : ''}

    <p style="margin:0;font-size:12px;color:#94a3b8">
      Submitted ${new Date().toLocaleString()} via precisegovcon.com
    </p>
  </td></tr>`

  return emailWrap(`New ${p.inquiryLabel} from ${p.name}`, body)
}

// ── Customer confirmation email ────────────────────────────────────────────
function customerEmailHtml(p: {
  firstName: string; email: string; inquiryLabel: string;
}) {
  const body = `
  <!-- CYAN-EMERALD LABEL BAR -->
  <tr>
    <td style="background:linear-gradient(90deg,#059669,#06b6d4);padding:12px 40px">
      <span style="color:#fff;font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase">
        Inquiry Received — ${p.inquiryLabel}
      </span>
    </td>
  </tr>

  <tr><td style="padding:40px;text-align:center">

    <!-- Check mark circle -->
    <div style="width:76px;height:76px;background:#d1fae5;border-radius:50%;
                display:inline-flex;align-items:center;justify-content:center;
                margin-bottom:20px;font-size:40px">✅</div>

    <h2 style="margin:0 0 10px;font-size:26px;font-weight:900;color:#0f172a">
      Thanks, ${p.firstName}!
    </h2>
    <p style="margin:0 0 30px;color:#475569;font-size:16px;line-height:1.65;
              max-width:440px;margin-left:auto;margin-right:auto">
      We've received your
      <strong style="color:#0f172a">${p.inquiryLabel}</strong> inquiry
      and will be in touch within
      <strong style="color:#0891b2">2–3 business days</strong>.
    </p>

    <!-- Steps -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="text-align:left;border-radius:12px;overflow:hidden;
             border:1px solid #e2e8f0;margin-bottom:30px">
      <tr>
        <td style="background:#f8fafc;padding:10px 20px;border-bottom:1px solid #e2e8f0">
          <span style="font-size:11px;font-weight:800;color:#06b6d4;
                       text-transform:uppercase;letter-spacing:.1em">What Happens Next</span>
        </td>
      </tr>
      ${[
        ['1', 'Our team reviews your inquiry and your specific needs'],
        ['2', 'A specialist contacts you within 2–3 business days'],
        ['3', 'We discuss your goals and map out the best path forward'],
      ].map(([n, t]) => `
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid #f1f5f9">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:32px;height:32px;min-width:32px;
                       background:linear-gradient(135deg,#059669,#06b6d4);
                       border-radius:50%;text-align:center;vertical-align:middle;
                       color:#fff;font-size:14px;font-weight:900">${n}</td>
            <td style="padding-left:14px;font-size:15px;color:#334155;line-height:1.5">${t}</td>
          </tr></table>
        </td>
      </tr>`).join('')}
    </table>

    <p style="margin:0 0 6px;font-size:13px;color:#94a3b8">
      Have an urgent question?
    </p>
    <a href="mailto:${SUPPORT}"
       style="color:#0891b2;font-weight:700;font-size:15px;text-decoration:none">
      ${SUPPORT}
    </a>

  </td></tr>`

  return emailWrap(`We received your inquiry, ${p.firstName}!`, body)
}

// ── ICS calendar helper ────────────────────────────────────────────────────
function buildICS(name: string, email: string, date: string, time: string, label: string): Buffer {
  const convertTo24 = (t: string) => {
    const [tm, mod] = t.split(' '); let [h, m] = tm.split(':')
    if (h === '12') h = '00'
    if (mod === 'PM') h = String(parseInt(h) + 12)
    return `${h.padStart(2,'0')}:${m||'00'}:00`
  }
  const ts    = new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z'
  const start = new Date(date + 'T' + convertTo24(time))
  const end   = new Date(start.getTime() + 30 * 60000)
  const fmt   = (d: Date) => d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z'
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

    // Accept firstName+lastName (new modal) OR legacy single name field
    const name = (body.name?.trim()) ||
      [firstName, lastName].filter(Boolean).map((s: string) => s.trim()).join(' ')

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const inquiryLabel = INQUIRY_LABELS[inquiryType] || inquiryType || 'General Inquiry'

    // Convert base64 attachments from modal → Resend buffer format
    const fileAttachments = Array.isArray(attachments)
      ? attachments.map((a: { filename: string; content: string }) => ({
          filename: a.filename,
          content:  Buffer.from(a.content, 'base64'),
        }))
      : []

    const fileNames = fileAttachments.map((a: { filename: string }) => a.filename)

    // Optional calendar ICS
    const icsBuffer = (preferredDate && preferredTime)
      ? buildICS(name, email, preferredDate, preferredTime, inquiryLabel)
      : null

    console.log(`=== Contact: ${name} <${email}> — ${inquiryLabel} ===`)

    if (process.env.RESEND_API_KEY) {
      // 1. Team notification
      await resend.emails.send({
        from:    FROM,
        to:      TO_TEAM,
        subject: `New ${inquiryLabel} – ${name}`,
        html:    teamEmailHtml({
          name, email,
          phone:        phone   || '',
          company:      company || '',
          inquiryLabel,
          message:      message || '',
          fileNames,
        }),
        replyTo: email,
        // Only user-uploaded files + optional ICS — NO logo attachment
        attachments: [
          ...fileAttachments,
          ...(icsBuffer ? [{ filename: 'meeting.ics', content: icsBuffer }] : []),
        ],
      } as any)
      console.log('✅ Team email sent')

      // 2. Customer confirmation
      await resend.emails.send({
        from:    FROM,
        to:      email,
        subject: `We received your inquiry – Precise GovCon`,
        html:    customerEmailHtml({
          firstName: firstName || name.split(' ')[0],
          email,
          inquiryLabel,
        }),
        replyTo: TO_TEAM,
        // Only optional ICS — NO logo attachment
        attachments: [
          ...(icsBuffer ? [{ filename: 'consultation.ics', content: icsBuffer }] : []),
        ],
      } as any)
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
    const email   = session?.user?.email?.toLowerCase().trim()
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.users.findUnique({
      where:  { email },
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
    const email   = session?.user?.email?.toLowerCase().trim()
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const updateData: any = {}
    if (body.phone         !== undefined) updateData.phone         = clamp(body.phone, 40)        || null
    if (body.company       !== undefined) updateData.company       = clamp(body.company)           || null
    if (body.title         !== undefined) updateData.title         = clamp(body.title)             || null
    if (body.address_line1 !== undefined) updateData.address_line1 = clamp(body.address_line1,160) || null
    if (body.address_line2 !== undefined) updateData.address_line2 = clamp(body.address_line2,160) || null
    if (body.city          !== undefined) updateData.city          = clamp(body.city, 80)         || null
    if (body.state         !== undefined) updateData.state         = clamp(body.state, 40)        || null
    if (body.zip           !== undefined) updateData.postal_code   = clamp(body.zip, 20)          || null
    if (body.country       !== undefined) updateData.country       = clamp(body.country, 60)      || null

    const existing = await prisma.users.findUnique({ where: { email }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const updated = await prisma.users.update({
      where:  { email },
      data:   updateData,
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