import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { sendTrialExpired } from "@/lib/email";

export const runtime = "nodejs";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const users = await sql`
      SELECT u.id, u.email, COALESCE(u.first_name, 'there') AS first_name
      FROM users u
      WHERE u.trial_active = true
        AND u.trial_expires_at IS NOT NULL
        AND u.trial_expires_at <= NOW()
        AND NOT EXISTS (
          SELECT 1 FROM email_events e
          WHERE e.user_id = u.id AND e.event_type = 'trial_expired'
        )
    `;

    let processed = 0;

    for (const u of users) {
      // lock access
      await sql`
        UPDATE users
        SET trial_active = false,
            plan_status = 'locked',
            updated_at = NOW()
        WHERE id = ${u.id}
      `;

      await sendTrialExpired({ to: u.email, name: u.first_name });

      await sql`
        INSERT INTO email_events (user_id, event_type)
        VALUES (${u.id}, 'trial_expired')
        ON CONFLICT (user_id, event_type) DO NOTHING
      `;

      processed++;
    }

    return NextResponse.json({ ok: true, processed });
  } catch (e: any) {
    console.error("trial-expired cron error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  }
}
