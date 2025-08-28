import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { message, senderId, senderType = 'admin' } = await request.json();
    const ticketId = params.id;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS policies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Add the message to the ticket
    const { data, error } = await supabaseAdmin.rpc('add_ticket_message', {
      ticket_id: parseInt(ticketId),
      sender_type: senderType, // 'admin' or 'user'
      message_text: message,
      sender_id: senderId || null
    });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to add message' },
        { status: 500 }
      );
    }

    // Get the updated ticket with messages
    const { data: ticket, error: fetchError } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch updated ticket' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      ticket 
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
