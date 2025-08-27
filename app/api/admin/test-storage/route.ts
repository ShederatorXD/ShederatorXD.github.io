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
    
    console.log('Testing storage access with service role...')
    
    // Test 1: List files in avatars bucket
    console.log('Test 1: Listing avatars bucket...')
    const { data: avatarFiles, error: avatarError } = await supabase.storage
      .from('avatars')
      .list('', { limit: 10 })
    
    if (avatarError) {
      console.error('Avatar listing failed:', avatarError)
    } else {
      console.log(`Avatar files found: ${avatarFiles?.length || 0}`)
    }
    
    // Test 2: List files in community-images bucket
    console.log('Test 2: Listing community-images bucket...')
    const { data: communityFiles, error: communityError } = await supabase.storage
      .from('community-images')
      .list('', { limit: 10 })
    
    if (communityError) {
      console.error('Community listing failed:', communityError)
    } else {
      console.log(`Community files found: ${communityFiles?.length || 0}`)
    }
    
    // Test 3: Try to delete a single file (if any exist)
    if (avatarFiles && avatarFiles.length > 0) {
      console.log('Test 3: Testing file deletion...')
      const testFile = avatarFiles[0].name
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([testFile])
      
      if (deleteError) {
        console.error('File deletion failed:', deleteError)
      } else {
        console.log('File deletion successful')
      }
    }
    
    return NextResponse.json({
      success: true,
      avatarFiles: avatarFiles?.length || 0,
      communityFiles: communityFiles?.length || 0,
      avatarError: avatarError?.message || null,
      communityError: communityError?.message || null
    })
    
  } catch (error) {
    console.error('Storage test failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 })
  }
}
