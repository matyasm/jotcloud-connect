
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://wtzewgqrogcokwdiesqq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0emV3Z3Fyb2djb2t3ZGllc3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4MTM4NTIsImV4cCI6MjA1NzM4OTg1Mn0.CxorxzZ55DuO53bI2ThL-gfaYm8cyYx9NhucI5TPRhw";

// Create Supabase client with persistent storage
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// Debug helper to check session status
export const debugSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  console.log("Debug Session:", data, error);
  return { data, error };
};
