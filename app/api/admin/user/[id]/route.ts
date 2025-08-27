import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRole) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }

    const admin = createClient(url, serviceRole)
    const { data, error } = await admin.auth.admin.getUserById(userId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ id: data.user.id, email: data.user.email })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


