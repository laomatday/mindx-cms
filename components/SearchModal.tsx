
import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { Search, X, Book, FileText, LoaderCircle, ServerCrash } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { UI_STRINGS } from '../constants';
import { SearchResult, LearningPath, Document, Course } from '../types';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface SearchModalProps {
  onClose: () => void;
}

/**
 * Component HighlightedText dùng để làm nổi bật (highlight) một phần của chuỗi văn bản
 * khớp với từ khóa tìm kiếm.
 */
const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim() || !text) {
        return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <strong key={i} className="font-bold text-[#E31F26] bg-red-100/50 dark:bg-red-900/50 rounded-sm">
                        {part}
                    </strong>
                ) : (
                    part
                )
            )}
        </span>
    );
};


export const SearchModal: React.FC<SearchModalProps> = ({ onClose }) => {
  useBodyScrollLock();
  const context = useContext(AppContext);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const performSearch = useCallback((searchTerm: string) => {
    if (!context || searchTerm.trim().length < 2) {
        setResults([]);
        setIsSearching(false);
        setError(null);
        return;
    }
    
    setIsSearching(true);
    setError(null);

    try {
        const { data: allPaths } = context;
        const lowerCaseQuery = searchTerm.toLowerCase();
        const foundResults: SearchResult[] = [];

        allPaths.forEach((path: LearningPath) => {
            path.courses.forEach((course: Course) => {
                if (course.name.toLowerCase().includes(lowerCaseQuery)) {
                    foundResults.push({
                        id: course.id,
                        type: 'course',
                        name: course.name,
                        context: `${path.name}`,
                        pathId: path.id,
                        courseId: course.id,
                    });
                }

                const searchDocs = (docs: Document[], contextStr: string, currentCourseId: string, currentLevelId?: string) => {
                    docs.forEach((doc: Document) => {
                        const docName = doc.name || "";
                        if (docName.toLowerCase().includes(lowerCaseQuery)) {
                            foundResults.push({
                                id: doc.id,
                                type: 'document',
                                name: docName,
                                context: contextStr,
                                pathId: path.id,
                                courseId: currentCourseId,
                                url: doc.url,
                            });
                        }
                    });
                };
                
                searchDocs(course.documents, `${path.name} > ${course.name}`, course.id);
                
                course.levels.forEach(level => {
                    searchDocs(level.documents, `${path.name} > ${course.name} > ${level.name}`, course.id, level.id);
                });
            });
            
            path.documents.forEach((doc: Document) => {
                 const docName = doc.name || "";
                 if (docName.toLowerCase().includes(lowerCaseQuery)) {
                    foundResults.push({
                        id: doc.id,
                        type: 'document',
                        name: docName,
                        context: path.name,
                        pathId: path.id,
                        url: doc.url,
                    });
                }
            });
        });
        
        setResults(foundResults);
    } catch(e) {
        console.error("Search failed", e);
        setError(UI_STRINGS.searchError);
    } finally {
        setIsSearching(false);
    }
  }, [context]);

  useEffect(() => {
      if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
      }
      debounceTimeout.current = setTimeout(() => {
          performSearch(query);
      }, 300);
      
      return () => {
          if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      };
  }, [query, performSearch]);

  const handleResultClick = (result: SearchResult) => {
    if (!context) return;
    if (result.type === 'course' && result.courseId) {
        context.navigate(result.pathId, result.courseId);
    } else if (result.type === 'document' && result.url) {
        window.open(result.url, '_blank');
    }
    onClose();
  };

  const renderContent = () => {
      if (isSearching) {
          return (
              <div className="text-center p-8 flex flex-col items-center justify-center gap-4">
                  <LoaderCircle className="animate-spin" size={32} />
                  <p className="font-medium">{UI_STRINGS.searching}</p>
              </div>
          );
      }
      if (error) {
           return (
              <div className="text-center p-8 flex flex-col items-center justify-center gap-4 text-red-500">
                  <ServerCrash size={32} />
                  <p className="font-medium">{error}</p>
              </div>
          );
      }
      if (query.length > 1 && results.length === 0) {
           return (
              <div className="text-center p-8 flex flex-col items-center justify-center gap-4">
                  <p className="font-medium">{UI_STRINGS.noResults}</p>
              </div>
          );
      }
      if (results.length > 0) {
          return (
              <ul className="divide-y divide-black/5 dark:divide-white/10">
                  {results.map(result => (
                      <li key={`${result.type}-${result.id}`}>
                          <button onClick={() => handleResultClick(result)} className="w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-150 flex items-start gap-4">
                              <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg mt-1">
                                  {result.type === 'course' ? <Book size={20} /> : <FileText size={20} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="font-semibold truncate">
                                      <HighlightedText text={result.name} highlight={query} />
                                  </p>
                                  <p className="text-sm opacity-70 truncate">
                                      <HighlightedText text={result.context} highlight={query} />
                                  </p>
                              </div>
                          </button>
                      </li>
                  ))}
              </ul>
          );
      }
      return (
        <div className="text-center p-8">
            <p className="opacity-70">{UI_STRINGS.searchPlaceholder}</p>
        </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-start justify-center z-50 animate-fade-in" onMouseDown={onClose}>
        <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-xl mt-20 mx-4 mb-4 relative animate-fade-in-up flex flex-col overflow-hidden max-h-[65vh]" 
            onMouseDown={e => e.stopPropagation()}
        >
            <div className="p-4 border-b border-black/5 dark:border-white/10 flex items-center gap-4">
                <Search size={22} className="flex-shrink-0 opacity-60" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={UI_STRINGS.searchPlaceholder}
                    className="w-full bg-transparent outline-none border-none p-0 text-lg placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
                <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full"
                    aria-label="Close search"
                >
                    <X size={24} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {renderContent()}
            </div>
        </div>
    </div>
  );
};
