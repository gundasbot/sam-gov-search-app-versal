// app/api/cron/trial-email-sequence/route.ts
// Sends Day 5, Day 7, and Day 8 emails during the trial lifecycle
// Runs frequently to catch users at the right time

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { sendMidTrialEmail } from "@/lib/email/sequence/day-5-midtrial";
import { sendFinalChanceEmail } from "@/lib/email/sequence/day-7-final";
import { sendWinbackEmail } from "@/lib/email/sequence/day-8-winback";

export const runtime = "nodejs";

const sql = neon(process.env.DATABASE_URL!);

interface TrialUser {
  id: string;
  email: string;
  first_name: string;
  trial_started_at: string;
  trial_expires_at: string;
}

export async function GET() {
  try {
    // Verify cron secret
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }

    const startTime = Date.now();
    let sent = { day5: 0, day7: 0, day8: 0 };

    // ========== DAY 5: Mid-trial engagement email ==========
    // Sent exactly 5 days after trial_started_at
    const day5Users = await sql`
      SELECT u.id, u.email, COALESCE(u.first_name, 'there') AS first_name,
             u.trial_started_at, u.trial_expires_at
      FROM users u
      WHERE u.trial_active = true
        AND u.trial_started_at IS NOT NULL
        AND u.trial_expires_at IS NOT NULL
        AND u.trial_expires_at > NOW()
        -- Day 5 = 5 days after trial_started_at
        AND DATE(u.trial_started_at) + INTERVAL '5 days' = CURRENT_DATE
        AND NOT EXISTS (
          SELECT 1 FROM email_events e
          WHERE e.user_id = u.id AND e.event_type = 'trial_day5_midtrial'
        )
    ` as TrialUser[];

    for (const user of day5Users) {
      try {
        await sendMidTrialEmail(user.email, user.first_name);

        // Track this email in email_events
        await sql`
          INSERT INTO email_events (user_id, event_type)
          VALUES (${user.id}, 'trial_day5_midtrial')
          ON CONFLICT (user_id, event_type) DO NOTHING
        `;

        sent.day5++;
        console.log(`✉️ Day 5 email sent to ${user.email}`);
      } catch (emailError: any) {
        console.error(`Failed to send Day 5 email to ${user.email}:`, emailError);
        // Don't fail the whole cron, continue to next user
      }
    }

    // ========== DAY 7: Final chance email with 50% discount ==========
    // Sent exactly 7 days after trial_started_at (the day before or of expiry)
    const day7Users = await sql`
      SELECT u.id, u.email, COALESCE(u.first_name, 'there') AS first_name,
             u.trial_started_at, u.trial_expires_at
      FROM users u
      WHERE u.trial_active = true
        AND u.trial_started_at IS NOT NULL
        AND u.trial_expires_at IS NOT NULL
        AND u.trial_expires_at > NOW()
        -- Day 7 = 7 days after trial_started_at
        AND DATE(u.trial_started_at) + INTERVAL '7 days' = CURRENT_DATE
        AND NOT EXISTS (
          SELECT 1 FROM email_events e
          WHERE e.user_id = u.id AND e.event_type = 'trial_day7_final'
        )
    ` as TrialUser[];

    for (const user of day7Users) {
      try {
        await sendFinalChanceEmail(user.email, user.first_name);

        // Track this email
        await sql`
          INSERT INTO email_events (user_id, event_type)
          VALUES (${user.id}, 'trial_day7_final')
          ON CONFLICT (user_id, event_type) DO NOTHING
        `;

        sent.day7++;
        console.log(`✉️ Day 7 email sent to ${user.email}`);
      } catch (emailError: any) {
        console.error(`Failed to send Day 7 email to ${user.email}:`, emailError);
      }
    }

    // ========== DAY 8: Win-back email (post-trial) ==========
    // Sent 1 day after trial_expires_at
    const day8Users = await sql`
      SELECT u.id, u.email, COALESCE(u.first_name, 'there') AS first_name,
             u.trial_started_at, u.trial_expires_at
      FROM users u
      WHERE u.trial_active = true
        AND u.trial_started_at IS NOT NULL
        AND u.trial_expires_at IS NOT NULL
        -- Just expired (1 day after trial end)
        AND DATE(u.trial_expires_at) = CURRENT_DATE - INTERVAL '1 day'
        AND NOT EXISTS (
          SELECT 1 FROM email_events e
          WHERE e.user_id = u.id AND e.event_type = 'trial_day8_winback'
        )
    ` as TrialUser[];

    for (const user of day8Users) {
      try {
        await sendWinbackEmail(user.email, user.first_name);

        // Track this email
        await sql`
          INSERT INTO email_events (user_id, event_type)
          VALUES (${user.id}, 'trial_day8_winback')
          ON CONFLICT (user_id, event_type) DO NOTHING
        `;

        sent.day8++;
        console.log(`✉️ Day 8 win-back email sent to ${user.email}`);
      } catch (emailError: any) {
        console.error(`Failed to send Day 8 email to ${user.email}:`, emailError);
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      ok: true,
      sent,
      total: sent.day5 + sent.day7 + sent.day8,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Trial email sequence cron error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
