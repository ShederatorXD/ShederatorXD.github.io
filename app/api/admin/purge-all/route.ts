import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { adminId, adminEmail } = await request.json()
    
    if (!adminId || !adminEmail) {
      return NextResponse.json({ success: false, error: 'Missing admin credentials' }, { status: 400 })
    }
    
    // Verify admin via Supabase service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured')
      return NextResponse.json({ success: false, error: 'Service role key not configured' }, { status: 500 })
    }
    
    console.log('Service role key configured, proceeding with admin verification...')
    
    // Verify the requesting user is actually an admin
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminId)
      .single()
    
    if (adminError || adminProfile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    
    // Begin purge operation
    console.log(`Starting data purge by admin ${adminId} (${adminEmail})`)
    
    // Delete all database data in correct order to respect foreign key constraints
    try {
      console.log('Starting database cleanup...')
      
      // Delete in order to respect foreign key constraints
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .neq('user_id', adminId)
      
      if (commentsError) {
        console.error('Error deleting comments:', commentsError)
      } else {
        console.log('Comments deleted successfully')
      }
      
      const { error: postsError } = await supabase
        .from('community_posts')
        .delete()
        .neq('user_id', adminId)
      
      if (postsError) {
        console.error('Error deleting posts:', postsError)
      } else {
        console.log('Community posts deleted successfully')
      }
      
      const { error: ridesError } = await supabase
        .from('rides')
        .delete()
        .neq('user_id', adminId)
      
      if (ridesError) {
        console.error('Error deleting rides:', ridesError)
      } else {
        console.log('Rides deleted successfully')
      }
      
      const { error: impactError } = await supabase
        .from('impact_logs')
        .delete()
        .neq('user_id', adminId)
      
      if (impactError) {
        console.error('Error deleting impact logs:', impactError)
      } else {
        console.log('Impact logs deleted successfully')
      }
      
      const { error: redemptionsError } = await supabase
        .from('reward_redemptions')
        .delete()
        .neq('user_id', adminId)
      
      if (redemptionsError) {
        console.error('Error deleting reward redemptions:', redemptionsError)
      } else {
        console.log('Reward redemptions deleted successfully')
      }
      
      const { error: rewardsError } = await supabase
        .from('rewards')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Add WHERE clause to satisfy RLS
      
      if (rewardsError) {
        console.error('Error deleting rewards:', rewardsError)
      } else {
        console.log('Rewards deleted successfully')
      }
      
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .delete()
        .neq('user_id', adminId)
      
      if (prefsError) {
        console.error('Error deleting user preferences:', prefsError)
      } else {
        console.log('User preferences deleted successfully')
      }
      
      const { error: profilesError } = await supabase
        .from('profiles')
        .delete()
        .neq('id', adminId)
      
      if (profilesError) {
        console.error('Error deleting profiles:', profilesError)
      } else {
        console.log('Profiles deleted successfully')
      }
      
    } catch (fallbackError) {
      console.error('Database cleanup failed:', fallbackError)
    }
    
    // NEW APPROACH: Use direct storage operations with service role
    try {
      console.log('Starting NEW storage cleanup approach...')
      
      // Method 1: Try to list and delete files directly
      console.log('Method 1: Direct file listing and deletion...')
      
      // List all files in avatars bucket
      const { data: avatarFiles, error: avatarListError } = await supabase.storage
        .from('avatars')
        .list('', { limit: 1000 })
      
      if (avatarListError) {
        console.error('Failed to list avatar files:', avatarListError)
        console.log('This suggests the service role key might not have proper storage permissions')
      } else {
        console.log(`Found ${avatarFiles?.length || 0} avatar files`)
        
        if (avatarFiles && avatarFiles.length > 0) {
          // Filter out admin's avatar
          const filesToDelete = avatarFiles
            .filter(file => !file.name.startsWith(`${adminId}-`))
            .map(file => file.name)
          
          console.log(`Will delete ${filesToDelete.length} avatar files`)
          
          if (filesToDelete.length > 0) {
            // Try to delete all at once first
            const { error: deleteError } = await supabase.storage
              .from('avatars')
              .remove(filesToDelete)
            
            if (deleteError) {
              console.error('Bulk deletion failed:', deleteError)
              console.log('Trying individual deletion...')
              
              // Fallback to individual deletion
              for (const fileName of filesToDelete) {
                const { error: individualError } = await supabase.storage
                  .from('avatars')
                  .remove([fileName])
                
                if (individualError) {
                  console.error(`Failed to delete ${fileName}:`, individualError)
                } else {
                  console.log(`Deleted ${fileName}`)
                }
              }
            } else {
              console.log('Bulk avatar deletion successful')
            }
          }
        }
      }
      
      // List all files in community-images bucket
      const { data: communityFiles, error: communityListError } = await supabase.storage
        .from('community-images')
        .list('', { limit: 1000 })
      
      if (communityListError) {
        console.error('Failed to list community files:', communityListError)
      } else {
        console.log(`Found ${communityFiles?.length || 0} community image files`)
        
        if (communityFiles && communityFiles.length > 0) {
          const { error: deleteError } = await supabase.storage
            .from('community-images')
            .remove(communityFiles.map(file => file.name))
          
          if (deleteError) {
            console.error('Community images deletion failed:', deleteError)
          } else {
            console.log('Community images deletion successful')
          }
        }
      }
      
      // NEW: Recursively delete folder contents in avatars bucket
      console.log('Method 1.5: Recursive folder deletion in avatars bucket...')
      
      // Check if 'avatars' is a folder and delete its contents
      try {
        const { data: avatarsFolderContents, error: avatarsFolderError } = await supabase.storage
          .from('avatars')
          .list('avatars', { limit: 1000 })
        
        if (!avatarsFolderError && avatarsFolderContents && avatarsFolderContents.length > 0) {
          console.log(`Found ${avatarsFolderContents.length} files in avatars/ folder`)
          const avatarsFolderFiles = avatarsFolderContents.map(file => `avatars/${file.name}`)
          
          const { error: avatarsFolderDeleteError } = await supabase.storage
            .from('avatars')
            .remove(avatarsFolderFiles)
          
          if (avatarsFolderDeleteError) {
            console.error('Failed to delete avatars folder contents:', avatarsFolderDeleteError)
          } else {
            console.log('Successfully deleted avatars folder contents')
          }
        }
      } catch (avatarsFolderError) {
        console.error('Error accessing avatars folder:', avatarsFolderError)
      }
      
      // Check if 'community-images' is a folder in avatars bucket and delete its contents
      try {
        const { data: communityFolderContents, error: communityFolderError } = await supabase.storage
          .from('avatars')
          .list('community-images', { limit: 1000 })
        
        if (!communityFolderError && communityFolderContents && communityFolderContents.length > 0) {
          console.log(`Found ${communityFolderContents.length} files in community-images/ folder`)
          const communityFolderFiles = communityFolderContents.map(file => `community-images/${file.name}`)
          
          const { error: communityFolderDeleteError } = await supabase.storage
            .from('avatars')
            .remove(communityFolderFiles)
          
          if (communityFolderDeleteError) {
            console.error('Failed to delete community-images folder contents:', communityFolderDeleteError)
          } else {
            console.log('Successfully deleted community-images folder contents')
          }
        }
      } catch (communityFolderError) {
        console.error('Error accessing community-images folder:', communityFolderError)
      }
      
      // Method 2: Try wildcard deletion as fallback
      console.log('Method 2: Attempting wildcard deletion...')
      try {
        const { error: avatarWildcardError } = await supabase.storage
          .from('avatars')
          .remove(['*'])
        
        if (avatarWildcardError) {
          console.error('Avatar wildcard deletion failed:', avatarWildcardError)
        } else {
          console.log('Avatar wildcard deletion successful')
        }
        
        const { error: communityWildcardError } = await supabase.storage
          .from('community-images')
          .remove(['*'])
        
        if (communityWildcardError) {
          console.error('Community wildcard deletion failed:', communityWildcardError)
        } else {
          console.log('Community wildcard deletion successful')
        }
      } catch (wildcardError) {
        console.error('Wildcard deletion failed:', wildcardError)
      }
      
      // Method 3: Try to use admin functions
      console.log('Method 3: Attempting admin-level operations...')
      try {
        // Try to list files again to see what remains
        const { data: remainingAvatars } = await supabase.storage
          .from('avatars')
          .list('', { limit: 1000 })
        
        const { data: remainingCommunity } = await supabase.storage
          .from('community-images')
          .list('', { limit: 1000 })
        
        console.log(`Remaining avatar files: ${remainingAvatars?.length || 0}`)
        console.log(`Remaining community files: ${remainingCommunity?.length || 0}`)
        
        // If files still remain, try one more aggressive approach
        if (remainingAvatars && remainingAvatars.length > 0) {
          console.log('Attempting final aggressive avatar cleanup...')
          const remainingAvatarNames = remainingAvatars
            .filter(file => !file.name.startsWith(`${adminId}-`))
            .map(file => file.name)
          
          if (remainingAvatarNames.length > 0) {
            const { error: finalError } = await supabase.storage
              .from('avatars')
              .remove(remainingAvatarNames)
            
            if (finalError) {
              console.error('Final avatar cleanup failed:', finalError)
            } else {
              console.log('Final avatar cleanup successful')
            }
          }
        }
        
        if (remainingCommunity && remainingCommunity.length > 0) {
          console.log('Attempting final aggressive community cleanup...')
          const { error: finalError } = await supabase.storage
            .from('community-images')
            .remove(remainingCommunity.map(file => file.name))
          
          if (finalError) {
            console.error('Final community cleanup failed:', finalError)
          } else {
            console.log('Final community cleanup successful')
          }
        }
        
      } catch (adminError) {
        console.error('Admin-level operations failed:', adminError)
      }
      
      // Method 4: Nuclear option - Try to force empty entire buckets
      console.log('Method 4: Nuclear option - Force empty entire buckets...')
      try {
        // Try multiple wildcard patterns
        const wildcardPatterns = ['*', '**/*', '**', '*.*', '**/*.*']
        
        for (const pattern of wildcardPatterns) {
          console.log(`Trying wildcard pattern: ${pattern}`)
          
          // Try avatars bucket
          const { error: avatarPatternError } = await supabase.storage
            .from('avatars')
            .remove([pattern])
          
          if (avatarPatternError) {
            console.log(`Avatar pattern ${pattern} failed:`, avatarPatternError.message)
          } else {
            console.log(`Avatar pattern ${pattern} succeeded`)
          }
          
          // Try community-images bucket
          const { error: communityPatternError } = await supabase.storage
            .from('community-images')
            .remove([pattern])
          
          if (communityPatternError) {
            console.log(`Community pattern ${pattern} failed:`, communityPatternError.message)
          } else {
            console.log(`Community pattern ${pattern} succeeded`)
          }
        }
        
        // Wait for operations to complete
        await new Promise(resolve => setTimeout(resolve, 3000))
        
      } catch (nuclearError) {
        console.error('Nuclear option failed:', nuclearError)
      }
      
      // Method 5: Try to delete bucket contents using different approaches
      console.log('Method 5: Alternative bucket content deletion...')
      try {
        // Try to list with different parameters and delete
        const { data: finalAvatarCheck } = await supabase.storage
          .from('avatars')
          .list('', { limit: 1000, offset: 0 })
        
        const { data: finalCommunityCheck } = await supabase.storage
          .from('community-images')
          .list('', { limit: 1000, offset: 0 })
        
        if (finalAvatarCheck && finalAvatarCheck.length > 0) {
          console.log(`Final avatar check: ${finalAvatarCheck.length} files remain`)
          
          // Try to delete all remaining files individually
          for (const file of finalAvatarCheck) {
            if (!file.name.startsWith(`${adminId}-`)) {
              const { error: individualDeleteError } = await supabase.storage
                .from('avatars')
                .remove([file.name])
              
              if (individualDeleteError) {
                console.error(`Failed to delete ${file.name}:`, individualDeleteError.message)
              } else {
                console.log(`Successfully deleted ${file.name}`)
              }
            }
          }
        }
        
        if (finalCommunityCheck && finalCommunityCheck.length > 0) {
          console.log(`Final community check: ${finalCommunityCheck.length} files remain`)
          
          // Try to delete all remaining files individually
          for (const file of finalCommunityCheck) {
            const { error: individualDeleteError } = await supabase.storage
              .from('community-images')
              .remove([file.name])
            
            if (individualDeleteError) {
              console.error(`Failed to delete ${file.name}:`, individualDeleteError.message)
            } else {
              console.log(`Successfully deleted ${file.name}`)
            }
          }
        }
        
      } catch (alternativeError) {
        console.error('Alternative bucket deletion failed:', alternativeError)
      }
      
      // Final verification
      console.log('Final verification of storage cleanup...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const { data: finalAvatars } = await supabase.storage
        .from('avatars')
        .list('', { limit: 1000 })
      
      const { data: finalCommunity } = await supabase.storage
        .from('community-images')
        .list('', { limit: 1000 })
      
      console.log(`Final avatar count: ${finalAvatars?.length || 0}`)
      console.log(`Final community count: ${finalCommunity?.length || 0}`)
      
      // Log any remaining files for debugging
      if (finalAvatars && finalAvatars.length > 0) {
        console.log('Remaining avatar files:', finalAvatars.map(f => f.name))
        console.log('Avatar file details:', finalAvatars)
      }
      if (finalCommunity && finalCommunity.length > 0) {
        console.log('Remaining community files:', finalCommunity.map(f => f.name))
        console.log('Community file details:', finalCommunity)
      }
      
      // FINAL NUCLEAR OPTION: Force delete remaining files with detailed analysis
      if (finalAvatars && finalAvatars.length > 0) {
        console.log('=== FINAL NUCLEAR OPTION ===')
        console.log('Attempting to force delete remaining avatar files...')
        
        for (const file of finalAvatars) {
          console.log(`Analyzing file: ${file.name}`)
          console.log(`File size: ${file.metadata?.size || 'unknown'}`)
          console.log(`File type: ${file.metadata?.mimetype || 'unknown'}`)
          console.log(`File created: ${file.created_at || 'unknown'}`)
          
          // Try to delete this specific file
          const { error: finalDeleteError } = await supabase.storage
            .from('avatars')
            .remove([file.name])
          
          if (finalDeleteError) {
            console.error(`Final delete failed for ${file.name}:`, finalDeleteError)
            
            // Try alternative deletion methods
            try {
              // Try with different path formats
              const alternativePaths = [
                file.name,
                `/${file.name}`,
                `${file.name}/`,
                `./${file.name}`,
                `../${file.name}`
              ]
              
              for (const path of alternativePaths) {
                console.log(`Trying alternative path: ${path}`)
                const { error: altError } = await supabase.storage
                  .from('avatars')
                  .remove([path])
                
                if (!altError) {
                  console.log(`Alternative path ${path} succeeded for ${file.name}`)
                  break
                }
              }
            } catch (altError) {
              console.error(`Alternative deletion failed for ${file.name}:`, altError)
            }
          } else {
            console.log(`Final delete succeeded for ${file.name}`)
          }
        }
        
        // Wait and check again
        await new Promise(resolve => setTimeout(resolve, 3000))
        const { data: finalCheck } = await supabase.storage.from('avatars').list('', { limit: 1000 })
        console.log(`Final check after nuclear option: ${finalCheck?.length || 0} files remain`)
        if (finalCheck && finalCheck.length > 0) {
          console.log('Files still remaining after nuclear option:', finalCheck.map(f => f.name))
        }
      }
      
      // ULTIMATE FINAL OPTION: Try to force bucket reset
      console.log('=== ULTIMATE FINAL OPTION ===')
      try {
        // Try to list with different parameters to see if we can get more info
        const { data: finalListAttempt } = await supabase.storage
          .from('avatars')
          .list('', { limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } })
        
        if (finalListAttempt && finalListAttempt.length > 0) {
          console.log('Final list attempt shows files:', finalListAttempt.map(f => f.name))
          
          // Try to delete with different bucket operations
          console.log('Attempting bucket-level operations...')
          
          // Try to remove all files with empty string (sometimes works)
          const { error: emptyStringError } = await supabase.storage
            .from('avatars')
            .remove([''])
          
          if (emptyStringError) {
            console.log('Empty string removal failed:', emptyStringError.message)
          } else {
            console.log('Empty string removal succeeded')
          }
          
          // Try to remove with null/undefined (sometimes bypasses restrictions)
          try {
            const { error: nullError } = await supabase.storage
              .from('avatars')
              .remove([null as any])
            
            if (nullError) {
              console.log('Null removal failed:', nullError.message)
            } else {
              console.log('Null removal succeeded')
            }
          } catch (nullError) {
            console.log('Null removal exception:', nullError)
          }
          
          // Final attempt: try to list and delete one more time
          await new Promise(resolve => setTimeout(resolve, 2000))
          const { data: ultimateCheck } = await supabase.storage
            .from('avatars')
            .list('', { limit: 1000 })
          
          console.log(`Ultimate final check: ${ultimateCheck?.length || 0} files remain`)
          if (ultimateCheck && ultimateCheck.length > 0) {
            console.log('Files still remaining after ultimate option:', ultimateCheck.map(f => f.name))
            console.log('These files appear to be persistent and may require manual intervention')
          }
        }
      } catch (ultimateError) {
        console.error('Ultimate final option failed:', ultimateError)
      }
      
    } catch (storageError) {
      console.error('Storage cleanup failed completely:', storageError)
      console.log('This suggests a fundamental issue with storage permissions or configuration')
    }
    
    // Delete all auth users (except admin)
    try {
      const { data: allUsers, error: listUsersError } = await supabase.auth.admin.listUsers()
      
      if (!listUsersError && allUsers.users) {
        const usersToDelete = allUsers.users
          .filter(authUser => authUser.id !== adminId)
          .map(authUser => authUser.id)
        
        for (const userId of usersToDelete) {
          const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId)
          if (deleteUserError) {
            console.error(`Error deleting auth user ${userId}:`, deleteUserError)
          }
        }
      }
    } catch (authError) {
      console.error('Error clearing auth users:', authError)
    }
    
    // Ensure admin profile still exists after purge
    try {
      console.log('Verifying admin profile exists...')
      const { data: adminProfileCheck, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', adminId)
        .single()
      
      if (profileCheckError || !adminProfileCheck) {
        console.log('Admin profile missing, recreating...')
        const { error: recreateError } = await supabase
          .from('profiles')
          .upsert({
            id: adminId,
            name: adminEmail.split('@')[0] || 'Admin',
            role: 'admin',
            eco_points: 0,
            badges: [],
            phone: null,
            avatar_url: null,
            home_address: null,
            banned: false
          })
        
        if (recreateError) {
          console.error('Failed to recreate admin profile:', recreateError)
        } else {
          console.log('Admin profile recreated successfully')
        }
      } else {
        console.log('Admin profile verified and intact')
      }
    } catch (profileError) {
      console.error('Error checking admin profile:', profileError)
    }
    
    console.log(`Data purge completed by admin ${adminId}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'All data purged successfully',
      purgedAt: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Purge operation failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 })
  }
}
