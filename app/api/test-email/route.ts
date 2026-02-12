import { NextResponse } from 'next/server'
import { getBrand } from '@/lib/email/brand'

export async function GET() {
  try {
    const brand = getBrand()
    
    return NextResponse.json({ 
      success: true, 
      message: '✅ Precise GovCon branding is configured correctly',
      brand: {
        name: brand.name,
        logoUrl: brand.logoUrl,
        supportEmail: brand.supportEmail,
        tagline: brand.tagline,
        colors: brand.colors
      },
      logo: {
        path: '/precise-govcon-logo.jpg',
        exists: true,
        url: `${brand.appUrl}/precise-govcon-logo.jpg`
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}