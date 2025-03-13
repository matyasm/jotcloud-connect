
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Note, AuthStatus } from './types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mock data for initial development - this will be removed
const initialNotes: Note[] = [];

interface StoreContextType {
  authStatus: AuthStatus;
  user: User | null;
  notes: Note[];
  sharedNotes: Note[];
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'owner'>) => Promise<void>;
  updateNote: (id: string, note: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  shareNote: (id: string, emails: string[]) => Promise<void>;
  shareNoteWithAll: (id: string, share: boolean) => Promise<void>;
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
          
          // For Google auth, try to use the display name or email
          const displayName = supabaseUser.user_metadata?.full_name || 
                             supabaseUser.user_metadata?.name;
          
          const userData: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: profileData?.name || displayName || supabaseUser.email?.split('@')[0] || ''
          };
          
          setUser(userData);
          setAuthStatus('authenticated');
          fetchNotes(supabaseUser.id);
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
      console.log('Auth state change event:', event);
      if (event === 'SIGNED_IN' && session) {
        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        // For Google auth, try to use the display name or email
        const displayName = session.user.user_metadata?.full_name || 
                           session.user.user_metadata?.name;
        
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: profileData?.name || displayName || session.user.email?.split('@')[0] || ''
        };
        
        setUser(userData);
        setAuthStatus('authenticated');
        fetchNotes(session.user.id);
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

  // Fetch notes from Supabase
  const fetchNotes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('owner', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        toast.error('Failed to load notes');
        return;
      }

      if (data) {
        // Transform the data to match our Note type
        const formattedNotes: Note[] = data.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          createdAt: note.created_at,
          updatedAt: note.updated_at,
          owner: note.owner,
          shared: note.shared,
          sharedWith: note.shared_with || [],
          tags: note.tags || []
        }));
        
        setNotes(formattedNotes);
      }
    } catch (error) {
      console.error('Error in fetchNotes:', error);
      toast.error('Failed to load notes');
    }
  };

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

  // Create note - now using Supabase
  const createNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'owner'>) => {
    if (!user) {
      toast.error('You must be logged in to create notes');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: note.title,
          content: note.content,
          owner: user.id,
          shared: note.shared,
          shared_with: note.sharedWith,
          tags: note.tags
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating note:', error);
        toast.error('Failed to create note');
        throw error;
      }

      // Add the new note to the state
      if (data) {
        const newNote: Note = {
          id: data.id,
          title: data.title,
          content: data.content,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          owner: data.owner,
          shared: data.shared,
          sharedWith: data.shared_with || [],
          tags: data.tags || []
        };
        
        setNotes(prev => [newNote, ...prev]);
      }
    } catch (error) {
      console.error('Error in createNote:', error);
      throw error;
    }
  };

  // Update note - now using Supabase
  const updateNote = async (id: string, noteUpdate: Partial<Note>) => {
    if (!user) {
      toast.error('You must be logged in to update notes');
      return;
    }

    try {
      // Prepare the update data
      const updateData: any = {};
      if (noteUpdate.title !== undefined) updateData.title = noteUpdate.title;
      if (noteUpdate.content !== undefined) updateData.content = noteUpdate.content;
      if (noteUpdate.shared !== undefined) updateData.shared = noteUpdate.shared;
      if (noteUpdate.sharedWith !== undefined) updateData.shared_with = noteUpdate.sharedWith;
      if (noteUpdate.tags !== undefined) updateData.tags = noteUpdate.tags;

      const { error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', id)
        .eq('owner', user.id);

      if (error) {
        console.error('Error updating note:', error);
        toast.error('Failed to update note');
        throw error;
      }

      // Update the note in state
      setNotes(prev => 
        prev.map(note => 
          note.id === id 
            ? { ...note, ...noteUpdate, updatedAt: new Date().toISOString() } 
            : note
        )
      );
    } catch (error) {
      console.error('Error in updateNote:', error);
      throw error;
    }
  };

  // Delete note - now using Supabase
  const deleteNote = async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to delete notes');
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('owner', user.id);

      if (error) {
        console.error('Error deleting note:', error);
        toast.error('Failed to delete note');
        throw error;
      }

      // Remove the note from state
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (error) {
      console.error('Error in deleteNote:', error);
      throw error;
    }
  };

  // Share note - now using Supabase
  const shareNote = async (id: string, emails: string[]) => {
    if (!user) {
      toast.error('You must be logged in to share notes');
      return;
    }

    try {
      // First, get the current note to get the existing sharedWith
      const { data: noteData, error: fetchError } = await supabase
        .from('notes')
        .select('shared_with')
        .eq('id', id)
        .eq('owner', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching note:', fetchError);
        toast.error('Failed to share note');
        throw fetchError;
      }

      const currentSharedWith = noteData?.shared_with || [];
      const updatedSharedWith = [...new Set([...currentSharedWith, ...emails])];

      const { error: updateError } = await supabase
        .from('notes')
        .update({ 
          shared: true,
          shared_with: updatedSharedWith 
        })
        .eq('id', id)
        .eq('owner', user.id);

      if (updateError) {
        console.error('Error sharing note:', updateError);
        toast.error('Failed to share note');
        throw updateError;
      }

      // Update the note in state
      setNotes(prev => 
        prev.map(note => 
          note.id === id 
            ? { 
                ...note, 
                shared: true, 
                sharedWith: updatedSharedWith,
                updatedAt: new Date().toISOString() 
              } 
            : note
        )
      );
    } catch (error) {
      console.error('Error in shareNote:', error);
      throw error;
    }
  };

  // Share note with all users (public note)
  const shareNoteWithAll = async (id: string, share: boolean) => {
    if (!user) {
      toast.error('You must be logged in to share notes');
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .update({ 
          shared: share,
          shared_with: share ? ['*'] : [] // Use '*' to indicate shared with everyone
        })
        .eq('id', id)
        .eq('owner', user.id);

      if (error) {
        console.error('Error updating note visibility:', error);
        toast.error('Failed to update note visibility');
        throw error;
      }

      // Update the note in state
      setNotes(prev => 
        prev.map(note => 
          note.id === id 
            ? { 
                ...note, 
                shared: share, 
                sharedWith: share ? ['*'] : [],
                updatedAt: new Date().toISOString() 
              } 
            : note
        )
      );

      toast.success(share ? 'Note shared with everyone' : 'Note is now private');
    } catch (error) {
      console.error('Error in shareNoteWithAll:', error);
      throw error;
    }
  };

  // Search notes - local implementation
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
    shareNoteWithAll,
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
