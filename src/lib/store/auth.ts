
import { supabase } from '@/integrations/supabase/client';
import { User } from '../types';
import { toast } from 'sonner';

export const processUserData = async (supabaseUser: any): Promise<User | null> => {
  if (!supabaseUser) {
    console.log('No user found in processUserData');
    return null;
  }
  
  try {
    console.log('Processing user data for:', supabaseUser.email);
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();
    
    const displayName = supabaseUser.user_metadata?.full_name || 
                      supabaseUser.user_metadata?.name;
    
    const userData: User = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: profileData?.name || displayName || supabaseUser.email?.split('@')[0] || ''
    };
    
    console.log('User data processed:', userData.email);
    return userData;
  } catch (err) {
    console.error('Error processing user data:', err);
    return null;
  }
};

export const login = async (email: string, password: string) => {
  try {
    console.log('Login attempt for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Login error:', error);
      throw error;
    }
    
    if (data.user) {
      console.log('Login successful for:', data.user.email);
      return await processUserData(data.user);
    }
    
    return null;
  } catch (error: any) {
    throw error;
  }
};

export const register = async (name: string, email: string, password: string) => {
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });
    
    if (error) throw error;
  } catch (error: any) {
    throw error;
  }
};

export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
      throw error;
    }
  } catch (error) {
    console.error('Logout error:', error);
    toast.error('Failed to sign out');
    throw error;
  }
};

export const checkSession = async () => {
  try {
    console.log('Checking session...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error checking session:', error);
      return { user: null, error };
    }
    
    if (data.session) {
      const { user: supabaseUser } = data.session;
      console.log('Session found, user:', supabaseUser.email);
      
      const userData = await processUserData(supabaseUser);
      return { user: userData, error: null };
    } else {
      console.log('No session found');
      return { user: null, error: null };
    }
  } catch (err) {
    console.error('Error in session check:', err);
    return { user: null, error: err };
  }
};
