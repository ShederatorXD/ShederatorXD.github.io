import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: 'Service role key not configured' 
      }, { status: 500 })
    }
    
    // Create client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    console.log('=== STORAGE DEBUG START ===')
    
    const results: any = {
      serviceRoleConfigured: true,
      avatars: {},
      communityImages: {},
      errors: []
    }
    
    // Test 1: Check if we can list avatars bucket
    console.log('Test 1: Testing avatars bucket access...')
    try {
      const { data: avatarFiles, error: avatarError } = await supabase.storage
        .from('avatars')
        .list('', { limit: 1000 })
      
      if (avatarError) {
        console.error('Avatar listing error:', avatarError)
        results.avatars.error = avatarError.message
        results.errors.push(`Avatar listing: ${avatarError.message}`)
      } else {
        console.log(`Avatar files found: ${avatarFiles?.length || 0}`)
        results.avatars.fileCount = avatarFiles?.length || 0
        results.avatars.files = avatarFiles?.map(f => f.name) || []
      }
    } catch (error) {
      console.error('Avatar listing exception:', error)
      results.avatars.exception = error instanceof Error ? error.message : 'Unknown error'
      results.errors.push(`Avatar listing exception: ${error}`)
    }
    
    // Test 2: Check if we can list community-images bucket
    console.log('Test 2: Testing community-images bucket access...')
    try {
      const { data: communityFiles, error: communityError } = await supabase.storage
        .from('community-images')
        .list('', { limit: 1000 })
      
      if (communityError) {
        console.error('Community listing error:', communityError)
        results.communityImages.error = communityError.message
        results.errors.push(`Community listing: ${communityError.message}`)
      } else {
        console.log(`Community files found: ${communityFiles?.length || 0}`)
        results.communityImages.fileCount = communityFiles?.length || 0
        results.communityImages.files = communityFiles?.map(f => f.name) || []
      }
    } catch (error) {
      console.error('Community listing exception:', error)
      results.communityImages.exception = error instanceof Error ? error.message : 'Unknown error'
      results.errors.push(`Community listing exception: ${error}`)
    }
    
    // Test 3: Try to delete a single file if any exist
    if (results.avatars.files && results.avatars.files.length > 0) {
      console.log('Test 3: Testing file deletion...')
      try {
        const testFile = results.avatars.files[0]
        console.log(`Attempting to delete: ${testFile}`)
        
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([testFile])
        
        if (deleteError) {
          console.error('File deletion error:', deleteError)
          results.avatars.deletionError = deleteError.message
          results.errors.push(`Avatar deletion: ${deleteError.message}`)
        } else {
          console.log('File deletion successful')
          results.avatars.deletionSuccess = true
        }
      } catch (error) {
        console.error('File deletion exception:', error)
        results.avatars.deletionException = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`Avatar deletion exception: ${error}`)
      }
    }
    
    // Test 4: Try wildcard deletion
    console.log('Test 4: Testing wildcard deletion...')
    try {
      const { error: wildcardError } = await supabase.storage
        .from('avatars')
        .remove(['*'])
      
      if (wildcardError) {
        console.error('Wildcard deletion error:', wildcardError)
        results.avatars.wildcardError = wildcardError.message
        results.errors.push(`Avatar wildcard: ${wildcardError.message}`)
      } else {
        console.log('Wildcard deletion successful')
        results.avatars.wildcardSuccess = true
      }
    } catch (error) {
      console.error('Wildcard deletion exception:', error)
      results.avatars.wildcardException = error instanceof Error ? error.message : 'Unknown error'
      results.errors.push(`Avatar wildcard exception: ${error}`)
    }
    
    console.log('=== STORAGE DEBUG END ===')
    
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Storage debug failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
