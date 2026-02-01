// app/saved-searches-v2/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Add this
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const search = await prisma.savedSearchV2.findFirst({
      where: { id, userId: session.user.id }, // Use id, not params.id
      include: { alertSubscriptions: { include: { runs: { orderBy: { createdAt: 'desc' }, take: 5 } } } }
    });
    if (!search) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ search });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Add this
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const existing = await prisma.savedSearchV2.findFirst({ where: { id, userId: session.user.id } }); // Use id
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const body = await req.json();
    const search = await prisma.savedSearchV2.update({ where: { id }, data: body }); // Use id
    return NextResponse.json({ search });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Add this
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const existing = await prisma.savedSearchV2.findFirst({ where: { id, userId: session.user.id } }); // Use id
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.savedSearchV2.delete({ where: { id } }); // Use id
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}