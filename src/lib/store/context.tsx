
import React, { createContext, useContext, useState, useEffect } from 'react';
import { StoreContextType } from './types';
import { AuthStatus, Note, User, Task } from '../types';
import { checkSession } from './auth';
import { supabase } from '@/integrations/supabase/client';
import { fetchNotes } from './noteOperations';
import { fetchTasks } from './taskOperations';

const initialNotes: Note[] = [];
const initialTasks: Task[] = [];

// Create context with default values
const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Custom hook to use the store context
export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

// StoreProvider component that initializes auth state and provides context to children
export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [publicNotes, setPublicNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth in StoreProvider');
        const { user: userData, error } = await checkSession();
        
        if (error) {
          console.error('Auth initialization error:', error);
          setAuthStatus('unauthenticated');
          return;
        }
        
        if (userData) {
          console.log('User authenticated in StoreProvider:', userData.email);
          setUser(userData);
          setAuthStatus('authenticated');
          
          // Fetch user data
          const { notes: userNotes, sharedNotes: shared, publicNotes: public_ } = 
            await fetchNotes(userData.id);
          setNotes(userNotes);
          setSharedNotes(shared);
          setPublicNotes(public_);
          
          const userTasks = await fetchTasks(userData.id);
          setTasks(userTasks);
        } else {
          console.log('No user found in StoreProvider');
          setAuthStatus('unauthenticated');
        }
      } catch (err) {
        console.error('Error initializing auth in StoreProvider:', err);
        setAuthStatus('unauthenticated');
      }
    };
    
    initializeAuth();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change in StoreProvider:', event);
      
      if (event === 'SIGNED_OUT') {
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

  return (
    <StoreContext.Provider
      value={{
        authStatus,
        user,
        notes,
        sharedNotes,
        publicNotes,
        login: async () => {}, // These will be implemented in provider.tsx
        register: async () => {},
        logout: async () => {},
        createNote: async () => {},
        updateNote: async () => {},
        deleteNote: async () => {},
        shareNote: async () => {},
        shareNoteWithAll: async () => {},
        searchNotes: () => [],
        exportNotes: () => {},
        importNotes: async () => {},
        likeNote: async () => {},
        tasks,
        createTask: async () => {},
        updateTask: async () => {},
        deleteTask: async () => {},
        startTask: async () => {},
        pauseTask: async () => {},
        completeTask: async () => {},
        reorderTasks: async () => {},
        getTimeMetricsByDay: () => [],
        getTimeMetricsByWeek: () => [],
        getTimeMetricsByMonth: () => []
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export { StoreContext };
