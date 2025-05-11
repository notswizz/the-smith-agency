import React from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function StaffFilters({ 
  filters, 
  setFilters, 
  showCount,
  totalCount
}) {
  // Function to clear search
  const clearSearch = () => {
    setFilters({ ...filters, search: '' });
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-3 border border-pink-50 transition-all duration-300 hover:shadow-md">
      {/* Search bar only with enhanced styling */}
      <div className="flex items-center gap-2">
        <div className="relative flex-grow group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-pink-400 group-hover:text-pink-500 transition-colors duration-200" aria-hidden="true" />
          </div>
          <input
            type="text"
            name="search"
            id="search"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="block w-full pl-9 pr-10 py-2 border border-secondary-200 rounded-lg bg-white/50 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm transition-all duration-200"
            placeholder="Search staff by name..."
          />
          {filters.search && (
            <button 
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-pink-500 transition-colors duration-200"
            >
              <XMarkIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Simple staff count badge */}
        <div className="flex-shrink-0 bg-pink-100 text-pink-600 text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
          <span className="font-bold">{showCount}</span>
        </div>
      </div>
    </div>
  );
} 