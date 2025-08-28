import { User } from '@supabase/supabase-js';

export interface UseUserReturn {
  user: User | null;
  loading: boolean;
}

export declare function useUser(): UseUserReturn;
