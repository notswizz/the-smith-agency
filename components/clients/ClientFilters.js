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
            placeholder="Search clients by name, contact, or location"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Category Filter */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-secondary-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
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
              <label htmlFor="location" className="block text-sm font-medium text-secondary-700">
                Location
              </label>
              <select
                id="location"
                name="location"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
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
        <span className="font-medium">{totalCount}</span> clients
      </div>
    </div>
  );
} 