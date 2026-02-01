// app/api/saved-searches-v2/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/saved-searches-v2 - List user's saved searches
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searches = await prisma.savedSearchV2.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        alertSubscriptions: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            frequency: true,
          }
        },
        _count: {
          select: {
            alertSubscriptions: true,
          }
        }
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ searches });
  } catch (error) {
    console.error('Error fetching saved searches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved searches' },
      { status: 500 }
    );
  }
}

// POST /api/saved-searches-v2 - Create new saved search
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      keywords,
      naics,
      agency,
      setAside,
      stateOfPerformance,
      postedAfter,
      postedBefore,
      procurementType,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const search = await prisma.savedSearchV2.create({
      data: {
        userId: session.user.id,
        name,
        description,
        keywords,
        naics,
        agency,
        setAside,
        stateOfPerformance,
        postedAfter,
        postedBefore,
        procurementType: procurementType || 'o',
      },
    });

    return NextResponse.json({ search }, { status: 201 });
  } catch (error) {
    console.error('Error creating saved search:', error);
    return NextResponse.json(
      { error: 'Failed to create saved search' },
      { status: 500 }
    );
  }
}