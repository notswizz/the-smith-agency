import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '@/components/ui/DashboardLayout';
import ClientList from '@/components/clients/ClientList';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { searchClients } from '@/utils/filterUtils';
import { PlusIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ClientsDirectory() {
  const { clients, getBookingsForClient } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll event to add shadow to header
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

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
        totalStaffDays
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
        <div className="flex flex-col h-full relative">
          {/* Sticky header section */}
          <div className={`sticky top-0 z-30 bg-white px-3 sm:px-4 py-3 sm:py-4 transition-all duration-300 ${scrolled ? 'shadow-sm border-b border-gray-200' : ''}`}>
            {/* Header with title and actions */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Client Directory
                </h1>
                <div className="ml-2 bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-md hidden sm:flex items-center">
                  {clients.length} Clients
                </div>
              </div>
              
              <Link href="/clients/new">
                <Button variant="primary" size="sm" className="flex items-center">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Client
                </Button>
              </Link>
            </div>

            {/* Search bar with enhanced styling */}
            <div className="bg-white shadow-sm rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="search"
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-9 pr-10 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all duration-200"
                    placeholder="Search clients by name..."
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                
                {/* Simple client count badge */}
                <div className="flex-shrink-0 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md flex items-center">
                  <span className="font-bold">{filteredClients.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable content area with proper z-index */}
          <div className="flex-1 overflow-auto pb-4 pt-3 px-3 sm:px-4 relative z-10 scroll-smooth">
            {/* Client list */}
            {filteredClients.length > 0 ? (
              <ClientList clients={filteredClients} />
            ) : (
              <div className="bg-white shadow-sm rounded-lg p-6 text-center border border-gray-200 mt-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-3">No clients found matching your search.</p>
                  {searchQuery && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 