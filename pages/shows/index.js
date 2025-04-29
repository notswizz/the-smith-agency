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
import { PlusIcon, ViewColumnsIcon, TableCellsIcon } from '@heroicons/react/24/outline';

export default function ShowsDirectory() {
  const { shows, clients } = useStore();
  const [view, setView] = useState('grid'); // 'grid' or 'table'
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

    // Sort shows by date (most recent first)
    return result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }, [shows, filters]);

  return (
    <>
      <Head>
        <title>Shows | The Smith Agency</title>
        <meta name="description" content="Manage your shows at The Smith Agency" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Header with title and actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-secondary-900">Shows Directory</h1>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
              <div className="flex space-x-3">
                <Button
                  variant={view === 'grid' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setView('grid')}
                  className="flex items-center"
                >
                  <TableCellsIcon className="h-5 w-5 mr-1" />
                  Grid
                </Button>
                <Button
                  variant={view === 'table' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setView('table')}
                  className="flex items-center"
                >
                  <ViewColumnsIcon className="h-5 w-5 mr-1" />
                  Table
                </Button>
              </div>
              <Link href="/shows/new">
                <Button variant="primary" size="sm" className="flex items-center">
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Add Show
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <ShowFilters
            filters={filters}
            setFilters={setFilters}
            showCount={filteredShows.length}
            totalCount={shows.length}
            seasons={seasons}
            locations={locations}
            types={types}
            clients={clients}
          />

          {/* Shows list */}
          {filteredShows.length > 0 ? (
            <ShowList shows={filteredShows} view={view} />
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
      </DashboardLayout>
    </>
  );
} 