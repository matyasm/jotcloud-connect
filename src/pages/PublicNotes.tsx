
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import Navbar from "@/components/Navbar";
import NoteCard from "@/components/NoteCard";
import NoteEditor from "@/components/NoteEditor";
import { Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Search, X, Tag, Globe } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const PublicNotes = () => {
  const { publicNotes, user, likeNote } = useStore();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Extract all unique tags from notes
  useEffect(() => {
    const tags = publicNotes.reduce((acc: string[], note) => {
      note.tags.forEach(tag => {
        if (!acc.includes(tag)) {
          acc.push(tag);
        }
      });
      return acc;
    }, []);
    
    setAllTags(tags.sort());
  }, [publicNotes]);

  // Filter notes based on search query and tags
  useEffect(() => {
    let filtered = [...publicNotes];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(query) || 
        note.content.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter(note => 
        selectedTags.every(tag => note.tags.includes(tag))
      );
    }
    
    setFilteredNotes(filtered);
  }, [publicNotes, searchQuery, selectedTags]);

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

  const clearSearch = () => {
    setSearchQuery("");
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const clearTagFilters = () => {
    setSelectedTags([]);
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
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Public Notes</h1>
              <p className="text-muted-foreground">
                {filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"} available
              </p>
            </div>
            
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <Tag size={16} className="mr-2" />
                    Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filter by tags</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allTags.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No tags available
                    </div>
                  ) : (
                    <>
                      {allTags.map(tag => (
                        <DropdownMenuCheckboxItem
                          key={tag}
                          checked={selectedTags.includes(tag)}
                          onCheckedChange={() => toggleTagFilter(tag)}
                        >
                          {tag}
                        </DropdownMenuCheckboxItem>
                      ))}
                      {selectedTags.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={clearTagFilters}>
                            Clear filters
                          </DropdownMenuItem>
                        </>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Search size={18} />
              </div>
              <Input
                type="text"
                placeholder="Search public notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedTags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="flex items-center gap-1 pl-2"
                >
                  {tag}
                  <button 
                    onClick={() => toggleTagFilter(tag)}
                    className="ml-1 rounded-full hover:bg-background/20 p-0.5"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearTagFilters} 
                className="h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Editor overlay or notes grid */}
          {selectedNote ? (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center p-4 overflow-y-auto">
              <div className="w-full max-w-3xl">
                <NoteEditor
                  note={selectedNote}
                  onClose={handleCloseEditor}
                  readOnly={true}
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
                    <div className="note-card relative">
                      <NoteCard note={note} onClick={handleNoteClick} />
                      
                      {/* Creator info and like button */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Globe size={14} className="mr-1 text-green-500" />
                          {note.creatorName && (
                            <span>by <span className="font-medium">{note.creatorName}</span></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                <Globe size={24} />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">No public notes found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                There are no public notes available matching your criteria.
              </p>
              {(searchQuery || selectedTags.length > 0) && (
                <div className="flex gap-2 justify-center">
                  {searchQuery && (
                    <Button onClick={clearSearch} variant="outline" className="flex items-center mx-auto">
                      <X size={16} className="mr-2" />
                      Clear Search
                    </Button>
                  )}
                  {selectedTags.length > 0 && (
                    <Button onClick={clearTagFilters} variant="outline" className="flex items-center mx-auto">
                      <X size={16} className="mr-2" />
                      Clear Tag Filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PublicNotes;
