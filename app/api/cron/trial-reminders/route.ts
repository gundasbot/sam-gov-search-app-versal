import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { sendTrialReminder3Days } from "@/lib/email";

export const runtime = "nodejs";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    // users whose trial ends within next 3 days (but not already ended)
    const users = await sql`
      SELECT u.id, u.email, COALESCE(u.first_name, 'there') AS first_name, u.trial_expires_at
      FROM users u
      WHERE u.trial_active = true
        AND u.trial_expires_at IS NOT NULL
        AND u.trial_expires_at > NOW()
        AND u.trial_expires_at <= NOW() + INTERVAL '3 days'
        AND NOT EXISTS (
          SELECT 1 FROM email_events e
          WHERE e.user_id = u.id AND e.event_type = 'trial_reminder_3d'
        )
    `;

    let sent = 0;

    for (const u of users) {
      await sendTrialReminder3Days({
        email: u.email,
        firstName: u.first_name,
        trialEndsAt: new Date(u.trial_expires_at),
      });

      await sql`
        INSERT INTO email_events (user_id, event_type)
        VALUES (${u.id}, 'trial_reminder_3d')
        ON CONFLICT (user_id, event_type) DO NOTHING
      `;

      sent++;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (e: any) {
    console.error("trial-reminders cron error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  }
}
