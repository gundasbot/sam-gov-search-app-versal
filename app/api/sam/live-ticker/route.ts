// app/api/sam/live-ticker/route.ts - FINAL CORRECTED with Date Formatting
import { NextResponse } from 'next/server';

const SAM_API_KEY = process.env.SAMGOVAPIKEY || process.env.SAM_API_KEY || '';
const SAM_BASE_URL = 'https://api.sam.gov/opportunities/v2/search';

// SAM.gov requires MM/dd/yyyy format
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${yyyy}`; // Return in MM/dd/yyyy format
}

function truncate(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str || '';
  return str.substring(0, maxLength - 3) + '...';
}

export async function GET() {
  if (!SAM_API_KEY) {
    console.error('❌ No SAM API key found. Check .env.local');
    return NextResponse.json({
      count: 0,
      opportunities: [],
      error: 'SAM API key not configured'
    }, { status: 500 });
  }

  try {
    const today = new Date();
    const todayFormatted = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
    
    // Fetch latest 20 opportunities with CORRECT date format
    const params = new URLSearchParams({
      api_key: SAM_API_KEY,
      limit: '20',
      ptype: 'o',
      postedFrom: getDateDaysAgo(7), // MM/dd/yyyy format
      postedTo: todayFormatted, // MM/dd/yyyy format
    });

    const apiUrl = `${SAM_BASE_URL}?${params.toString()}`;
    console.log('🎫 Fetching ticker from SAM.gov...');
    console.log('Date range:', getDateDaysAgo(7), 'to', todayFormatted);

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 120 }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ SAM API Error (Ticker):', response.status, errorText);
      throw new Error(`SAM API error: ${response.status} - ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();
    console.log('✅ Ticker received:', data.totalRecords || 0, 'total records');

    const opportunities = (data.opportunitiesData || []).map((opp: any) => ({
      id: opp.noticeId || '',
      title: truncate(opp.title || 'Untitled Opportunity', 60),
      solicitationNumber: opp.solicitationNumber || opp.noticeId || 'N/A',
      agency: truncate(opp.departmentName || opp.department || opp.fullParentPathName?.split('.')[0] || 'Unknown', 40),
      postedDate: opp.postedDate || opp.publishDate || new Date().toISOString(),
      type: opp.type || opp.noticeType || 'Solicitation',
      samUrl: opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`,
      naics: opp.naicsCode || (Array.isArray(opp.naics) ? opp.naics[0] : '') || '',
      setAside: opp.typeOfSetAsideDescription || opp.typeOfSetAside || '',
      responseDeadLine: opp.responseDeadLine || opp.responseDate || '',
      state: opp.placeOfPerformance?.state?.code || opp.officeAddress?.state || '',
    }));

    console.log('✅ Transformed', opportunities.length, 'ticker items');

    return NextResponse.json({
      count: data.totalRecords || opportunities.length,
      opportunities,
    });

  } catch (error) {
    console.error('❌ Error fetching ticker data:', error);
    
    return NextResponse.json({
      count: 0,
      opportunities: [],
      error: error instanceof Error ? error.message : 'Failed to fetch ticker data'
    }, { status: 500 });
  }
}