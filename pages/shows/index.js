import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '@/components/ui/DashboardLayout';
import ShowList from '@/components/shows/ShowList';
import ShowFilters from '@/components/shows/ShowFilters';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { 
  searchShows, 
  filterShowsBySeason, 
  filterShowsByLocation 
} from '@/utils/filterUtils';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function ShowsDirectory() {
  const { shows, clients } = useStore();
  const [filters, setFilters] = useState({
    search: '',
    season: 'all',
    location: 'all',
    type: 'all',
    client: 'all',
    dateRange: 'all',
  });

  // Get unique seasons, locations, and types for filters
  const seasons = useMemo(() => {
    const uniqueSeasons = [...new Set(shows.map(show => show.season))];
    return uniqueSeasons.sort();
  }, [shows]);

  const locations = useMemo(() => {
    const uniqueLocations = [...new Set(shows.map(show => show.location))];
    return uniqueLocations.sort();
  }, [shows]);

  const types = useMemo(() => {
    const uniqueTypes = [...new Set(shows.map(show => show.type))];
    return uniqueTypes.sort();
  }, [shows]);

  // Apply filters to shows
  const filteredShows = useMemo(() => {
    let result = shows;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Apply search filter
    if (filters.search) {
      result = searchShows(result, filters.search);
    }

    // Apply season filter
    if (filters.season !== 'all') {
      result = filterShowsBySeason(result, filters.season);
    }

    // Apply location filter
    if (filters.location !== 'all') {
      result = filterShowsByLocation(result, filters.location);
    }

    // Apply type filter
    if (filters.type !== 'all') {
      result = result.filter(show => show.type === filters.type);
    }

    // Apply client filter
    if (filters.client !== 'all') {
      result = result.filter(show => show.client === filters.client);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      if (filters.dateRange === 'upcoming') {
        result = result.filter(show => {
          const endDate = new Date(show.endDate);
          return endDate >= today;
        });
      } else if (filters.dateRange === 'past') {
        result = result.filter(show => {
          const endDate = new Date(show.endDate);
          return endDate < today;
        });
      }
    }

    // Sort shows by date (earliest first)
    return result.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [shows, filters]);

  return (
    <>
      <Head>
        <title>Shows | The Smith Agency</title>
        <meta name="description" content="Manage your shows at The Smith Agency" />
      </Head>

      <DashboardLayout>
        <div className="flex flex-col h-full">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-b from-secondary-50 to-secondary-50/80 backdrop-blur-sm px-4 sm:px-6 py-4 border-b border-secondary-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-secondary-900">Shows</h1>
                <p className="text-xs text-secondary-500">{filteredShows.length} shows</p>
              </div>
              <Link href="/shows/new">
                <Button variant="primary" size="sm" className="flex items-center gap-1.5">
                  <PlusIcon className="w-4 h-4" />
                  <span>Show</span>
                </Button>
              </Link>
            </div>
            
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                placeholder="Search shows..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-auto p-4 sm:p-6">
            {filteredShows.length > 0 ? (
              <ShowList shows={filteredShows} />
            ) : (
              <div className="bg-white shadow-sm rounded-lg p-6 text-center">
                <p className="text-secondary-500">No shows found matching your filters.</p>
                <p className="mt-2">
                  <Button variant="outline" size="sm" onClick={() => setFilters({
                    search: '',
                    season: 'all',
                    location: 'all',
                    type: 'all',
                    client: 'all',
                    dateRange: 'all',
                  })}>
                    Reset Filters
                  </Button>
                </p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 