'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ChevronDownIcon, AdjustmentsHorizontalIcon, TagIcon, MapPinIcon, BuildingOfficeIcon } from '@heroicons/react/24/solid';
import TagSelector from './TagSelector';

interface Props {
  query: string;
}

const AllStartup: React.FC<Props> = ({ query }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const router = useRouter();
  const params = useSearchParams();

  const current = useMemo(() => new URLSearchParams(params?.toString()), [params]);

  useEffect(() => {
    const fetchTags = async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data, error } = await supabase
        .from('startups')
        .select('tags');
      if (error) {
        console.error('Error fetching tags:', error);
        return;
      }
      const uniqueTags = Array.from(new Set(data.flatMap(startup => startup.tags || [])));
      setAvailableTags(uniqueTags);
    };
    fetchTags();
  }, []);

  useEffect(() => {
    const tagsFromUrl = current.get('tags')?.split(',').filter(Boolean) || [];
    setSelectedTags(tagsFromUrl);
  }, [current]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(current);
    if (value) next.set(key, value);
    else next.delete(key);
    // always include existing search query
    if (query) next.set('query', query);
    router.replace('/?' + next.toString());
  };

  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    updateParam('tags', tags.join(','));
  };

  return (
    <div className="w-full px-4 sm:px-6 py-5 pb-8">
  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
    <div className="text-2xl sm:text-3xl font-bold text-pink-600 mb-3 lg:mb-0">
      {query ? `Search results for "${query}"` : 'All Startups'}
    </div>
    <div className="flex flex-wrap gap-3">
      {/* Filters Button */}
      <button
        onClick={() => {
          setShowFilters(!showFilters);
          setShowSort(false);
        }}
        className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md text-sm font-medium ${
          showFilters 
            ? 'bg-pink-600 text-white shadow-lg transform scale-105' 
            : 'bg-white text-pink-600 border-2 border-pink-200 hover:bg-pink-50 hover:border-pink-300'
        }`}
      >
        <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
        Filters
        {selectedTags.length > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-pink-500 text-white text-xs rounded-full">
            {selectedTags.length}
          </span>
        )}
        <span className={`ml-2 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}>
          <ChevronDownIcon className="h-4 w-4" />
        </span>
      </button>

      {/* Sort Button */}
      <button
        onClick={() => {
          setShowSort(!showSort);
          setShowFilters(false);
        }}
        className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md text-sm font-medium ${
          showSort 
            ? 'bg-yellow-600 text-white shadow-lg transform scale-105' 
            : 'bg-white text-yellow-600 border-2 border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300'
        }`}
      >
        <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-yellow-500" />
        Sort
        {current.get('sort') && (
          <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
            1
          </span>
        )}
        <span className={`ml-2 transition-transform duration-200 ${showSort ? 'rotate-180' : ''}`}>
          <ChevronDownIcon className="h-4 w-4" />
        </span>
      </button>
    </div>
  </div>

  {/* Filters Panel */}
  {showFilters && (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 px-2 lg:px-0">
      {/* Tags Filter */}
      <div className="flex flex-col">
        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
          <TagIcon className="h-4 w-4 mr-1 text-pink-500" />
          Tags
        </label>
        <TagSelector
          availableTags={availableTags}
          selectedTags={selectedTags}
          onChange={handleTagsChange}
          placeholder="Select startup tags..."
          maxTags={10}
        />
      </div>

      {/* Stage Filter */}
      <div className="flex flex-col">
        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
          <BuildingOfficeIcon className="h-4 w-4 mr-1 text-pink-500" />
          Stage
        </label>
        <select
          className="border border-gray-300 px-3 py-2 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          defaultValue={current.get('stage') || ''}
          onChange={(e) => updateParam('stage', e.target.value)}
        >
          <option value="">Any Stage</option>
          <option value="Pre-Seed">Pre-Seed</option>
          <option value="Seed">Seed</option>
          <option value="Series A">Series A</option>
          <option value="Growth">Growth</option>
        </select>
      </div>

      {/* Location Filter */}
      <div className="flex flex-col">
        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
          <MapPinIcon className="h-4 w-4 mr-1 text-pink-500" />
          Location
        </label>
        <input
          className="border border-gray-300 px-3 py-2 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter location"
          defaultValue={current.get('location') || ''}
          onBlur={(e) => updateParam('location', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              updateParam('location', e.currentTarget.value);
            }
          }}
        />
      </div>
    </div>
  )}

  {/* Sort Panel */}
  {showSort && (
    <div className="flex flex-col items-start lg:items-end mt-4 px-2 lg:px-0">
      <label className="text-sm font-medium text-gray-700 mb-2">Sort by:</label>
      <select
        className="border border-gray-300 px-3 py-2 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
        defaultValue={current.get('sort') || ''}
        onChange={(e) => updateParam('sort', e.target.value)}
      >
        <option value="">Recommended</option>
        <option value="date_desc">Newest</option>
        <option value="date_asc">Oldest</option>
        <option value="likes_desc">Likes ↓</option>
        <option value="likes_asc">Likes ↑</option>
        <option value="views_desc">Views ↓</option>
        <option value="views_asc">Views ↑</option>
      </select>
    </div>
  )}
</div>

   
  );
};

export default AllStartup;