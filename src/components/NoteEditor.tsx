
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Note } from '@/lib/types';
import { useStore } from '@/lib/store';
import { X, Tag, Save } from 'lucide-react';
import { toast } from 'sonner';

interface NoteEditorProps {
  note?: Note;
  onClose: () => void;
  readOnly?: boolean;
}

const NoteEditor = ({ note, onClose, readOnly = false }: NoteEditorProps) => {
  const { createNote, updateNote } = useStore();
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [isSaving, setIsSaving] = useState(false);

  const isNewNote = !note;

  useEffect(() => {
    // Focus the title input when the editor opens
    if (!readOnly) {
      const titleInput = document.getElementById('note-title');
      if (titleInput) {
        titleInput.focus();
      }
    }
  }, [readOnly]);

  const handleAddTag = () => {
    if (!tagInput.trim() || readOnly) return;
    
    const newTag = tagInput.trim().toLowerCase();
    if (!tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (readOnly) return;
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (readOnly) return;
    
    if (!title.trim()) {
      toast.error('Please add a title');
      return;
    }

    setIsSaving(true);

    try {
      if (isNewNote) {
        await createNote({
          title: title.trim(),
          content: content.trim(),
          shared: false,
          sharedWith: [],
          tags,
          likes: [],
          likedByNames: []
        });
        toast.success('Note created');
      } else if (note) {
        await updateNote(note.id, {
          title: title.trim(),
          content: content.trim(),
          tags
        });
        toast.success('Note updated');
      }

      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 300);
    } catch (error) {
      console.error('Save error:', error);
      setIsSaving(false);
      toast.error('Failed to save note');
    }
  };

  return (
    <div className="bg-card/90 backdrop-blur-xl rounded-xl shadow-xl border border-border p-6 animate-fade-in w-full max-w-3xl mx-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-medium text-foreground">
            {isNewNote ? 'Create Note' : readOnly ? 'View Note' : 'Edit Note'}
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Input
              id="note-title"
              placeholder="Title"
              value={title}
              onChange={(e) => readOnly ? null : setTitle(e.target.value)}
              className="text-lg font-medium focus:ring-1 focus:ring-primary border-input"
              readOnly={readOnly}
            />
          </div>

          <div>
            <Textarea
              placeholder="Start writing..."
              value={content}
              onChange={(e) => readOnly ? null : setContent(e.target.value)}
              className="min-h-[200px] focus:ring-1 focus:ring-primary border-input resize-none"
              readOnly={readOnly}
            />
          </div>

          <div>
            {!readOnly && (
              <div className="flex items-center space-x-2">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Tag size={16} />
                  </div>
                  <Input
                    placeholder="Add tags..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 focus:ring-1 focus:ring-primary border-input"
                  />
                </div>
                <Button onClick={handleAddTag} variant="outline">Add</Button>
              </div>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <span 
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary"
                  >
                    {tag}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1.5 text-primary/70 hover:text-primary focus:outline-none"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 space-x-3">
          <Button variant="outline" onClick={onClose}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !title.trim()} 
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
