
import { supabase } from '@/integrations/supabase/client';
import { Note, User } from '../types';
import { toast } from 'sonner';

export const fetchNotes = async (userId: string): Promise<{
  notes: Note[],
  sharedNotes: Note[],
  publicNotes: Note[]
}> => {
  if (!userId) {
    console.error('Cannot fetch notes: No user ID provided');
    return { notes: [], sharedNotes: [], publicNotes: [] };
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
      return { notes: [], sharedNotes: [], publicNotes: [] };
    }

    let userNotes: Note[] = [];
    if (data) {
      console.log('Found', data.length, 'notes for user');
      userNotes = data.map(note => ({
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
    }

    // Fetch shared notes
    let sharedNotes: Note[] = [];
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
          
          sharedNotes = sharedSpecificData.map(note => ({
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
        }
      }
    } catch (error) {
      console.error('Error fetching user email for shared notes:', error);
    }

    // Fetch public notes
    let publicNotes: Note[] = [];
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
        publicNotes = publicData.map(note => ({
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
      }
    } catch (error) {
      console.error('Error fetching public notes:', error);
    }

    return { notes: userNotes, sharedNotes, publicNotes };
  } catch (error) {
    console.error('Error in fetchNotes:', error);
    toast.error('Failed to load notes');
    return { notes: [], sharedNotes: [], publicNotes: [] };
  }
};

export const createNote = async (user: User | null, note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'owner'>) => {
  if (!user) {
    toast.error('You must be logged in to create notes');
    throw new Error('User not authenticated');
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
      
      return newNote;
    }
    throw new Error('No data returned from create note operation');
  } catch (error) {
    console.error('Error in createNote:', error);
    throw error;
  }
};

export const updateNote = async (user: User | null, id: string, noteUpdate: Partial<Note>) => {
  if (!user) {
    toast.error('You must be logged in to update notes');
    throw new Error('User not authenticated');
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
  } catch (error) {
    console.error('Error in updateNote:', error);
    throw error;
  }
};

export const deleteNote = async (user: User | null, id: string) => {
  if (!user) {
    toast.error('You must be logged in to delete notes');
    throw new Error('User not authenticated');
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
  } catch (error) {
    console.error('Error in deleteNote:', error);
    throw error;
  }
};

export const shareNote = async (user: User | null, id: string, emails: string[]) => {
  if (!user) {
    toast.error('You must be logged in to share notes');
    throw new Error('User not authenticated');
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

    return updatedSharedWith;
  } catch (error) {
    console.error('Error in shareNote:', error);
    throw error;
  }
};

export const shareNoteWithAll = async (user: User | null, id: string, share: boolean) => {
  if (!user) {
    toast.error('You must be logged in to share notes');
    throw new Error('User not authenticated');
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

    toast.success(share ? 'Note shared with everyone' : 'Note is now private');
  } catch (error) {
    console.error('Error in shareNoteWithAll:', error);
    throw error;
  }
};

export const likeNote = async (user: User | null, id: string) => {
  if (!user) {
    toast.error('You must be logged in to like notes');
    throw new Error('User not authenticated');
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
    
    toast.success(userLiked ? 'Removed like' : 'Added like');
    
    return { updatedLikes, updatedLikedByNames };
  } catch (error) {
    console.error('Error in likeNote:', error);
    throw error;
  }
};

export const exportNotes = (notes: Note[]) => {
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

export const importNotes = async (user: User | null, notesJson: string) => {
  if (!user) {
    toast.error('You must be logged in to import notes');
    throw new Error('User not authenticated');
  }

  try {
    const importedNotes = JSON.parse(notesJson);
    
    if (!Array.isArray(importedNotes)) {
      toast.error('Invalid notes format');
      throw new Error('Invalid notes format');
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
    
    toast.dismiss(loadingToast);
    toast.success(`Successfully imported ${notesToImport.length} notes`);
    
    if (data) {
      return data.map(note => ({
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
    }
    
    return [];
  } catch (error) {
    console.error('Error importing notes:', error);
    toast.error('Failed to import notes: Invalid format');
    throw error;
  }
};

export const searchNotes = (notes: Note[], query: string): Note[] => {
  if (!query.trim()) return notes;
  
  const lowercaseQuery = query.toLowerCase();
  return notes.filter(note => 
    note.title.toLowerCase().includes(lowercaseQuery) || 
    note.content.toLowerCase().includes(lowercaseQuery) ||
    note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};
