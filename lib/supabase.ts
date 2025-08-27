import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ewrxanqszaoqtgjhreje.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cnhhbnFzemFvcXRnamhyZWplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMjQxNzEsImV4cCI6MjA3MTcwMDE3MX0.ERlgkwmyj6sBtpxOl4rm3vLhxbjt6jCYHqG6T5ADmAk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)


