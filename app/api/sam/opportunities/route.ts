// app/api/sam/opportunities/route.ts - FINAL CORRECTED with Date Formatting
import { NextResponse } from 'next/server';

const SAM_API_KEY = process.env.SAMGOVAPIKEY || process.env.SAM_API_KEY || '';
const SAM_BASE_URL = 'https://api.sam.gov/opportunities/v2/search';

// SAM.gov requires MM/dd/yyyy format
function toSamGovDate(dateString: string): string {
  const s = String(dateString || '').trim();
  if (!s) return s;

  // Already in MM/dd/yyyy format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;

  // Convert from YYYY-MM-DD to MM/dd/yyyy
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, yyyy, mm, dd] = match;
    return `${mm}/${dd}/${yyyy}`;
  }

  return s;
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${yyyy}`; // Return in MM/dd/yyyy format
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export async function GET(request: Request) {
  if (!SAM_API_KEY) {
    console.error('❌ No SAM API key found. Check .env.local');
    return NextResponse.json({
      totalRecords: 0,
      opportunities: [],
      lastUpdated: new Date().toISOString(),
      error: 'SAM API key not configured'
    }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const keyword = searchParams.get('keyword') || '';
    
    const today = new Date();
    const todayFormatted = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
    
    // Build SAM.gov API request with CORRECT date format
    const params = new URLSearchParams({
      api_key: SAM_API_KEY,
      limit: limit.toString(),
      offset: offset.toString(),
      ptype: 'o',
      postedFrom: getDateDaysAgo(30), // Already in MM/dd/yyyy
      postedTo: todayFormatted, // MM/dd/yyyy format
    });

    if (keyword) {
      params.append('q', keyword);
    }

    const apiUrl = `${SAM_BASE_URL}?${params.toString()}`;
    console.log('🔍 Fetching from SAM.gov...');
    console.log('Date range:', getDateDaysAgo(30), 'to', todayFormatted);

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ SAM API Error:', response.status, errorText);
      throw new Error(`SAM API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log('✅ SAM.gov responded with', data.totalRecords || 0, 'total records');

    const opportunities = (data.opportunitiesData || []).map((opp: any) => ({
      noticeId: opp.noticeId || '',
      title: opp.title || 'Untitled Opportunity',
      solicitationNumber: opp.solicitationNumber || opp.noticeId || 'N/A',
      department: opp.departmentName || opp.department || opp.fullParentPathName?.split('.')[0] || 'Unknown',
      subTier: opp.subTier || opp.subtierName || '',
      office: opp.office || opp.officeAddress?.city || '',
      postedDate: opp.postedDate || opp.publishDate || new Date().toISOString(),
      type: opp.type || opp.noticeType || 'Solicitation',
      baseType: opp.baseType || '',
      archiveType: opp.archiveType || '',
      archiveDate: opp.archiveDate || '',
      typeOfSetAsideDescription: opp.typeOfSetAsideDescription || '',
      typeOfSetAside: opp.typeOfSetAside || '',
      responseDeadLine: opp.responseDeadLine || opp.responseDate || addDays(new Date(), 30).toISOString(),
      naicsCode: opp.naicsCode || (Array.isArray(opp.naics) ? opp.naics[0] : '') || '',
      classificationCode: opp.classificationCode || '',
      active: opp.active || 'Yes',
      award: opp.award || null,
      pointOfContact: opp.pointOfContact || [],
      description: opp.description || opp.synopsis || '',
      organizationType: opp.organizationType || '',
      officeAddress: {
        zipcode: opp.officeAddress?.zipcode || '',
        city: opp.officeAddress?.city || '',
        countryCode: opp.officeAddress?.countryCode || 'USA',
        state: opp.officeAddress?.state || '',
      },
      placeOfPerformance: {
        city: {
          code: opp.placeOfPerformance?.city?.code || '',
          name: opp.placeOfPerformance?.city?.name || '',
        },
        state: {
          code: opp.placeOfPerformance?.state?.code || '',
          name: opp.placeOfPerformance?.state?.name || '',
        },
        country: {
          code: opp.placeOfPerformance?.country?.code || 'USA',
          name: opp.placeOfPerformance?.country?.name || 'United States',
        },
      },
      additionalInfoLink: opp.additionalInfoLink || '',
      uiLink: opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`,
    }));

    console.log('✅ Transformed', opportunities.length, 'opportunities');

    return NextResponse.json({
      totalRecords: data.totalRecords || opportunities.length,
      opportunities,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error fetching SAM opportunities:', error);
    
    return NextResponse.json({
      totalRecords: 0,
      opportunities: [],
      lastUpdated: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Failed to fetch opportunities'
    }, { status: 500 });
  }
}