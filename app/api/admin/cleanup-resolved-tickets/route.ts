import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Delete resolved tickets older than 4 hours
    const { data: deletedTickets, error } = await supabase
      .from('support_tickets')
      .delete()
      .eq('status', 'resolved')
      .lt('updated_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
      .select('id')

    if (error) {
      console.error('Error cleaning up resolved tickets:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to cleanup tickets' 
      }, { status: 500 })
    }

    const deletedCount = deletedTickets?.length || 0
    console.log(`Cleaned up ${deletedCount} resolved tickets older than 4 hours`)

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${deletedCount} resolved tickets`,
      deletedCount,
      cleanedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in cleanup resolved tickets API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Also allow GET for manual testing
export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Count resolved tickets older than 4 hours (without deleting)
    const { data: oldResolvedTickets, error } = await supabase
      .from('support_tickets')
      .select('id, subject, updated_at')
      .eq('status', 'resolved')
      .lt('updated_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())

    if (error) {
      console.error('Error checking resolved tickets:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check tickets' 
      }, { status: 500 })
    }

    const count = oldResolvedTickets?.length || 0

    return NextResponse.json({ 
      success: true, 
      message: `Found ${count} resolved tickets older than 4 hours`,
      count,
      tickets: oldResolvedTickets || [],
      checkedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in check resolved tickets API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
