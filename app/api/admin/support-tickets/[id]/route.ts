import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '../../../../../lib/database.types';

// GET /api/admin/support-tickets/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;

    // Use service role client to bypass RLS policies - no authentication required
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Get the ticket with its messages
    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) {
      console.error('Error fetching ticket:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ticket' },
        { status: 500 }
      );
    }

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Ensure messages is an array
    if (!ticket.messages) {
      ticket.messages = [];
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Error in get ticket API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/support-tickets/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const ticketId = params.id;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS policies - no authentication required
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Update the ticket status
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .update({ 
        status,
        updated_at: new Date().toISOString() 
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      console.error('Error updating ticket status:', error);
      return NextResponse.json(
        { error: 'Failed to update ticket status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ticket: data });
  } catch (error) {
    console.error('Error in update ticket API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
