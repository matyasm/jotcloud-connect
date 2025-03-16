
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Note, AuthStatus, Task, TaskTimeEntry, TimeMetrics, WeekMetrics, MonthMetrics } from './types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, parseISO, differenceInSeconds, isWithinInterval } from 'date-fns';

const initialNotes: Note[] = [];
const initialTasks: Task[] = [];

interface StoreContextType {
  authStatus: AuthStatus;
  user: User | null;
  notes: Note[];
  sharedNotes: Note[];
  publicNotes: Note[];
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
  tasks: Task[];
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'owner' | 'position' | 'totalTimeSeconds' | 'activeTimeAccumulatedSeconds'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  startTask: (id: string) => Promise<void>;
  pauseTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  reorderTasks: (taskIds: string[]) => Promise<void>;
  getTimeMetricsByDay: () => TimeMetrics[];
  getTimeMetricsByWeek: () => WeekMetrics[];
  getTimeMetricsByMonth: () => MonthMetrics[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [publicNotes, setPublicNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Function to process user data from supabase user
  const processUserData = async (supabaseUser: any) => {
    if (!supabaseUser) {
      console.log('No user found in processUserData');
      setAuthStatus('unauthenticated');
      setUser(null);
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
      setUser(userData);
      setAuthStatus('authenticated');
      
      return userData;
    } catch (err) {
      console.error('Error processing user data:', err);
      return null;
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('Checking session...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          setAuthStatus('unauthenticated');
          setAuthInitialized(true);
          return;
        }
        
        if (data.session) {
          const { user: supabaseUser } = data.session;
          console.log('Session found, user:', supabaseUser.email);
          
          const userData = await processUserData(supabaseUser);
          
          if (userData) {
            await fetchNotes(userData.id);
            await fetchTasks(userData.id);
          }
        } else {
          console.log('No session found');
          setAuthStatus('unauthenticated');
        }
        
        setAuthInitialized(true);
      } catch (err) {
        console.error('Error in session check:', err);
        setAuthStatus('unauthenticated');
        setAuthInitialized(true);
      }
    };
    
    checkSession();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session.user.email);
        
        const userData = await processUserData(session.user);
        
        if (userData) {
          await fetchNotes(userData.id);
          await fetchTasks(userData.id);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setUser(null);
        setAuthStatus('unauthenticated');
        setNotes([]);
        setSharedNotes([]);
        setPublicNotes([]);
        setTasks([]);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchNotes = async (userId: string) => {
    if (!userId) {
      console.error('Cannot fetch notes: No user ID provided');
      return;
    }
    
    try {
      console.log('Fetching notes for user:', userId);
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
        console.log('Found', data.length, 'notes for user');
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

      // Fetch user email for shared notes
      try {
        const { data: userEmail } = await supabase.auth.getUser();
        const email = userEmail?.user?.email;

        if (email) {
          console.log('Fetching shared notes for email:', email);
          
          const { data: sharedSpecificData, error: sharedSpecificError } = await supabase
            .from('notes')
            .select('*, profiles:profiles(name)')
            .contains('shared_with', [email])
            .neq('owner', userId)
            .order('updated_at', { ascending: false });

          if (sharedSpecificError) {
            console.error('Error fetching shared notes:', sharedSpecificError);
            toast.error('Failed to load shared notes');
          } else if (sharedSpecificData) {
            console.log('Shared notes found:', sharedSpecificData.length);
            
            const formattedSharedNotes: Note[] = sharedSpecificData.map(note => ({
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
        }
      } catch (error) {
        console.error('Error fetching user email for shared notes:', error);
      }

      // Fetch public notes
      try {
        const { data: publicData, error: publicError } = await supabase
          .from('notes')
          .select('*, profiles:profiles(name)')
          .contains('shared_with', ['*'])
          .order('updated_at', { ascending: false });

        if (publicError) {
          console.error('Error fetching public notes:', publicError);
          toast.error('Failed to load public notes');
        } else if (publicData) {
          console.log('Public notes found:', publicData.length);
          const formattedPublicNotes: Note[] = publicData.map(note => ({
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
          
          setPublicNotes(formattedPublicNotes);
        }
      } catch (error) {
        console.error('Error fetching public notes:', error);
      }
    } catch (error) {
      console.error('Error in fetchNotes:', error);
      toast.error('Failed to load notes');
    }
  };

  const fetchTasks = async (userId: string) => {
    if (!userId) {
      console.error('Cannot fetch tasks: No user ID provided');
      return;
    }
    
    try {
      console.log('Fetching tasks for user:', userId);
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('owner', userId)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching tasks:', error);
        toast.error('Failed to load tasks');
        return;
      }

      if (data) {
        console.log('Tasks found:', data.length);
        
        const formattedTasks: Task[] = data.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || undefined,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
          startedAt: task.started_at || undefined,
          pausedAt: task.paused_at || undefined,
          completedAt: task.completed_at || undefined,
          owner: task.owner,
          status: task.status as 'pending' | 'active' | 'paused' | 'completed',
          position: task.position,
          totalTimeSeconds: task.total_time_seconds || 0,
          activeTimeAccumulatedSeconds: task.active_time_accumulated_seconds || 0
        }));
        
        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error('Error in fetchTasks:', error);
      toast.error('Failed to load tasks');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Login attempt for:', email);
      setAuthStatus('loading');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login error:', error);
        setAuthStatus('unauthenticated');
        throw error;
      }
      
      if (data.user) {
        console.log('Login successful for:', data.user.email);
        const userData = await processUserData(data.user);
        
        if (userData) {
          await fetchNotes(userData.id);
          await fetchTasks(userData.id);
          
          console.log('Authentication completed, state is now:', 'authenticated');
          
          // Force an immediate auth state update
          setAuthStatus('authenticated');
        }
      }
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
        updatedLikes = currentLikes.filter(likeId => likeId !== user.id);
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
      setPublicNotes(updateNoteState);
      
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

  const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'owner' | 'position' | 'totalTimeSeconds' | 'activeTimeAccumulatedSeconds'>) => {
    if (!user) {
      toast.error('You must be logged in to create tasks');
      return;
    }

    try {
      const { data: positionData } = await supabase
        .from('tasks')
        .select('position')
        .eq('owner', user.id)
        .order('position', { ascending: false })
        .limit(1);
      
      const nextPosition = positionData && positionData.length > 0 ? positionData[0].position + 1 : 0;
      
      const taskStatus: 'pending' | 'active' | 'paused' | 'completed' = task.status || 'pending';
      
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: task.title,
          description: task.description,
          status: taskStatus,
          owner: user.id,
          position: nextPosition,
          total_time_seconds: 0,
          active_time_accumulated_seconds: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        toast.error('Failed to create task');
        throw error;
      }

      if (data) {
        const newTask: Task = {
          id: data.id,
          title: data.title,
          description: data.description,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          startedAt: data.started_at,
          pausedAt: data.paused_at,
          completedAt: data.completed_at,
          owner: data.owner,
          status: data.status as 'pending' | 'active' | 'paused' | 'completed',
          position: data.position,
          totalTimeSeconds: data.total_time_seconds || 0,
          activeTimeAccumulatedSeconds: data.active_time_accumulated_seconds || 0
        };
        
        setTasks(prev => [...prev, newTask].sort((a, b) => a.position - b.position));
        toast.success('Task created');
      }
    } catch (error) {
      console.error('Error in createTask:', error);
      throw error;
    }
  };

  const updateTask = async (id: string, taskUpdate: Partial<Task>) => {
    if (!user) {
      toast.error('You must be logged in to update tasks');
      return;
    }

    try {
      const updateData: any = {};
      if (taskUpdate.title !== undefined) updateData.title = taskUpdate.title;
      if (taskUpdate.description !== undefined) updateData.description = taskUpdate.description;
      if (taskUpdate.status !== undefined) updateData.status = taskUpdate.status;
      if (taskUpdate.startedAt !== undefined) updateData.started_at = taskUpdate.startedAt;
      if (taskUpdate.pausedAt !== undefined) updateData.paused_at = taskUpdate.pausedAt;
      if (taskUpdate.completedAt !== undefined) updateData.completed_at = taskUpdate.completedAt;
      if (taskUpdate.position !== undefined) updateData.position = taskUpdate.position;
      if (taskUpdate.totalTimeSeconds !== undefined) updateData.total_time_seconds = taskUpdate.totalTimeSeconds;
      if (taskUpdate.activeTimeAccumulatedSeconds !== undefined) 
        updateData.active_time_accumulated_seconds = taskUpdate.activeTimeAccumulatedSeconds;

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .eq('owner', user.id);

      if (error) {
        console.error('Error updating task:', error);
        toast.error('Failed to update task');
        throw error;
      }

      setTasks(prev => 
        prev.map(task => 
          task.id === id 
            ? { ...task, ...taskUpdate, updatedAt: new Date().toISOString() } 
            : task
        )
      );
    } catch (error) {
      console.error('Error in updateTask:', error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to delete tasks');
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('owner', user.id);

      if (error) {
        console.error('Error deleting task:', error);
        toast.error('Failed to delete task');
        throw error;
      }

      setTasks(prev => prev.filter(task => task.id !== id));
      toast.success('Task deleted');
    } catch (error) {
      console.error('Error in deleteTask:', error);
      throw error;
    }
  };

  const createTimeEntry = async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('task_time_entries')
        .insert({
          task_id: taskId,
          start_time: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating time entry:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in createTimeEntry:', error);
      throw error;
    }
  };

  const endTimeEntry = async (taskId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('task_time_entries')
        .select('*')
        .eq('task_id', taskId)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching time entry:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const entry = data[0];
        const endTime = new Date().toISOString();
        
        const { error: updateError } = await supabase
          .from('task_time_entries')
          .update({ end_time: endTime })
          .eq('id', entry.id);

        if (updateError) {
          console.error('Error updating time entry:', updateError);
          throw updateError;
        }

        const startTime = new Date(entry.start_time);
        const durationSeconds = Math.floor((new Date(endTime).getTime() - startTime.getTime()) / 1000);
        
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          const newTotalSeconds = (task.totalTimeSeconds || 0) + durationSeconds;
          await updateTask(taskId, { totalTimeSeconds: newTotalSeconds });
        }
      }
    } catch (error) {
      console.error('Error in endTimeEntry:', error);
      throw error;
    }
  };

  const startTask = async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to start tasks');
      return;
    }

    try {
      const activeTasks = tasks.filter(task => task.status === 'active');
      for (const activeTask of activeTasks) {
        if (activeTask.id !== id) {
          await pauseTask(activeTask.id);
        }
      }

      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const now = new Date().toISOString();
      
      await createTimeEntry(id);
      
      await updateTask(id, {
        status: 'active',
        startedAt: task.startedAt || now,
        pausedAt: undefined
      });

      toast.success('Task started');
    } catch (error) {
      console.error('Error starting task:', error);
      toast.error('Failed to start task');
    }
  };

  const pauseTask = async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to pause tasks');
      return;
    }

    try {
      await endTimeEntry(id);
      
      await updateTask(id, {
        status: 'paused',
        pausedAt: new Date().toISOString()
      });

      toast.success('Task paused');
    } catch (error) {
      console.error('Error pausing task:', error);
      toast.error('Failed to pause task');
    }
  };

  const completeTask = async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to complete tasks');
      return;
    }

    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      if (task.status === 'active') {
        await endTimeEntry(id);
      }
      
      await updateTask(id, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      toast.success('Task completed');
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  const reorderTasks = async (taskIds: string[]) => {
    if (!user || taskIds.length === 0) return;

    try {
      const updates = taskIds.map((id, index) => ({
        id,
        position: index
      }));
      
      for (const update of updates) {
        await updateTask(update.id, { position: update.position });
      }
      
      const reorderedTasks = [...tasks]
        .sort((a, b) => {
          const aIndex = taskIds.indexOf(a.id);
          const bIndex = taskIds.indexOf(b.id);
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
      
      setTasks(reorderedTasks);
    } catch (error) {
      console.error('Error reordering tasks:', error);
      toast.error('Failed to reorder tasks');
    }
  };

  const getTimeMetricsByDay = () => {
    if (!tasks.length) return [];
    
    const tasksByDay: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      if (task.totalTimeSeconds > 0) {
        const createdDate = format(new Date(task.createdAt), 'yyyy-MM-dd');
        if (!tasksByDay[createdDate]) {
          tasksByDay[createdDate] = [];
        }
        tasksByDay[createdDate].push(task);
      }
    });
    
    return Object.entries(tasksByDay).map(([day, dayTasks]) => {
      const totalSeconds = dayTasks.reduce((acc, task) => acc + task.totalTimeSeconds, 0);
      return {
        day,
        totalSeconds,
        tasks: dayTasks
      };
    });
  };
  
  const getTimeMetricsByWeek = () => {
    const dailyMetrics = getTimeMetricsByDay();
    if (!dailyMetrics.length) return [];
    
    const weekMap = new Map<string, TimeMetrics[]>();
    
    dailyMetrics.forEach(dayMetric => {
      const date = parseISO(dayMetric.day);
      const weekStart = format(startOfWeek(date), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(date), 'yyyy-MM-dd');
      const weekKey = `${weekStart}|${weekEnd}`;
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, []);
      }
      
      weekMap.get(weekKey)?.push(dayMetric);
    });
    
    return Array.from(weekMap.entries()).map(([weekKey, days]) => {
      const [weekStart, weekEnd] = weekKey.split('|');
      const totalSeconds = days.reduce((acc, day) => acc + day.totalSeconds, 0);
      
      return {
        weekStart,
        weekEnd,
        totalSeconds,
        days
      };
    });
  };
  
  const getTimeMetricsByMonth = () => {
    const weeklyMetrics = getTimeMetricsByWeek();
    if (!weeklyMetrics.length) return [];
    
    const monthMap = new Map<string, WeekMetrics[]>();
    
    weeklyMetrics.forEach(weekMetric => {
      const startDate = parseISO(weekMetric.weekStart);
      const month = format(startDate, 'yyyy-MM');
      
      if (!monthMap.has(month)) {
        monthMap.set(month, []);
      }
      
      monthMap.get(month)?.push(weekMetric);
    });
    
    return Array.from(monthMap.entries()).map(([month, weeks]) => {
      const totalSeconds = weeks.reduce((acc, week) => acc + week.totalSeconds, 0);
      
      return {
        month,
        totalSeconds,
        weeks
      };
    });
  };

  return (
    <StoreContext.Provider
      value={{
        authStatus,
        user,
        notes,
        sharedNotes,
        publicNotes,
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
        likeNote,
        tasks,
        createTask,
        updateTask,
        deleteTask,
        startTask,
        pauseTask,
        completeTask,
        reorderTasks,
        getTimeMetricsByDay,
        getTimeMetricsByWeek,
        getTimeMetricsByMonth
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
