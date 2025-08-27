export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    console.log('Delete account request received')
    
    const body = await req.json().catch(() => ({})) as { userId?: string; accessToken?: string; avatarPath?: string | null }
    const userId = body?.userId || ''
    const accessToken = body?.accessToken || ''
    const avatarPath = body?.avatarPath || null

    console.log('Request data:', { userId: userId ? 'present' : 'missing', accessToken: accessToken ? 'present' : 'missing', avatarPath })

    if (!userId || !accessToken) {
      console.log('Missing required fields')
      return new Response(JSON.stringify({ error: 'Missing userId or accessToken' }), { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    
    if (!url || !anonKey || !serviceRoleKey) {
      console.log('Missing environment variables:', { 
        hasUrl: !!url, 
        hasAnonKey: !!anonKey, 
        hasServiceRoleKey: !!serviceRoleKey 
      })
      return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), { status: 500 })
    }

    // Create two clients: one with user session, one with admin privileges
    const userSupabase = createClient(url, anonKey)
    const adminSupabase = createClient(url, serviceRoleKey)

    // Verify the access token belongs to the same user
    console.log('Verifying user access token...')
    const { data: userData, error: userErr } = await userSupabase.auth.getUser(accessToken)
    
    if (userErr) {
      console.error('Error verifying access token:', userErr)
      return new Response(JSON.stringify({ error: 'Invalid access token' }), { status: 401 })
    }
    
    if (!userData?.user) {
      console.log('No user data found in token')
      return new Response(JSON.stringify({ error: 'No user found in token' }), { status: 401 })
    }
    
    if (userData.user.id !== userId) {
      console.log('Token user ID mismatch:', { tokenUserId: userData.user.id, requestUserId: userId })
      return new Response(JSON.stringify({ error: 'Token user ID mismatch' }), { status: 401 })
    }
    
    console.log('User verification successful:', { userId: userData.user.id })

    // First, let's see what data exists for this user
    console.log('Checking what data exists for user...')
    const tablesToCheck = ['community_posts', 'rides', 'impact_logs', 'reward_redemptions', 'profiles']
    for (const table of tablesToCheck) {
      try {
        let query
        if (table === 'profiles') {
          query = adminSupabase.from(table).select('id').eq('id', userId).limit(1)
        } else {
          query = adminSupabase.from(table).select('id').eq('user_id', userId).limit(1)
        }
        const { data, error } = await query
        if (error) {
          console.log(`Table ${table} not accessible or doesn't exist:`, error.message)
        } else {
          console.log(`Table ${table}: ${data?.length || 0} records found`)
        }
      } catch (e: any) {
        console.log(`Exception checking table ${table}:`, e?.message || 'unknown')
      }
    }

    console.log('Starting data deletion with admin privileges...')

    // Delete related data using admin privileges
    const tryDelete = async (table: string, column: string, value: string) => {
      try {
        console.log(`Deleting from ${table}...`)
        const { error } = await adminSupabase.from(table).delete().eq(column, value)
        if (error) {
          console.error(`Error deleting from ${table}:`, error)
          return { table, error: error.message }
        }
        console.log(`Successfully deleted from ${table}`)
      } catch (e: any) {
        console.error(`Exception deleting from ${table}:`, e)
        return { table, error: e?.message || 'unknown' }
      }
      return null
    }

    const errors: any[] = []

    // Delete from all tables using admin privileges
    console.log('Deleting community posts...')
    const e1 = await tryDelete('community_posts', 'user_id', userId); if (e1) errors.push(e1)
    
    console.log('Deleting rides...')
    const e2 = await tryDelete('rides', 'user_id', userId); if (e2) errors.push(e2)
    
    console.log('Deleting impact logs...')
    const e3 = await tryDelete('impact_logs', 'user_id', userId); if (e3) errors.push(e3)
    
    console.log('Deleting reward redemptions...')
    const e4 = await tryDelete('reward_redemptions', 'user_id', userId); if (e4) errors.push(e4)
    
    // Delete profile
    console.log('Deleting profile...')
    const e5 = await tryDelete('profiles', 'id', userId); if (e5) errors.push(e5)

    // Delete avatar from storage
    if (avatarPath) {
      console.log('Deleting avatar from storage:', avatarPath)
      try {
        const { error } = await adminSupabase.storage.from('avatars').remove([avatarPath])
        if (error) {
          console.error('Error deleting avatar:', error)
          errors.push({ storage: 'avatars', error: error.message })
        } else {
          console.log('Avatar deleted successfully')
        }
      } catch (e: any) {
        console.error('Exception deleting avatar:', e)
        errors.push({ storage: 'avatars', error: e?.message || 'unknown' })
      }
    } else {
      console.log('No avatar path provided, attempting to find and delete avatar...')
      // Try to find and delete avatar by user ID pattern
      try {
        const { data: files, error: listError } = await adminSupabase.storage.from('avatars').list('', {
          search: userId
        })
        if (!listError && files && files.length > 0) {
          console.log(`Found ${files.length} avatar files for user`)
          const fileNames = files.map(f => f.name)
          const { error: removeError } = await adminSupabase.storage.from('avatars').remove(fileNames)
          if (removeError) {
            console.error('Error removing avatar files:', removeError)
            errors.push({ storage: 'avatars', error: removeError.message })
          } else {
            console.log('Avatar files removed successfully')
          }
        } else {
          console.log('No avatar files found for user')
        }
      } catch (e: any) {
        console.error('Exception finding avatar files:', e)
      }
    }

    // CRITICAL: Delete the user from Supabase Auth using admin privileges
    console.log('Deleting user from Supabase Auth...')
    try {
      const { error: deleteUserError } = await adminSupabase.auth.admin.deleteUser(userId)
      if (deleteUserError) {
        console.error('Error deleting user from Auth:', deleteUserError)
        errors.push({ auth: 'user', error: deleteUserError.message })
      } else {
        console.log('User successfully deleted from Supabase Auth')
      }
    } catch (e: any) {
      console.error('Exception deleting user from Auth:', e)
      errors.push({ auth: 'user', error: e?.message || 'unknown' })
    }

    // Check if we have any critical errors
    const hasCriticalErrors = errors.some(e => e.profile || e.auth)
    if (hasCriticalErrors) {
      console.error('Critical errors during account deletion:', errors)
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Failed to delete account data completely',
        details: errors 
      }), { status: 500, headers: { 'content-type': 'application/json' } })
    }

    console.log('Account data deletion completed successfully with warnings:', errors)
    
    return new Response(JSON.stringify({ ok: true, errors }), { status: 200, headers: { 'content-type': 'application/json' } })
  } catch (e: any) {
    console.error('Unhandled error during account deletion:', e)
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500 })
  }
}
