
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  owner: string;
  shared: boolean;
  sharedWith: string[];
  tags: string[];
}

export type NoteSort = 'recent' | 'title' | 'created';

export type AuthStatus = 'authenticated' | 'loading' | 'unauthenticated';
