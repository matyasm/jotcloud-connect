
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import Navbar from "@/components/Navbar";
import NoteCard from "@/components/NoteCard";
import NoteEditor from "@/components/NoteEditor";
import { Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Share2, Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SharedNotes = () => {
  const { sharedNotes, user, likeNote } = useStore();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
  };

  const handleCloseEditor = () => {
    setSelectedNote(null);
  };

  const handleLikeNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    try {
      await likeNote(noteId);
    } catch (error) {
      console.error('Error liking note:', error);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      
      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Shared notes header section */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Shared Notes</h1>
            <p className="text-gray-600">
              {sharedNotes.length} {sharedNotes.length === 1 ? "note" : "notes"} shared
            </p>
          </div>

          {/* Editor overlay or notes grid */}
          {selectedNote ? (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4 overflow-y-auto">
              <div className="w-full max-w-3xl">
                <NoteEditor
                  note={selectedNote}
                  onClose={handleCloseEditor}
                />
              </div>
            </div>
          ) : sharedNotes.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              <AnimatePresence>
                {sharedNotes.map((note) => (
                  <motion.div key={note.id} variants={item} layout>
                    <div className="note-card relative">
                      <NoteCard note={note} onClick={handleNoteClick} />
                      
                      {/* Creator info and like button */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        {note.creatorName && (
                          <div className="text-sm text-gray-600">
                            Created by: <span className="font-medium">{note.creatorName}</span>
                          </div>
                        )}
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button 
                                onClick={(e) => handleLikeNote(note.id, e)}
                                className="flex items-center space-x-1 text-sm text-gray-600"
                              >
                                <Heart 
                                  size={16} 
                                  className={`
                                    ${note.likes?.includes(user?.id || '') 
                                      ? 'fill-red-500 text-red-500' 
                                      : 'text-gray-400'}
                                    transition-colors
                                  `}
                                />
                                <span>{note.likes?.length || 0}</span>
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
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-4">
                <Share2 size={24} />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No shared notes yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                When you share notes with others or others share notes with you, they'll appear here.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SharedNotes;
