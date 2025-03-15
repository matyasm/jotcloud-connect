import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Note, AuthStatus } from './types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  exportNotes: () => void;
  importNotes: (notesJson: string) => Promise<void>;
  likeNote: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);

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
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event);
      if (event === 'SIGNED_IN' && session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
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

  const fetchNotes = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*, profiles:profiles(name)')
        .eq('owner', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        toast.error('Failed to load notes');
        return;
      }

      if (data) {
        const formattedNotes: Note[] = data.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          createdAt: note.created_at,
          updatedAt: note.updated_at,
          owner: note.owner,
          creatorName: note.profiles?.name,
          shared: note.shared,
          sharedWith: note.shared_with || [],
          tags: note.tags || [],
          likes: note.likes || [],
          likedByNames: note.liked_by_names || []
        }));
        
        setNotes(formattedNotes);
      }

      const { data: sharedData, error: sharedError } = await supabase
        .from('notes')
        .select('*, profiles:profiles(name)')
        .or(`shared_with.cs.{'*'}, shared_with.cs.{'${userId}'}`)
        .neq('owner', userId)
        .order('updated_at', { ascending: false });

      if (sharedError) {
        console.error('Error fetching shared notes:', sharedError);
        toast.error('Failed to load shared notes');
        return;
      }

      if (sharedData) {
        const formattedSharedNotes: Note[] = sharedData.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          createdAt: note.created_at,
          updatedAt: note.updated_at,
          owner: note.owner,
          creatorName: note.profiles?.name,
          shared: note.shared,
          sharedWith: note.shared_with || [],
          tags: note.tags || [],
          likes: note.likes || [],
          likedByNames: note.liked_by_names || []
        }));
        
        setSharedNotes(formattedSharedNotes);
      }
    } catch (error) {
      console.error('Error in fetchNotes:', error);
      toast.error('Failed to load notes');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setAuthStatus('loading');
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
    } catch (error: any) {
      setAuthStatus('unauthenticated');
      throw error;
    }
  };

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
    } catch (error: any) {
      setAuthStatus('unauthenticated');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        toast.error('Failed to sign out');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out');
    }
  };

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
          tags: note.tags,
          likes: note.likes || [],
          liked_by_names: note.likedByNames || []
        })
        .select('*, profiles:profiles(name)')
        .single();

      if (error) {
        console.error('Error creating note:', error);
        toast.error('Failed to create note');
        throw error;
      }

      if (data) {
        const newNote: Note = {
          id: data.id,
          title: data.title,
          content: data.content,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          owner: data.owner,
          creatorName: data.profiles?.name,
          shared: data.shared,
          sharedWith: data.shared_with || [],
          tags: data.tags || [],
          likes: data.likes || [],
          likedByNames: data.liked_by_names || []
        };
        
        setNotes(prev => [newNote, ...prev]);
      }
    } catch (error) {
      console.error('Error in createNote:', error);
      throw error;
    }
  };

  const updateNote = async (id: string, noteUpdate: Partial<Note>) => {
    if (!user) {
      toast.error('You must be logged in to update notes');
      return;
    }

    try {
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

      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (error) {
      console.error('Error in deleteNote:', error);
      throw error;
    }
  };

  const shareNote = async (id: string, emails: string[]) => {
    if (!user) {
      toast.error('You must be logged in to share notes');
      return;
    }

    try {
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
          shared_with: share ? ['*'] : [] 
        })
        .eq('id', id)
        .eq('owner', user.id);

      if (error) {
        console.error('Error updating note visibility:', error);
        toast.error('Failed to update note visibility');
        throw error;
      }

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

  const likeNote = async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to like notes');
      return;
    }

    try {
      const { data: noteData, error: fetchError } = await supabase
        .from('notes')
        .select('likes, liked_by_names')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching note:', fetchError);
        toast.error('Failed to like note');
        throw fetchError;
      }

      const currentLikes = noteData?.likes || [];
      const currentLikedByNames = noteData?.liked_by_names || [];
      
      const userLiked = currentLikes.includes(user.id);
      
      let updatedLikes: string[];
      let updatedLikedByNames: string[];
      
      if (userLiked) {
        updatedLikes = currentLikes.filter(id => id !== user.id);
        updatedLikedByNames = currentLikedByNames.filter(name => name !== user.name);
      } else {
        updatedLikes = [...currentLikes, user.id];
        updatedLikedByNames = [...currentLikedByNames, user.name];
      }

      const { error: updateError } = await supabase
        .from('notes')
        .update({ 
          likes: updatedLikes,
          liked_by_names: updatedLikedByNames
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error liking note:', updateError);
        toast.error('Failed to like note');
        throw updateError;
      }

      const updateNoteState = (prevNotes: Note[]) => 
        prevNotes.map(note => 
          note.id === id 
            ? { 
                ...note, 
                likes: updatedLikes,
                likedByNames: updatedLikedByNames
              } 
            : note
        );

      setNotes(updateNoteState);
      setSharedNotes(updateNoteState);
      
      toast.success(userLiked ? 'Removed like' : 'Added like');
    } catch (error) {
      console.error('Error in likeNote:', error);
      throw error;
    }
  };

  const exportNotes = () => {
    try {
      const notesJson = JSON.stringify(notes, null, 2);
      const blob = new Blob([notesJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Notes exported successfully');
    } catch (error) {
      console.error('Error exporting notes:', error);
      toast.error('Failed to export notes');
    }
  };

  const importNotes = async (notesJson: string) => {
    if (!user) {
      toast.error('You must be logged in to import notes');
      return;
    }

    try {
      const importedNotes = JSON.parse(notesJson);
      
      if (!Array.isArray(importedNotes)) {
        toast.error('Invalid notes format');
        return;
      }
      
      const loadingToast = toast.loading(`Importing ${importedNotes.length} notes...`);
      
      const notesToImport = importedNotes.map((note: any) => ({
        title: note.title || 'Imported Note',
        content: note.content || '',
        tags: Array.isArray(note.tags) ? note.tags : [],
        shared: false,
        shared_with: [],
        owner: user.id,
        likes: [],
        liked_by_names: []
      }));
      
      const { data, error } = await supabase
        .from('notes')
        .insert(notesToImport)
        .select();
      
      if (error) {
        console.error('Error importing notes:', error);
        toast.error('Failed to import notes');
        throw error;
      }
      
      if (data) {
        const newNotes = data.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          createdAt: note.created_at,
          updatedAt: note.updated_at,
          owner: note.owner,
          shared: note.shared,
          sharedWith: note.shared_with || [],
          tags: note.tags || [],
          likes: note.likes || [],
          likedByNames: note.liked_by_names || []
        }));
        
        setNotes(prev => [...newNotes, ...prev]);
      }
      
      toast.dismiss(loadingToast);
      toast.success(`Successfully imported ${notesToImport.length} notes`);
    } catch (error) {
      console.error('Error importing notes:', error);
      toast.error('Failed to import notes: Invalid format');
    }
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
    shareNoteWithAll,
    searchNotes,
    exportNotes,
    importNotes,
    likeNote
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
