
import { Note } from '@/lib/types';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { Share2, Trash, Edit, Clock, User, Globe, Lock, Heart } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
}

const NoteCard = ({ note, onClick }: NoteCardProps) => {
  const { deleteNote, shareNote, shareNoteWithAll, user, likeNote } = useStore();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublic, setIsPublic] = useState(note.sharedWith.includes('*'));
  const isLiked = note.likes?.includes(user?.id || '') || false;

  const handleShare = async () => {
    if (!shareEmail.trim()) return;
    
    setIsProcessing(true);
    try {
      await shareNote(note.id, [shareEmail]);
      toast.success(`Note shared with ${shareEmail}`);
      setShareEmail('');
      setIsShareDialogOpen(false);
    } catch (error) {
      console.error('Error sharing note:', error);
      toast.error('Failed to share note');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePublic = async () => {
    const newPublicState = !isPublic;
    setIsProcessing(true);
    try {
      await shareNoteWithAll(note.id, newPublicState);
      setIsPublic(newPublicState);
    } catch (error) {
      console.error('Error toggling public visibility:', error);
      toast.error('Failed to update note visibility');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
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
    if (!user) return;
    
    try {
      await likeNote(note.id);
    } catch (error) {
      console.error('Error liking note:', error);
    }
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
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
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
          
          {note.shared && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleLike}
                    className="flex items-center"
                  >
                    <Heart 
                      size={12} 
                      className={`
                        ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                        transition-colors
                      `}
                    />
                    <span className="ml-1">{note.likes?.length || 0}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {note.likes?.length ? (
                    <p className="text-xs">
                      Liked by: {note.likedByNames?.join(', ') || 'No one yet'}
                    </p>
                  ) : (
                    <p className="text-xs">Be the first to like this note</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
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
              Share this note with specific users or make it public for everyone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="public-toggle" className="font-medium">Make note public</Label>
                <p className="text-sm text-gray-500">Anyone can view this note</p>
              </div>
              <Switch 
                id="public-toggle" 
                checked={isPublic}
                onCheckedChange={handleTogglePublic}
                disabled={isProcessing}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or share with specific people</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Email address"
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
              <Button onClick={handleShare} disabled={isProcessing || !shareEmail.trim()}>
                Share
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default NoteCard;
