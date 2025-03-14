
import { Note } from '@/lib/types';
import { format } from 'date-fns';
import { Edit, Share2, Trash, Clock, User, Globe, Lock } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface NoteListItemProps {
  note: Note;
  onClick: (note: Note) => void;
}

const NoteListItem = ({ note, onClick }: NoteListItemProps) => {
  const { deleteNote } = useStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const isPublic = note.sharedWith.includes('*');

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await deleteNote(note.id);
      toast.success('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      setIsDeleting(false);
      toast.error('Failed to delete note');
    }
  };

  if (isDeleting) {
    return (
      <motion.div 
        initial={{ opacity: 1, height: 'auto' }}
        animate={{ opacity: 0, height: 0, overflow: 'hidden' }}
        transition={{ duration: 0.3 }}
        className="border-b border-gray-100"
      />
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
      onClick={() => onClick(note)}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0 mr-4">
          <h3 className="text-base font-medium text-gray-900 truncate">{note.title}</h3>
          <p className="text-sm text-gray-600 truncate mt-1">{note.content}</p>
          
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center text-xs text-gray-500">
              <Clock size={12} className="mr-1" />
              {format(new Date(note.updatedAt), 'MMM d, yyyy')}
            </div>
            
            <div className="flex items-center text-xs text-gray-500">
              {isPublic ? (
                <>
                  <Globe size={12} className="mr-1 text-green-500" />
                  <span className="text-green-500">Public</span>
                </>
              ) : note.shared ? (
                <>
                  <User size={12} className="mr-1" />
                  {note.sharedWith.length} {note.sharedWith.length === 1 ? 'person' : 'people'}
                </>
              ) : (
                <>
                  <Lock size={12} className="mr-1" />
                  <span>Private</span>
                </>
              )}
            </div>
            
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-1">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onClick(note);
            }}
            className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-blue-600 transition-colors duration-150"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={handleDelete}
            className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-red-600 transition-colors duration-150"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default NoteListItem;
