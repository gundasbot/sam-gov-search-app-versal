import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const runtime = 'nodejs'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const searchTerm = String(body.search ?? '').trim()
    
    if (!searchTerm) {
      return NextResponse.json({ error: 'Search term is required' }, { status: 400 })
    }
    
    // Search for users by email or name
    const users = await sql`
      SELECT 
        id, email, first_name, last_name, 
        email_verified, created_at, plan_tier
      FROM users 
      WHERE 
        email ILIKE ${'%' + searchTerm + '%'} OR
        first_name ILIKE ${'%' + searchTerm + '%'} OR
        last_name ILIKE ${'%' + searchTerm + '%'}
      ORDER BY created_at DESC
      LIMIT 20
    `
    
    return NextResponse.json({ 
      count: users.length,
      users: users,
      searchTerm: searchTerm
    })
    
  } catch (err: any) {
    console.error('Search users error:', err)
    return NextResponse.json({ 
      error: 'Search failed', 
      details: err.message 
    }, { status: 500 })
  }
}

// Also add GET to list recent users
export async function GET() {
  try {
    const users = await sql`
      SELECT 
        id, email, first_name, last_name, 
        email_verified, created_at, plan_tier
      FROM users 
      ORDER BY created_at DESC
      LIMIT 10
    `
    
    return NextResponse.json({ 
      count: users.length,
      users: users,
      timestamp: new Date().toISOString()
    })
    
  } catch (err: any) {
    console.error('Get users error:', err)
    return NextResponse.json({ 
      error: 'Failed to get users', 
      details: err.message 
    }, { status: 500 })
  }
}