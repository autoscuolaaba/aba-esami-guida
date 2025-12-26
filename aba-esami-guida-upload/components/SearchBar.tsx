import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { SessionMap, StudentStatus } from '../types';
import { formatDateIT } from '../utils';

interface SearchBarProps {
  sessions: SessionMap;
  onSelectDate: (date: Date) => void;
}

interface SearchResult {
  studentName: string;
  status: StudentStatus;
  date: Date;
  dateKey: string;
  turn: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ sessions, onSelectDate }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Search logic
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const searchTerm = debouncedQuery.toLowerCase().trim();
    const foundResults: SearchResult[] = [];

    Object.entries(sessions).forEach(([dateKey, session]) => {
      session.students.forEach((student) => {
        if (student.name.toLowerCase().includes(searchTerm)) {
          const [year, month, day] = dateKey.split('-').map(Number);
          const date = new Date(year, month - 1, day);

          let turnLabel = 'Non definito';
          if (session.turn === 'MATTINA') turnLabel = 'Mattina';
          else if (session.turn === 'POMERIGGIO') turnLabel = 'Pomeriggio';

          foundResults.push({
            studentName: student.name,
            status: student.status,
            date,
            dateKey,
            turn: turnLabel,
          });
        }
      });
    });

    // Sort by date descending (most recent first)
    foundResults.sort((a, b) => b.date.getTime() - a.date.getTime());

    setResults(foundResults);
  }, [debouncedQuery, sessions]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResultClick = useCallback((result: SearchResult) => {
    onSelectDate(result.date);
    setIsOpen(false);
    setQuery('');
  }, [onSelectDate]);

  const handleInputFocus = () => {
    if (query.trim()) {
      setIsOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getStatusBadge = (status: StudentStatus) => {
    const baseClasses = 'px-2 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'SCHEDULED':
        return <span className={`${baseClasses} bg-blue-100 text-blue-700`}>Prenotato</span>;
      case 'PASSED':
        return <span className={`${baseClasses} bg-green-100 text-green-700`}>Promosso</span>;
      case 'FAILED':
        return <span className={`${baseClasses} bg-red-100 text-red-700`}>Bocciato</span>;
      default:
        return null;
    }
  };

  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="Cerca allievo..."
          className="w-full bg-gray-50 border-transparent rounded-xl pl-11 pr-10 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-4 right-4 top-full mt-2 bg-white shadow-lg rounded-xl max-h-64 overflow-y-auto z-50 border border-gray-100">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">
              Nessun allievo trovato
            </div>
          ) : (
            <ul>
              {results.map((result, index) => (
                <li
                  key={`${result.dateKey}-${result.studentName}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{result.studentName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDateIT(result.date)} &middot; {result.turn}
                      </p>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
