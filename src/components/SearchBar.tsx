
import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Note } from '@/lib/types';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onClose?: () => void;
}

const SearchBar = ({ onClose }: SearchBarProps) => {
  const { searchNotes } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Focus input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (query.trim()) {
      const foundResults = searchNotes(query);
      setResults(foundResults);
    } else {
      setResults([]);
    }
  }, [query, searchNotes]);

  const handleSelect = (noteId: string) => {
    navigate(`/notes?id=${noteId}`);
    setQuery('');
    if (onClose) onClose();
  };

  return (
    <div className="w-full">
      <div className={`relative rounded-lg glass-panel transition-all duration-300 ${isFocused ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Search size={18} />
        </div>

        <input
          ref={inputRef}
          type="text"
          placeholder="Search notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="block w-full pl-10 pr-10 py-3 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900"
        />

        {query && (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-2 rounded-lg overflow-hidden shadow-lg bg-white/90 backdrop-blur-sm border border-gray-100 animate-fade-in max-h-[60vh] overflow-y-auto">
          <ul className="divide-y divide-gray-100">
            {results.map((note) => (
              <li
                key={note.id}
                onClick={() => handleSelect(note.id)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
              >
                <h3 className="text-sm font-medium text-gray-900 truncate">{note.title}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{note.content}</p>
                {note.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
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
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
