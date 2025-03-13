
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
}

const NoteEditor = ({ note, onClose }: NoteEditorProps) => {
  const { createNote, updateNote } = useStore();
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [isSaving, setIsSaving] = useState(false);

  const isNewNote = !note;

  useEffect(() => {
    // Focus the title input when the editor opens
    const titleInput = document.getElementById('note-title');
    if (titleInput) {
      titleInput.focus();
    }
  }, []);

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    const newTag = tagInput.trim().toLowerCase();
    if (!tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
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
          tags
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
    <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-gray-100 p-6 animate-fade-in w-full max-w-3xl mx-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-medium text-gray-900">
            {isNewNote ? 'Create Note' : 'Edit Note'}
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
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
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium focus:ring-1 focus:ring-blue-400 border-gray-200"
            />
          </div>

          <div>
            <Textarea
              placeholder="Start writing..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] focus:ring-1 focus:ring-blue-400 border-gray-200 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Tag size={16} />
                </div>
                <Input
                  placeholder="Add tags..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 focus:ring-1 focus:ring-blue-400 border-gray-200"
                />
              </div>
              <Button onClick={handleAddTag} variant="outline">Add</Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <span 
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1.5 text-blue-600 hover:text-blue-800 focus:outline-none"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !title.trim()} 
            className="flex items-center gap-2"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
