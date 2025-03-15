
import { Note } from '@/lib/types';
import { format } from 'date-fns';
import { Edit, Share2, Trash, Clock, User, Globe, Lock, Heart } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NoteListItemProps {
  note: Note;
  onClick: (note: Note) => void;
}

const NoteListItem = ({ note, onClick }: NoteListItemProps) => {
  const { deleteNote, likeNote, user } = useStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const isPublic = note.sharedWith.includes('*');
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

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await likeNote(note.id);
    } catch (error) {
      console.error('Error liking note:', error);
      toast.error('Failed to like note');
    }
  };

  if (isDeleting) {
    return (
      <motion.div 
        initial={{ opacity: 1, height: 'auto' }}
        animate={{ opacity: 0, height: 0, overflow: 'hidden' }}
        transition={{ duration: 0.3 }}
        className="border-b border-border"
      />
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-2 px-4 border-b border-border hover:bg-accent/50 transition-colors duration-200 cursor-pointer"
      onClick={() => onClick(note)}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0 mr-4">
          <h3 className="text-base font-medium text-foreground truncate">{note.title}</h3>
          <p className="text-sm text-muted-foreground truncate">{note.content}</p>
          
          <div className="flex items-center space-x-4 mt-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock size={12} className="mr-1" />
              {format(new Date(note.updatedAt), 'MMM d, yyyy')}
            </div>
            
            <div className="flex items-center text-xs text-muted-foreground">
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
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={handleLike}
                  className="p-1 rounded-full hover:bg-accent text-muted-foreground transition-colors duration-150"
                >
                  <Heart 
                    size={16} 
                    className={`${isLiked ? 'fill-red-500 text-red-500' : ''}`} 
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {isLiked ? 'Unlike' : 'Like'} this note
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onClick(note);
            }}
            className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-primary transition-colors duration-150"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={handleDelete}
            className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-destructive transition-colors duration-150"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default NoteListItem;
