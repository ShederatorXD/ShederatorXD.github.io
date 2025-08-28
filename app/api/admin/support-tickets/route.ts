import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '../../../../lib/database.types';

export async function GET(request: Request) {
  try {
    console.log('🔍 Admin support tickets API called');
    
    // Use service role client to bypass RLS policies - no authentication required
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Get the search params from the URL
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';

    // Build the query using admin client
    let query = supabaseAdmin
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply search filter if provided
    if (search) {
      query = query.or(
        `subject.ilike.%${search}%,message.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    console.log('📡 Ticket fetch result:', { 
      hasData: !!data, 
      dataLength: data?.length || 0,
      error: error?.message 
    });

    if (error) {
      console.error('❌ Error fetching support tickets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch support tickets' },
        { status: 500 }
      );
    }

    console.log('✅ Successfully fetched tickets, returning response');
    return NextResponse.json({ tickets: data || [] });
  } catch (error) {
    console.error('❌ Error in support tickets API:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
