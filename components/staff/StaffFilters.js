import React, { useState } from 'react';
import useStore from '@/lib/hooks/useStore';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

export default function StaffFilters({ 
  filters, 
  setFilters, 
  showCount,
  totalCount
}) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { shows } = useStore();

  const experienceOptions = [
    { value: 'all', label: 'All Experience Levels' },
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
  ];

  const resetFilters = () => {
    setFilters({
      search: '',
      experience: 'all',
      showId: '',
      availabilityDate: '',
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.experience !== 'all' || 
    filters.showId || 
    filters.availabilityDate;

  return (
    <div className="bg-white shadow-sm rounded-lg p-3">
      {/* Search and filter bar - combined into a single row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-secondary-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            name="search"
            id="search"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="block w-full pl-8 pr-3 py-1.5 border border-secondary-200 rounded-md bg-white placeholder-secondary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
            placeholder="Search staff by name, email, or phone"
          />
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="flex-shrink-0 flex items-center h-9"
        >
          <FunnelIcon className="h-4 w-4 mr-1" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-2xs font-medium bg-primary-100 text-primary-800">
              Active
            </span>
          )}
        </Button>

        <div className="flex-shrink-0 text-2xs text-secondary-500 hidden sm:block">
          <span className="font-medium">{showCount}</span>/<span className="font-medium">{totalCount}</span> staff members
        </div>
      </div>

      {/* Filter options */}
      {isFiltersOpen && (
        <div className="mt-3 pt-3 border-t border-secondary-100">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Experience Filter */}
            <div>
              <label htmlFor="experience" className="block text-xs font-medium text-secondary-700 mb-1">
                Experience Level
              </label>
              <select
                id="experience"
                name="experience"
                value={filters.experience}
                onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
                className="block w-full pl-3 pr-8 py-1.5 text-sm border-secondary-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
              >
                {experienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Show Filter */}
            <div>
              <label htmlFor="show" className="block text-xs font-medium text-secondary-700 mb-1">
                Show
              </label>
              <select
                id="show"
                name="show"
                value={filters.showId}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  showId: e.target.value,
                  availabilityDate: e.target.value ? filters.availabilityDate : '' 
                })}
                className="block w-full pl-3 pr-8 py-1.5 text-sm border-secondary-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
              >
                <option value="">All Shows</option>
                {shows.map((show) => (
                  <option key={show.id} value={show.id}>
                    {show.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter (only available if a show is selected) */}
            <div>
              <label htmlFor="date" className="block text-xs font-medium text-secondary-700 mb-1">
                Available On Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={filters.availabilityDate}
                onChange={(e) => setFilters({ ...filters, availabilityDate: e.target.value })}
                disabled={!filters.showId}
                className={`block w-full pl-3 pr-8 py-1.5 text-sm border-secondary-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md ${
                  !filters.showId ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* Reset button */}
            <div className="flex items-end">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={resetFilters} 
                disabled={!hasActiveFilters}
                className="w-full flex items-center justify-center py-1.5"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile results count */}
      <div className="mt-2 text-2xs text-secondary-500 sm:hidden">
        <span className="font-medium">{showCount}</span>/<span className="font-medium">{totalCount}</span> staff members
      </div>
    </div>
  );
} 