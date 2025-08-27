import { useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

export function useUserValidation() {
  const { user, logout } = useAuth()

  useEffect(() => {
    if (!user?.id) return

    const validateUser = async () => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (error || !profile) {
          console.log('User profile validation failed, logging out')
          await logout()
        }
      } catch (e) {
        console.error('Error validating user:', e)
        await logout()
      }
    }

    // Validate user every 60 seconds
    const intervalId = setInterval(validateUser, 60000)
    
    // Also validate on mount
    validateUser()

    return () => clearInterval(intervalId)
  }, [user?.id, logout])
}
