import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/ui/DashboardLayout';
import ClientList from '@/components/clients/ClientList';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { searchClients } from '@/utils/filterUtils';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function ClientsDirectory() {
  const { clients, getBookingsForClient } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate total booking days for each client
  const clientsWithBookingData = useMemo(() => {
    return clients.map(client => {
      const clientBookings = getBookingsForClient(client.id) || [];
      
      // Calculate total dates and days booked
      const totalDatesBooked = clientBookings.reduce((total, booking) => {
        if (Array.isArray(booking.datesNeeded)) {
          // Only count dates where staffCount > 0
          const datesWithStaff = booking.datesNeeded.filter(d => (d.staffCount || 0) > 0);
          return total + datesWithStaff.length;
        }
        return total;
      }, 0);

      const totalStaffDays = clientBookings.reduce((total, booking) => {
        if (Array.isArray(booking.datesNeeded)) {
          // Calculate total staff days (assignments)
          const datesWithStaff = booking.datesNeeded.filter(d => (d.staffCount || 0) > 0);
          return total + datesWithStaff.reduce((sum, date) => sum + (date.staffCount || 0), 0);
        }
        return total;
      }, 0);
      
      return {
        ...client,
        totalDatesBooked,
        totalStaffDays,
        bookingsCount: clientBookings.length
      };
    });
  }, [clients, getBookingsForClient]);

  // Apply search to clients
  const filteredClients = useMemo(() => {
    let result = clientsWithBookingData;

    // Apply search filter
    if (searchQuery) {
      result = searchClients(result, searchQuery);
    }
    
    // Sort by total dates booked (descending)
    result = [...result].sort((a, b) => b.totalDatesBooked - a.totalDatesBooked);

    return result;
  }, [clientsWithBookingData, searchQuery]);

  return (
    <>
      <Head>
        <title>Clients | The Smith Agency</title>
        <meta name="description" content="Manage your clients at The Smith Agency" />
      </Head>

      <DashboardLayout>
        <div className="flex flex-col h-full">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-b from-secondary-50 to-secondary-50/80 backdrop-blur-sm px-4 sm:px-6 py-4 border-b border-secondary-200">
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-xl font-bold text-secondary-900">Clients</h1>
              <p className="text-xs text-secondary-500">{filteredClients.length} clients</p>
            </div>
            
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-auto p-4 sm:p-6">
            {filteredClients.length > 0 ? (
              <ClientList clients={filteredClients} />
            ) : (
              <div className="bg-white shadow-sm rounded-lg p-6 text-center">
                <p className="text-secondary-500">No clients found matching your search.</p>
                {searchQuery && (
                  <p className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 