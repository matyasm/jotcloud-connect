import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Note, AuthStatus } from './types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mock data for initial development
const initialNotes: Note[] = [
  {
    id: '1',
    title: 'Welcome to JotCloud',
    content: 'Start taking notes with this beautiful, minimalist app.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    owner: 'user1',
    shared: false,
    sharedWith: [],
    tags: ['welcome']
  },
  {
    id: '2',
    title: 'Meeting Notes',
    content: 'Discuss project timeline and deliverables.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    owner: 'user1',
    shared: true,
    sharedWith: ['user2'],
    tags: ['work', 'meeting']
  }
];

interface StoreContextType {
  authStatus: AuthStatus;
  user: User | null;
  notes: Note[];
  sharedNotes: Note[];
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'owner'>) => void;
  updateNote: (id: string, note: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  shareNote: (id: string, emails: string[]) => void;
  searchNotes: (query: string) => Note[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          setAuthStatus('unauthenticated');
          return;
        }
        
        if (data.session) {
          const { user: supabaseUser } = data.session;
          
          // Get user profile from the profiles table
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();
          
          const userData: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: profileData?.name || supabaseUser.email?.split('@')[0] || ''
          };
          
          setUser(userData);
          setAuthStatus('authenticated');
          // For demo, we'll still use the mock notes
          setNotes(initialNotes);
        } else {
          setAuthStatus('unauthenticated');
        }
      } catch (err) {
        console.error('Error in session check:', err);
        setAuthStatus('unauthenticated');
      }
    };
    
    checkSession();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: profileData?.name || session.user.email?.split('@')[0] || ''
        };
        
        setUser(userData);
        setAuthStatus('authenticated');
        setNotes(initialNotes); // For demo
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAuthStatus('unauthenticated');
        setNotes([]);
        setSharedNotes([]);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Login handler
  const login = async (email: string, password: string) => {
    try {
      setAuthStatus('loading');
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Auth state change listener will update the state
    } catch (error: any) {
      setAuthStatus('unauthenticated');
      throw error;
    }
  };

  // Register handler
  const register = async (name: string, email: string, password: string) => {
    try {
      setAuthStatus('loading');
      
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
      
      // The trigger we set up will create a profile record
      // Auth state change listener will update the state
    } catch (error: any) {
      setAuthStatus('unauthenticated');
      throw error;
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        toast.error('Failed to sign out');
      }
      
      // Auth state change listener will handle the state update
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out');
    }
  };

  // Keep existing note manipulation functions
  const createNote = (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'owner'>) => {
    const newNote: Note = {
      ...note,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: user?.id || 'unknown'
    };
    
    setNotes(prev => [newNote, ...prev]);
  };

  const updateNote = (id: string, noteUpdate: Partial<Note>) => {
    setNotes(prev => 
      prev.map(note => 
        note.id === id 
          ? { ...note, ...noteUpdate, updatedAt: new Date().toISOString() } 
          : note
      )
    );
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const shareNote = (id: string, emails: string[]) => {
    setNotes(prev => 
      prev.map(note => 
        note.id === id 
          ? { 
              ...note, 
              shared: true, 
              sharedWith: [...new Set([...note.sharedWith, ...emails])],
              updatedAt: new Date().toISOString() 
            } 
          : note
      )
    );
  };

  const searchNotes = (query: string) => {
    if (!query.trim()) return notes;
    
    const lowercaseQuery = query.toLowerCase();
    return notes.filter(note => 
      note.title.toLowerCase().includes(lowercaseQuery) || 
      note.content.toLowerCase().includes(lowercaseQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  const value = {
    authStatus,
    user,
    notes,
    sharedNotes,
    login,
    register,
    logout,
    createNote,
    updateNote,
    deleteNote,
    shareNote,
    searchNotes
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
