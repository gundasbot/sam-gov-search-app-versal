import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeOpportunities } from '@/lib/claude-analytics';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { opportunities, userProfile } = body;

    if (!opportunities || !Array.isArray(opportunities)) {
      return NextResponse.json(
        { error: 'Invalid opportunities data' },
        { status: 400 }
      );
    }

    // Limit to prevent excessive API costs
    if (opportunities.length > 1000) {
      return NextResponse.json(
        { error: 'Too many opportunities (max 1000)' },
        { status: 400 }
      );
    }

    const analysis = await analyzeOpportunities(opportunities, userProfile);

    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
