
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useStore } from "@/lib/store";
import Navbar from "@/components/Navbar";
import NoteCard from "@/components/NoteCard";
import NoteListItem from "@/components/NoteListItem";
import NoteCondensedCard from "@/components/NoteCondensedCard";
import NoteEditor from "@/components/NoteEditor";
import { Note, NoteSort, ViewMode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { 
  Plus, Filter, LayoutGrid, List, Search, X, 
  Download, Upload, LayoutDashboard, Tag
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Notes = () => {
  const location = useLocation();
  const { notes, exportNotes, importNotes } = useStore();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sortBy, setSortBy] = useState<NoteSort>("recent");
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [importInputRef, setImportInputRef] = useState<HTMLInputElement | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

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

  // Extract all unique tags from notes
  useEffect(() => {
    const tags = notes.reduce((acc: string[], note) => {
      note.tags.forEach(tag => {
        if (!acc.includes(tag)) {
          acc.push(tag);
        }
      });
      return acc;
    }, []);
    
    setAllTags(tags.sort());
  }, [notes]);

  useEffect(() => {
    let sorted = [...notes];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      sorted = sorted.filter(note => 
        note.title.toLowerCase().includes(query) || 
        note.content.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Filter by selected tags if any
    if (selectedTags.length > 0) {
      sorted = sorted.filter(note => 
        selectedTags.every(tag => note.tags.includes(tag))
      );
    }
    
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
  }, [notes, sortBy, searchQuery, selectedTags]);

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

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleImportClick = () => {
    if (importInputRef) {
      importInputRef.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target?.result as string;
        await importNotes(jsonContent);
      } catch (error) {
        console.error('Error reading file:', error);
        toast.error('Failed to read file');
      }
      
      if (e.target) {
        e.target.value = '';
      }
    };
    
    reader.readAsText(file);
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
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">My Notes</h1>
              <p className="text-muted-foreground">
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <Download size={16} className="mr-2" />
                    Export/Import
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Manage Notes</DropdownMenuLabel>
                  <DropdownMenuItem onClick={exportNotes} className="flex items-center">
                    <Download size={16} className="mr-2" />
                    Export Notes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImportClick} className="flex items-center">
                    <Upload size={16} className="mr-2" />
                    Import Notes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button onClick={handleCreateNote} className="flex items-center">
                <Plus size={16} className="mr-2" />
                New Note
              </Button>
              
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={handleFileUpload}
                ref={setImportInputRef}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search size={18} />
              </div>
              <Input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
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
            
            <Tabs defaultValue={viewMode} className="w-[300px]" onValueChange={(value) => setViewMode(value as ViewMode)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="grid" className="flex items-center justify-center">
                  <LayoutGrid size={16} className="mr-2" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="condensed" className="flex items-center justify-center">
                  <LayoutDashboard size={16} className="mr-2" />
                  Condensed
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center justify-center">
                  <List size={16} className="mr-2" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
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
            viewMode === "grid" ? (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={container}
                initial="show"
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
            ) : viewMode === "list" ? (
              <motion.div 
                className="bg-card rounded-lg shadow overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence initial={false}>
                  {filteredNotes.map((note) => (
                    <NoteListItem 
                      key={note.id}
                      note={note}
                      onClick={handleNoteClick}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div 
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
                variants={container}
                initial="show"
                animate="show"
              >
                <AnimatePresence>
                  {filteredNotes.map((note) => (
                    <motion.div key={note.id} variants={item} layout>
                      <NoteCondensedCard note={note} onClick={handleNoteClick} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )
          ) : (
            <motion.div 
              className="text-center py-20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {searchQuery || selectedTags.length > 0 ? (
                <>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No matching notes</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search or filters to find what you're looking for.
                  </p>
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
                </>
              ) : (
                <>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No notes yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first note by clicking the button above.
                  </p>
                  <Button onClick={handleCreateNote} className="flex items-center mx-auto">
                    <Plus size={16} className="mr-2" />
                    New Note
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notes;
