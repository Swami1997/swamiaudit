import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, AlertTriangle } from 'lucide-react';

interface Description {
  unique_id: string;
  description: string;
  impact: string;
  weightage: number | null;
  owner: string;
  business_line: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchResults: Description[];
  onResultClick: (description: Description) => void;
  onSearch: (query: string) => void;
}

export function SearchModal({ isOpen, onClose, searchResults, onResultClick, onSearch }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const handleResultClick = (description: Description) => {
    setSearchQuery('');
    onResultClick(description);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed inset-x-0 top-0 bg-white rounded-b-2xl shadow-xl z-50 max-h-[80vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search descriptions..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                    autoFocus
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-4">
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((result) => (
                    <motion.div
                      key={result.unique_id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleResultClick(result)}
                    >
                      <p className="text-base font-medium text-gray-900 mb-2">
                        {result.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span className="text-gray-600">Impact: {result.impact}</span>
                        </div>
                        <span className="text-blue-600 font-medium">{result.owner}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : searchQuery ? (
                <p className="text-center text-gray-500 py-4 text-base">No matching descriptions found</p>
              ) : (
                <p className="text-center text-gray-500 py-4 text-base">Start typing to search descriptions</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}