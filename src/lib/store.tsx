
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Note, AuthStatus } from './types';

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
  logout: () => void;
  createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'owner'>) => void;
  updateNote: (id: string, note: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  shareNote: (id: string, emails: string[]) => void;
  searchNotes: (query: string) => Note[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('unauthenticated');
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);

  // Check local storage for auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setAuthStatus('authenticated');
      // Load notes from localStorage in a real app you'd fetch from API
      setNotes(initialNotes);
    } else {
      setAuthStatus('unauthenticated');
    }
  }, []);

  // Login handler (mock for now)
  const login = async (email: string, password: string) => {
    // Simulate API call
    setAuthStatus('loading');
    
    // For demo purposes, we'll just set the user with a timeout
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser: User = {
      id: 'user1',
      email,
      name: email.split('@')[0]
    };
    
    setUser(mockUser);
    setAuthStatus('authenticated');
    setNotes(initialNotes);
    
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  // Register handler (mock for now)
  const register = async (name: string, email: string, password: string) => {
    // Simulate API call
    setAuthStatus('loading');
    
    // For demo purposes, we'll just set the user with a timeout
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser: User = {
      id: 'user1',
      email,
      name
    };
    
    setUser(mockUser);
    setAuthStatus('authenticated');
    setNotes(initialNotes);
    
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    setAuthStatus('unauthenticated');
    setNotes([]);
    setSharedNotes([]);
    localStorage.removeItem('user');
  };

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
