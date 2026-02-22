//app/api/outreach/test-contractors/route

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, naics_code, state, business_type } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Use 'Contractor' with capital C - matches your schema model name
    const contractor = await prisma.contractor.create({
      data: {
        name,
        email,
        naics_code: naics_code || null,
        state: state || null,
        business_type: business_type || null,
        score: 0,
        // priority field removed since it's not in the destructured variables
        // and the schema shows it's an optional String? field
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
    // Use 'Contractor' with capital C here too
    const result = await prisma.contractor.deleteMany({
      where: { is_test: true },
    });
    return NextResponse.json({ deleted: result.count });
  } catch (err: any) {
    console.error('DELETE /api/outreach/test-contractors:', err);
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}