
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useStore } from "@/lib/store";
import Navbar from "@/components/Navbar";
import NoteCard from "@/components/NoteCard";
import NoteEditor from "@/components/NoteEditor";
import { Note, NoteSort } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";

const Notes = () => {
  const location = useLocation();
  const { notes } = useStore();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sortBy, setSortBy] = useState<NoteSort>("recent");
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);

  // Get the note ID from the URL if present
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const noteId = searchParams.get("id");
    
    if (noteId) {
      const foundNote = notes.find(note => note.id === noteId);
      if (foundNote) {
        setSelectedNote(foundNote);
      }
    }
  }, [location.search, notes]);

  // Sort and filter notes
  useEffect(() => {
    let sorted = [...notes];
    
    switch (sortBy) {
      case "recent":
        sorted = sorted.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        break;
      case "title":
        sorted = sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "created":
        sorted = sorted.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }
    
    setFilteredNotes(sorted);
  }, [notes, sortBy]);

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setIsCreating(false);
  };

  const handleCreateNote = () => {
    setSelectedNote(null);
    setIsCreating(true);
  };

  const handleCloseEditor = () => {
    setSelectedNote(null);
    setIsCreating(false);
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
          {/* Notes header section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">My Notes</h1>
              <p className="text-gray-600">
                {filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}
              </p>
            </div>
            
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <Filter size={16} className="mr-2" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setSortBy("recent")}>
                    Recently Updated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("title")}>
                    Title
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("created")}>
                    Recently Created
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button onClick={handleCreateNote} className="flex items-center">
                <Plus size={16} className="mr-2" />
                New Note
              </Button>
            </div>
          </div>

          {/* Editor overlay or notes grid */}
          {isCreating || selectedNote ? (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4 overflow-y-auto">
              <div className="w-full max-w-3xl">
                <NoteEditor
                  note={selectedNote || undefined}
                  onClose={handleCloseEditor}
                />
              </div>
            </div>
          ) : filteredNotes.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              <AnimatePresence>
                {filteredNotes.map((note) => (
                  <motion.div key={note.id} variants={item} layout>
                    <NoteCard note={note} onClick={handleNoteClick} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-xl font-medium text-gray-900 mb-2">No notes yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first note by clicking the button above.
              </p>
              <Button onClick={handleCreateNote} className="flex items-center mx-auto">
                <Plus size={16} className="mr-2" />
                New Note
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notes;
