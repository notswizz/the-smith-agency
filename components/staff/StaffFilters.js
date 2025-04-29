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
    <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
      {/* Search bar */}
      <div className="flex items-center mb-4">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            name="search"
            id="search"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="block w-full pl-10 pr-3 py-2 border border-secondary-200 rounded-md leading-5 bg-white placeholder-secondary-500 focus:outline-none focus:placeholder-secondary-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Search staff by name, email, or phone"
          />
        </div>
        <div className="ml-4 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Active
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Filter options */}
      {isFiltersOpen && (
        <div className="mt-4 border-t border-secondary-200 pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Experience Filter */}
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-secondary-700">
                Experience Level
              </label>
              <select
                id="experience"
                name="experience"
                value={filters.experience}
                onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
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
              <label htmlFor="show" className="block text-sm font-medium text-secondary-700">
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
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
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
              <label htmlFor="date" className="block text-sm font-medium text-secondary-700">
                Available On Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={filters.availabilityDate}
                onChange={(e) => setFilters({ ...filters, availabilityDate: e.target.value })}
                disabled={!filters.showId}
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md ${
                  !filters.showId ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* Reset button */}
            <div className="flex items-end">
              <Button 
                variant="secondary" 
                onClick={resetFilters} 
                disabled={!hasActiveFilters}
                className="w-full flex items-center justify-center"
              >
                <XMarkIcon className="h-5 w-5 mr-2" />
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="mt-4 text-sm text-secondary-500">
        Showing <span className="font-medium">{showCount}</span> of{' '}
        <span className="font-medium">{totalCount}</span> staff members
      </div>
    </div>
  );
} 