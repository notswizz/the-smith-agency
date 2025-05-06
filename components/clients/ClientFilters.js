import React, { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

export default function ClientFilters({ 
  filters, 
  setFilters, 
  showCount, 
  totalCount,
  categories,
  locations
}) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const resetFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      location: 'all',
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.category !== 'all' || 
    filters.location !== 'all';

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
            placeholder="Search clients by name, contact, or location"
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
          <span className="font-medium">{showCount}</span>/<span className="font-medium">{totalCount}</span> clients
        </div>
      </div>

      {/* Filter options */}
      {isFiltersOpen && (
        <div className="mt-3 pt-3 border-t border-secondary-100">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Category Filter */}
            <div>
              <label htmlFor="category" className="block text-xs font-medium text-secondary-700 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="block w-full pl-3 pr-8 py-1.5 text-sm border-secondary-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label htmlFor="location" className="block text-xs font-medium text-secondary-700 mb-1">
                Location
              </label>
              <select
                id="location"
                name="location"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="block w-full pl-3 pr-8 py-1.5 text-sm border-secondary-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md"
              >
                <option value="all">All Locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
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
        <span className="font-medium">{showCount}</span>/<span className="font-medium">{totalCount}</span> clients
      </div>
    </div>
  );
} 