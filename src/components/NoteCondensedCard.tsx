
import { Note } from '@/lib/types';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { Edit, Trash, Clock, Heart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NoteCondensedCardProps {
  note: Note;
  onClick: (note: Note) => void;
}

const NoteCondensedCard = ({ note, onClick }: NoteCondensedCardProps) => {
  const { deleteNote, user } = useStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const isLiked = note.likes?.includes(user?.id || '') || false;

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
        className="opacity-50"
        initial={{ opacity: 1, height: 'auto' }}
        animate={{ opacity: 0, height: 0, overflow: 'hidden', margin: 0, padding: 0 }}
        transition={{ duration: 0.3 }}
      />
    );
  }

  return (
    <motion.div 
      className="bg-white border border-gray-200 rounded-md p-2 shadow-sm hover:shadow-md transition-all duration-200 h-32 overflow-hidden flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => onClick(note)}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-sm font-medium text-gray-900 truncate pr-2">{note.title}</h3>
        <div className="flex space-x-1">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onClick(note);
            }}
            className="p-0.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors duration-150"
          >
            <Edit size={12} />
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              handleDelete();
            }}
            className="p-0.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors duration-150"
          >
            <Trash size={12} />
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray-600 line-clamp-3 flex-grow cursor-pointer">
        {note.content}
      </div>
      
      <div className="flex justify-between items-center mt-1 text-[10px] text-gray-500">
        <div className="flex items-center">
          <Clock size={10} className="mr-1" />
          {format(new Date(note.updatedAt), 'MMM d')}
        </div>
        
        {note.creatorName && note.shared && (
          <div className="flex items-center gap-1">
            <span className="truncate max-w-16">{note.creatorName}</span>
            {(note.likes?.length || 0) > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <Heart size={10} className={`${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                      <span className="ml-0.5">{note.likes?.length || 0}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      Liked by: {note.likedByNames?.join(', ') || 'No one yet'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
        
        {note.tags.length > 0 && note.tags.length <= 2 && (
          <div className="flex flex-wrap gap-0.5">
            {note.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-1 rounded text-[10px] font-medium bg-blue-100 text-blue-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NoteCondensedCard;
