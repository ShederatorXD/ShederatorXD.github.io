import { User } from '@supabase/supabase-js';

export interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

declare module '@/hooks/useUser' {
  const useUser: () => UseUserReturn;
  export default useUser;
}
