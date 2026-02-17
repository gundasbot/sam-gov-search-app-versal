import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface OpportunityAnalysis {
  summary: string;
  trends: {
    category: string;
    insight: string;
    count: number;
  }[];
  recommendations: string[];
  riskFactors: {
    level: 'high' | 'medium' | 'low';
    description: string;
  }[];
}

export async function analyzeOpportunities(
  opportunities: any[],
  userProfile?: {
    naicsCodes?: string[];
    preferredAgencies?: string[];
    pastWins?: string[];
  }
): Promise<OpportunityAnalysis> {
  
  // Prepare data summary for Claude (avoid sending full raw data)
  const dataSummary = {
    totalCount: opportunities.length,
    setAsideBreakdown: getSetAsideBreakdown(opportunities),
    agencyBreakdown: getTopAgencies(opportunities, 10),
    naicsBreakdown: getTopNAICS(opportunities, 10),
    deadlineDistribution: getDeadlineDistribution(opportunities),
    avgContractValue: calculateAvgValue(opportunities),
    urgentOpps: opportunities.filter(o => {
      const days = getDaysUntilDeadline(o.responseDeadLine);
      return days !== null && days <= 7;
    }).length,
  };

  const prompt = `You are a federal contracting expert analyzing SAM.gov opportunities for a business.

**Data Summary:**
- Total Opportunities: ${dataSummary.totalCount}
- Urgent (≤7 days): ${dataSummary.urgentOpps}
- Top Agencies: ${JSON.stringify(dataSummary.agencyBreakdown.slice(0, 5))}
- Top Set-Asides: ${JSON.stringify(dataSummary.setAsideBreakdown.slice(0, 5))}
- Top NAICS: ${JSON.stringify(dataSummary.naicsBreakdown.slice(0, 5))}
- Deadline Distribution: ${JSON.stringify(dataSummary.deadlineDistribution)}

${userProfile ? `**User Profile:**
- NAICS Codes: ${userProfile.naicsCodes?.join(', ')}
- Preferred Agencies: ${userProfile.preferredAgencies?.join(', ')}
- Past Wins: ${userProfile.pastWins?.join(', ')}` : ''}

Provide:
1. A brief executive summary (2-3 sentences)
2. Key trends and insights (3-5 trends with specific numbers)
3. Actionable recommendations (3-5 specific actions)
4. Risk factors to watch (2-3 risks with severity levels)

Format as JSON matching this schema:
{
  "summary": "string",
  "trends": [{"category": "string", "insight": "string", "count": number}],
  "recommendations": ["string"],
  "riskFactors": [{"level": "high|medium|low", "description": "string"}]
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

// Helper functions
function getSetAsideBreakdown(opps: any[]) {
  const breakdown: Record<string, number> = {};
  opps.forEach(o => {
    const setAside = o.typeOfSetAsideDescription || o.typeOfSetAside || 'Not Specified';
    breakdown[setAside] = (breakdown[setAside] || 0) + 1;
  });
  return Object.entries(breakdown)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function getTopAgencies(opps: any[], limit: number) {
  const breakdown: Record<string, number> = {};
  opps.forEach(o => {
    const agency = o.department || o.fullParentPathName || 'Unknown';
    breakdown[agency] = (breakdown[agency] || 0) + 1;
  });
  return Object.entries(breakdown)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getTopNAICS(opps: any[], limit: number) {
  const breakdown: Record<string, number> = {};
  opps.forEach(o => {
    if (o.naicsCode) {
      breakdown[o.naicsCode] = (breakdown[o.naicsCode] || 0) + 1;
    }
  });
  return Object.entries(breakdown)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getDeadlineDistribution(opps: any[]) {
  const distribution = {
    expired: 0,
    urgent: 0, // 1-7 days
    nearTerm: 0, // 8-30 days
    standard: 0, // 31-60 days
    longTerm: 0, // 60+ days
  };

  opps.forEach(o => {
    const days = getDaysUntilDeadline(o.responseDeadLine);
    if (days === null) return;
    
    if (days < 0) distribution.expired++;
    else if (days <= 7) distribution.urgent++;
    else if (days <= 30) distribution.nearTerm++;
    else if (days <= 60) distribution.standard++;
    else distribution.longTerm++;
  });

  return distribution;
}

function calculateAvgValue(opps: any[]): number | null {
  const values = opps
    .filter(o => o.award?.amount)
    .map(o => parseFloat(o.award.amount));
  
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function getDaysUntilDeadline(deadline?: string): number | null {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
