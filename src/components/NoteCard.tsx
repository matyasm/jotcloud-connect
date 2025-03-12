
import { Note } from '@/lib/types';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { Share2, Trash, Edit, Clock, User } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
}

const NoteCard = ({ note, onClick }: NoteCardProps) => {
  const { deleteNote, shareNote } = useStore();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleShare = () => {
    if (!shareEmail.trim()) return;
    
    shareNote(note.id, [shareEmail]);
    toast.success(`Note shared with ${shareEmail}`);
    setShareEmail('');
    setIsShareDialogOpen(false);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    // Simulate delay for animation
    setTimeout(() => {
      deleteNote(note.id);
      toast.success('Note deleted');
    }, 200);
  };

  if (isDeleting) {
    return (
      <motion.div 
        className="note-card opacity-50"
        initial={{ opacity: 1, height: 'auto' }}
        animate={{ opacity: 0, height: 0, overflow: 'hidden', margin: 0, padding: 0 }}
        transition={{ duration: 0.3 }}
      />
    );
  }

  return (
    <motion.div 
      className="note-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-1">{note.title}</h3>
        <div className="flex space-x-1">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onClick(note);
            }}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors duration-150"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              setIsShareDialogOpen(true);
            }}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors duration-150"
          >
            <Share2 size={16} />
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              handleDelete();
            }}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors duration-150"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>
      
      <div 
        className="text-sm text-gray-600 mb-3 line-clamp-3 cursor-pointer"
        onClick={() => onClick(note)}
      >
        {note.content}
      </div>
      
      <div className="flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center">
          <Clock size={12} className="mr-1" />
          {format(new Date(note.updatedAt), 'MMM d, yyyy')}
        </div>
        
        {note.shared && (
          <div className="flex items-center">
            <User size={12} className="mr-1" />
            {note.sharedWith.length} {note.sharedWith.length === 1 ? 'person' : 'people'}
          </div>
        )}
      </div>
      
      {note.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
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

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share note</DialogTitle>
            <DialogDescription>
              Enter the email address of the person you want to share this note with.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 py-4">
            <Input
              placeholder="Email address"
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare}>Share</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default NoteCard;
