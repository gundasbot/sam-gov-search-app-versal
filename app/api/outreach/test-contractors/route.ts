// app/api/outreach/test-contractors/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, naics_code, state, business_type } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const contractor = await prisma.contractors.create({
      data: {
        id: crypto.randomUUID(),
        name,
        email,
        naics_code: naics_code || null,
        state: state || null,
        business_type: business_type || null,
        score: 0,
        pipeline_stage: 'new',
        contacted: false,
        enrolled: false,
        is_test: true,
      },
    });

    return NextResponse.json({ contractor }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/outreach/test-contractors:', err);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const result = await prisma.contractors.deleteMany({
      where: { is_test: true },
    });
    return NextResponse.json({ deleted: result.count });
  } catch (err: any) {
    console.error('DELETE /api/outreach/test-contractors:', err);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
