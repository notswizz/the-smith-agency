import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '@/components/ui/DashboardLayout';
import ClientList from '@/components/clients/ClientList';
import ClientFilters from '@/components/clients/ClientFilters';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { searchClients, filterClientsByCategory, filterClientsByLocation } from '@/utils/filterUtils';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function ClientsDirectory() {
  const { clients } = useStore();
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    location: 'all',
  });

  // Get unique categories and locations for filters
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(clients.map(client => client.category))];
    return uniqueCategories.sort();
  }, [clients]);

  const locations = useMemo(() => {
    const uniqueLocations = [...new Set(clients.map(client => client.location))];
    return uniqueLocations.sort();
  }, [clients]);

  // Apply filters to clients
  const filteredClients = useMemo(() => {
    let result = clients;

    // Apply search filter
    if (filters.search) {
      result = searchClients(result, filters.search);
    }

    // Apply category filter
    if (filters.category !== 'all') {
      result = filterClientsByCategory(result, filters.category);
    }

    // Apply location filter
    if (filters.location !== 'all') {
      result = filterClientsByLocation(result, filters.location);
    }

    return result;
  }, [clients, filters]);

  return (
    <>
      <Head>
        <title>Clients | The Smith Agency</title>
        <meta name="description" content="Manage your clients at The Smith Agency" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Header with title and actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-secondary-900">Client Directory</h1>
            <div className="mt-4 sm:mt-0">
              <Link href="/clients/new">
                <Button variant="primary" size="sm" className="flex items-center">
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Add Client
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <ClientFilters
            filters={filters}
            setFilters={setFilters}
            showCount={filteredClients.length}
            totalCount={clients.length}
            categories={categories}
            locations={locations}
          />

          {/* Client list */}
          {filteredClients.length > 0 ? (
            <ClientList clients={filteredClients} />
          ) : (
            <div className="bg-white shadow-sm rounded-lg p-6 text-center">
              <p className="text-secondary-500">No clients found matching your filters.</p>
              <p className="mt-2">
                <Button variant="outline" size="sm" onClick={() => setFilters({
                  search: '',
                  category: 'all',
                  location: 'all',
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