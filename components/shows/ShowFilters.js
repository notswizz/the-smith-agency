import React, { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

export default function ShowFilters({ 
  filters, 
  setFilters, 
  showCount, 
  totalCount,
  seasons,
  locations,
  types,
  clients,
}) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const resetFilters = () => {
    setFilters({
      search: '',
      season: 'all',
      location: 'all',
      type: 'all',
      client: 'all',
      dateRange: 'all', // all, upcoming, past
    });
  };

  const hasActiveFilters = 
    filters.search || 
    filters.season !== 'all' || 
    filters.location !== 'all' ||
    filters.type !== 'all' ||
    filters.client !== 'all' ||
    filters.dateRange !== 'all';

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
            placeholder="Search shows by name, location, or type"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Season Filter */}
            <div>
              <label htmlFor="season" className="block text-sm font-medium text-secondary-700">
                Season
              </label>
              <select
                id="season"
                name="season"
                value={filters.season}
                onChange={(e) => setFilters({ ...filters, season: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="all">All Seasons</option>
                {seasons.map((season) => (
                  <option key={season} value={season}>
                    {season}
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

            {/* Type Filter */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-secondary-700">
                Show Type
              </label>
              <select
                id="type"
                name="type"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="all">All Types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Client Filter */}
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-secondary-700">
                Client
              </label>
              <select
                id="client"
                name="client"
                value={filters.client}
                onChange={(e) => setFilters({ ...filters, client: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="all">All Clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label htmlFor="dateRange" className="block text-sm font-medium text-secondary-700">
                Date Range
              </label>
              <select
                id="dateRange"
                name="dateRange"
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-secondary-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="all">All Dates</option>
                <option value="upcoming">Upcoming Shows</option>
                <option value="past">Past Shows</option>
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
        <span className="font-medium">{totalCount}</span> shows
      </div>
    </div>
  );
} 