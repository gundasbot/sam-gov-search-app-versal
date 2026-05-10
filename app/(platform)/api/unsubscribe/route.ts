// app/api/unsubscribe/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalised = email.trim().toLowerCase();
    if (!normalised.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    await (prisma as any).email_suppressions.upsert({
      where: { email: normalised },
      create: {
        id: crypto.randomUUID(),
        email: normalised,
        reason: 'unsubscribed',
        source: 'link_click',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        reason: 'unsubscribed',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[unsubscribe] POST error:', err);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
