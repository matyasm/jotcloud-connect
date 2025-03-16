
import React, { useState, useEffect } from 'react';
import { StoreContext } from './context';
import { Note, Task, User, AuthStatus } from '../types';
import { supabase } from '@/integrations/supabase/client';
import * as authOperations from './auth';
import * as noteOperations from './noteOperations';
import * as taskOperations from './taskOperations';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [publicNotes, setPublicNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth in StoreProvider');
        const { user: userData, error } = await authOperations.checkSession();
        
        if (error) {
          console.error('Auth initialization error:', error);
          setAuthStatus('unauthenticated');
          setAuthInitialized(true);
          return;
        }
        
        if (userData) {
          console.log('User authenticated in StoreProvider:', userData.email);
          setUser(userData);
          setAuthStatus('authenticated');
          
          // Fetch user data
          const { notes: userNotes, sharedNotes: shared, publicNotes: public_ } = 
            await noteOperations.fetchNotes(userData.id);
          setNotes(userNotes);
          setSharedNotes(shared);
          setPublicNotes(public_);
          
          const userTasks = await taskOperations.fetchTasks(userData.id);
          setTasks(userTasks);
        } else {
          console.log('No user found in StoreProvider');
          setAuthStatus('unauthenticated');
        }
        
        setAuthInitialized(true);
      } catch (err) {
        console.error('Error initializing auth in StoreProvider:', err);
        setAuthStatus('unauthenticated');
        setAuthInitialized(true);
      }
    };
    
    initializeAuth();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change in StoreProvider:', event);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session.user.email);
        
        const userData = await authOperations.processUserData(session.user);
        
        if (userData) {
          setUser(userData);
          setAuthStatus('authenticated');
          
          // Fetch user data
          const { notes: userNotes, sharedNotes: shared, publicNotes: public_ } = 
            await noteOperations.fetchNotes(userData.id);
          setNotes(userNotes);
          setSharedNotes(shared);
          setPublicNotes(public_);
          
          const userTasks = await taskOperations.fetchTasks(userData.id);
          setTasks(userTasks);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out in StoreProvider');
        setUser(null);
        setAuthStatus('unauthenticated');
        setNotes([]);
        setSharedNotes([]);
        setPublicNotes([]);
        setTasks([]);
      }
    });
    
    return () => {
      console.log('Cleaning up auth listener in StoreProvider');
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setAuthStatus('loading');
      const userData = await authOperations.login(email, password);
      
      if (userData) {
        setUser(userData);
        
        // Fetch user data
        const { notes: userNotes, sharedNotes: shared, publicNotes: public_ } = 
          await noteOperations.fetchNotes(userData.id);
        setNotes(userNotes);
        setSharedNotes(shared);
        setPublicNotes(public_);
        
        const userTasks = await taskOperations.fetchTasks(userData.id);
        setTasks(userTasks);
        
        setAuthStatus('authenticated');
      }
    } catch (error: any) {
      setAuthStatus('unauthenticated');
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setAuthStatus('loading');
      await authOperations.register(name, email, password);
      // Registration only creates the account, doesn't log the user in
      setAuthStatus('unauthenticated');
    } catch (error: any) {
      setAuthStatus('unauthenticated');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authOperations.logout();
      // Auth state change will handle the reset
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Implement note operations
  const createNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'owner'>) => {
    try {
      const newNote = await noteOperations.createNote(user, note);
      setNotes(prev => [newNote, ...prev]);
    } catch (error) {
      throw error;
    }
  };

  const updateNote = async (id: string, noteUpdate: Partial<Note>) => {
    try {
      await noteOperations.updateNote(user, id, noteUpdate);
      setNotes(prev => 
        prev.map(note => 
          note.id === id 
            ? { ...note, ...noteUpdate, updatedAt: new Date().toISOString() } 
            : note
        )
      );
    } catch (error) {
      throw error;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await noteOperations.deleteNote(user, id);
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (error) {
      throw error;
    }
  };

  const shareNote = async (id: string, emails: string[]) => {
    try {
      const updatedSharedWith = await noteOperations.shareNote(user, id, emails);
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
      throw error;
    }
  };

  const shareNoteWithAll = async (id: string, share: boolean) => {
    try {
      await noteOperations.shareNoteWithAll(user, id, share);
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
    } catch (error) {
      throw error;
    }
  };

  const likeNote = async (id: string) => {
    try {
      const { updatedLikes, updatedLikedByNames } = await noteOperations.likeNote(user, id);
      
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

      // Update all note collections that might contain this note
      setNotes(updateNoteState);
      setSharedNotes(updateNoteState);
      setPublicNotes(updateNoteState);
    } catch (error) {
      throw error;
    }
  };

  const exportNotes = () => {
    noteOperations.exportNotes(notes);
  };

  const importNotes = async (notesJson: string) => {
    try {
      const importedNotes = await noteOperations.importNotes(user, notesJson);
      setNotes(prev => [...importedNotes, ...prev]);
    } catch (error) {
      throw error;
    }
  };

  const searchNotes = (query: string) => {
    return noteOperations.searchNotes(notes, query);
  };

  // Implement task operations
  const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'owner' | 'position' | 'totalTimeSeconds' | 'activeTimeAccumulatedSeconds'>) => {
    try {
      const newTask = await taskOperations.createTask(user, task);
      setTasks(prev => [...prev, newTask].sort((a, b) => a.position - b.position));
    } catch (error) {
      throw error;
    }
  };

  const updateTask = async (id: string, taskUpdate: Partial<Task>) => {
    try {
      await taskOperations.updateTask(user, id, taskUpdate);
      setTasks(prev => 
        prev.map(task => 
          task.id === id 
            ? { ...task, ...taskUpdate, updatedAt: new Date().toISOString() } 
            : task
        )
      );
    } catch (error) {
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await taskOperations.deleteTask(user, id);
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (error) {
      throw error;
    }
  };

  const startTask = async (id: string) => {
    try {
      await taskOperations.startTask(user, id, tasks);
      
      // Update local state
      const activeTasks = tasks.filter(task => task.status === 'active');
      for (const activeTask of activeTasks) {
        if (activeTask.id !== id) {
          setTasks(prev => 
            prev.map(task => 
              task.id === activeTask.id
                ? { ...task, status: 'paused', pausedAt: new Date().toISOString() }
                : task
            )
          );
        }
      }
      
      setTasks(prev => 
        prev.map(task => 
          task.id === id
            ? { 
                ...task, 
                status: 'active', 
                startedAt: task.startedAt || new Date().toISOString(),
                pausedAt: undefined,
                updatedAt: new Date().toISOString() 
              }
            : task
        )
      );
    } catch (error) {
      throw error;
    }
  };

  const pauseTask = async (id: string) => {
    try {
      await taskOperations.pauseTask(user, id, tasks);
      setTasks(prev => 
        prev.map(task => 
          task.id === id
            ? { 
                ...task, 
                status: 'paused', 
                pausedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString() 
              }
            : task
        )
      );
    } catch (error) {
      throw error;
    }
  };

  const completeTask = async (id: string) => {
    try {
      await taskOperations.completeTask(user, id, tasks);
      setTasks(prev => 
        prev.map(task => 
          task.id === id
            ? { 
                ...task, 
                status: 'completed', 
                completedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString() 
              }
            : task
        )
      );
    } catch (error) {
      throw error;
    }
  };

  const reorderTasks = async (taskIds: string[]) => {
    try {
      await taskOperations.reorderTasks(user, taskIds);
      
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
      throw error;
    }
  };

  const getTimeMetricsByDay = () => {
    return taskOperations.getTimeMetricsByDay(tasks);
  };
  
  const getTimeMetricsByWeek = () => {
    return taskOperations.getTimeMetricsByWeek(tasks);
  };
  
  const getTimeMetricsByMonth = () => {
    return taskOperations.getTimeMetricsByMonth(tasks);
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
