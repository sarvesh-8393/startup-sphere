'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';

interface TagSelectorProps {
  availableTags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  availableTags,
  selectedTags,
  onChange,
  placeholder = "Select tags...",
  maxTags
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredTags = availableTags.filter(
    tag => tag.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedTags.includes(tag)
  );

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      if (maxTags !== undefined && selectedTags.length >= maxTags) return;
      onChange([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(selectedTags.filter(t => t !== tag));
  };

  const clearAllTags = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isOpen]);

  const getTagColor = (index: number) => {
    const colors = [
      'bg-blue-500 hover:bg-blue-600',
      'bg-purple-500 hover:bg-purple-600',
      'bg-green-500 hover:bg-green-600',
      'bg-orange-500 hover:bg-orange-600',
      'bg-pink-500 hover:bg-pink-600',
      'bg-indigo-500 hover:bg-indigo-600',
      'bg-red-500 hover:bg-red-600',
      'bg-teal-500 hover:bg-teal-600'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="relative w-full max-w-sm sm:max-w-md" ref={dropdownRef}>
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map((tag, index) => (
            <span
              key={tag}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-sm transition-all duration-200 ${getTagColor(index)} group`}
            >
              <span className="mr-1">{tag}</span>
              <button
                onClick={(e) => removeTag(tag, e)}
                className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5 transition-colors duration-150"
                aria-label={`Remove ${tag} tag`}
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selectedTags.length > 1 && (
            <button
              onClick={clearAllTags}
              className="inline-flex items-center px-2 py-1.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors duration-150"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Main Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border-2 rounded-xl bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-left transition-all duration-200 ${
          isOpen ? 'border-pink-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
        } ${maxTags !== undefined && selectedTags.length >= maxTags ? 'opacity-75 cursor-not-allowed' : ''}`}
        disabled={maxTags !== undefined && selectedTags.length >= maxTags}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex -space-x-1">
              {selectedTags.slice(0, 3).map((_, index) => (
                <div
                  key={index}
                  className={`w-2.5 h-2.5 rounded-full border border-white ${getTagColor(index).split(' ')[0]}`}
                />
              ))}
            </div>
            <span className={selectedTags.length > 0 ? 'font-medium text-gray-900' : 'text-gray-500'}>
              {selectedTags.length > 0
                ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
                : placeholder
              }
            </span>
          </div>
          <div className="flex items-center">
            {isOpen ? (
              <ChevronDownIcon className="h-5 w-5 text-gray-400 rotate-180 transition-transform duration-200" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400 transition-transform duration-200" />
            )}
          </div>
        </div>
        {maxTags && (
          <div className="mt-1 text-xs text-gray-400">
            {selectedTags.length} / {maxTags} tags selected
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-hidden">
          {/* Search Input */}
          <div className="sticky top-0 bg-white border-b border-gray-100 p-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Tag List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredTags.length > 0 ? (
              <div className="p-2">
                {filteredTags.map((tag, index) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    disabled={maxTags !== undefined && selectedTags.length >= maxTags}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg hover:bg-pink-50 transition-colors duration-150 text-left ${
                      maxTags !== undefined && selectedTags.length >= maxTags ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full mr-3 ${getTagColor(index).split(' ')[0]}`} />
                    <span className="text-gray-700 font-medium">{tag}</span>
                    {selectedTags.includes(tag) && (
                      <svg className="ml-auto h-4 w-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">
                {searchTerm ? `No tags found matching "${searchTerm}"` : 'All tags are selected'}
              </div>
            )}
          </div>

          {/* Footer */}
          {availableTags.length > 0 && (
            <div className="sticky bottom-0 bg-gray-50 px-3 py-2 border-t border-gray-100">
              <div className="text-xs text-gray-500 text-center">
                {filteredTags.length} of {availableTags.length} tags available
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagSelector;
