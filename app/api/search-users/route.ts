import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { neon } from '@neondatabase/serverless'
import { isEmailAdmin } from '@/lib/admin'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'

const sql = neon(process.env.DATABASE_URL!)

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.toLowerCase().trim()
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = await isEmailAdmin(email)
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return null
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

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
    
  } catch (err) {
    console.error('Search users failed')
    return NextResponse.json({ 
      error: 'Search failed'
    }, { status: 500 })
  }
}

// Also add GET to list recent users
export async function GET() {
  const authError = await requireAdmin()
  if (authError) return authError

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
    
  } catch (err) {
    console.error('Get users failed')
    return NextResponse.json({ 
      error: 'Failed to get users'
    }, { status: 500 })
  }
}
