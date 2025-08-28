const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ewrxanqszaoqtgjhreje.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cnhhbnFzemFvcXRnamhyZWplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMjQxNzEsImV4cCI6MjA3MTcwMDE3MX0.ERlgkwmyj6sBtpxOl4rm3vLhxbjt6jCYHqG6T5ADmAk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Error getting session:', error)
      return
    }
    
    console.log('Session check successful:', !!data.session)
    
    // Test a simple database query
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (profileError) {
      console.error('Error querying profiles:', profileError)
      return
    }
    
    console.log('Database connection successful')
    
    // Test sign in with a test account (this will fail but should show the error)
    console.log('Testing sign in with invalid credentials...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'wrongpassword'
    })
    
    if (signInError) {
      console.log('Expected sign in error:', signInError.message)
    } else {
      console.log('Unexpected: Sign in succeeded with wrong credentials')
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testAuth()
