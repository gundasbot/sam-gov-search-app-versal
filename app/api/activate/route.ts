// app/api/auth/activate/route.ts  (MAIN APP)
//
// Called by /activate page after user sets their password.
// Verifies the email_verification_token, hashes & saves the password,
// marks email_verified, and activates the account (plan_status = trialing).

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  token:          z.string().min(10),
  email:          z.string().email(),
  password:       z.string().min(8),
  activationCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { token, email, password, activationCode } = parsed.data;

    // ── 1. Hash the raw token and look it up ─────────────────────────────────
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now       = new Date();

    const tokenRow = await prisma.email_verification_tokens.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!tokenRow) {
      return NextResponse.json(
        { error: 'Invalid activation link. Please request a new one.' },
        { status: 400 }
      );
    }

    if (tokenRow.expires_at < now) {
      // Clean up expired token
      await prisma.email_verification_tokens.delete({ where: { token_hash: tokenHash } }).catch(() => {});
      return NextResponse.json(
        { error: 'This activation link has expired.' },
        { status: 410 } // 410 Gone — activate page checks for this to show "Expired" state
      );
    }

    // ── 2. Verify the token belongs to the right user ─────────────────────────
    const user = await prisma.users.findUnique({
      where: { id: tokenRow.user_id },
      select: {
        id:            true,
        email:         true,
        email_verified: true,
        password_hash: true,
        plan_status:   true,
        plan_tier:     true,
      },
    });

    if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid activation link.' }, { status: 400 });
    }

    // ── 3. Already activated? Just let them log in ────────────────────────────
    if (user.email_verified && user.password_hash) {
      return NextResponse.json({ success: true, alreadyActivated: true });
    }

    // ── 4. Hash the new password ──────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12);

    // ── 5. Calculate trial dates (7 days from activation) ─────────────────────
    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);
    trialEndsAt.setHours(23, 59, 59, 999); // end of that day

    // ── 6. Activate the user ─────────────────────────────────────────────────
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash:    passwordHash,
        email_verified:   now,
        is_active:        true,
        plan_status:      'trialing',
        trial_active:     true,
        trial_started_at: now,
        trial_expires_at: trialEndsAt,
        trial_ends_at:    trialEndsAt,
        updated_at:       now,
      },
    });

    // ── 7. Delete the used token ──────────────────────────────────────────────
    await prisma.email_verification_tokens
      .delete({ where: { token_hash: tokenHash } })
      .catch(() => {}); // non-critical

    // ── 8. Log the activation code if one was provided ────────────────────────
    if (activationCode) {
      // Optional: store in an audit log or dedicated field
      // For now we just log it server-side
      console.log(`User ${user.id} activated with code: ${activationCode}`);
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Activation error:', err);
    return NextResponse.json({ error: 'Activation failed. Please try again.' }, { status: 500 });
  }
}
