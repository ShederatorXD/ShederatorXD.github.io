export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

export async function GET() {
  const envVars = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKeyPreview: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
      `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'missing',
    allSupabaseKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
  }
  
  return NextResponse.json(envVars)
}
