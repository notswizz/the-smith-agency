import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/ui/DashboardLayout';
import useStore from '@/lib/hooks/useStore';
import BookingFilters from '@/components/bookings/BookingFilters';
import BookingCard from '@/components/bookings/BookingCard';
import EmptyBookings from '@/components/bookings/EmptyBookings';
import StaffTooltip from '@/components/bookings/StaffTooltip';
import { ClockIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function BookingsDirectory() {
  const { bookings, shows, staff, clients } = useStore();
  
  // Ensure bookings is an array and handle potential nested structure
  const bookingsArray = useMemo(() => {
    return Array.isArray(bookings) 
      ? bookings 
      : (bookings?.items && Array.isArray(bookings.items)) 
        ? bookings.items 
        : [];
  }, [bookings]);
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    show: 'all',
    dateRange: 'all'
  });
  const [isShowsOpen, setIsShowsOpen] = useState(false);
  
  // State for tracking active tooltip
  const [activeTooltip, setActiveTooltip] = useState({
    visible: false,
    dayIndex: null,
    bookingId: null,
    position: { x: 0, y: 0 }
  });

  // Get unique shows for filter (only active shows)
  const showOptions = useMemo(() => {
    return shows
      .filter(show => (show.status || 'active') === 'active')
      .map(show => ({
        id: show.id,
        name: show.name
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [shows]);

  // Add helpers to get client and show names
  const getClientName = (id) => {
    const client = clients.find(c => c.id === id);
    return client ? client.name : '[Unknown Client]';
  };

  const getShowName = (id) => {
    const show = shows.find(s => s.id === id);
    return show ? show.name : '[Unknown Show]';
  };

  // Function to show tooltip for a specific day bar
  const showTooltip = (e, dayIndex, bookingId) => {
    e.stopPropagation(); // Prevent card click action
    
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveTooltip({
      visible: true,
      dayIndex,
      bookingId,
      position: {
        x: rect.left + (rect.width / 2),
        y: rect.top
      }
    });
  };
  
  // Function to hide tooltip
  const hideTooltip = () => {
    setActiveTooltip({
      visible: false,
      dayIndex: null,
      bookingId: null,
      position: { x: 0, y: 0 }
    });
  };
  
  // Function to get staff names for a particular day
  const getStaffForDay = (booking, dayIndex) => {
    if (!booking?.datesNeeded || !booking.datesNeeded[dayIndex]) return [];
    
    const date = booking.datesNeeded[dayIndex];
    const staffMembersForDay = [];
    
    if (Array.isArray(date.staffIds)) {
      date.staffIds.forEach(staffId => {
        const staffMember = staff.find(s => s.id === staffId);
        if (staffMember) {
          // Use name property if available, otherwise combine firstName and lastName
          const name = staffMember.name || `${staffMember.firstName || ''} ${staffMember.lastName || ''}`.trim();
          staffMembersForDay.push({
            id: staffId,
            name: name
          });
        }
      });
    }
    
    return staffMembersForDay;
  };

  // Apply filters to bookings
  const filteredBookings = useMemo(() => {
    let result = bookingsArray;
    
    // Filter to only show bookings for active shows
    result = result.filter(booking => {
      const show = shows.find(s => s.id === booking.showId);
      return show && (show.status || 'active') === 'active';
    });
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase().trim();
      result = result.filter(booking => {
        // Get related data
        const show = shows.find(s => s.id === booking.showId);
        const client = clients.find(c => c.id === booking.clientId);
        
        // Check if any staff member matches the search
        const hasMatchingStaff = booking.datesNeeded?.some(date => 
          date.staffIds?.some(staffId => {
            const staffMember = staff.find(s => s.id === staffId);
            if (!staffMember) return false;
            
            // Support both name formats
            const fullName = staffMember.name || 
                           `${staffMember.firstName || ''} ${staffMember.lastName || ''}`.trim();
            
            return fullName.toLowerCase().includes(searchLower) || 
                  staffMember.email?.toLowerCase().includes(searchLower);
          })
        );
        
        // Check client name
        const clientNameMatches = client && client.name.toLowerCase().includes(searchLower);
        
        // Check show name
        const showNameMatches = show && show.name.toLowerCase().includes(searchLower);
        
        // Check booking notes
        const notesMatch = booking.notes && booking.notes.toLowerCase().includes(searchLower);
        
        // Return true if any match
        return hasMatchingStaff || clientNameMatches || showNameMatches || notesMatch;
      });
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(booking => booking.status === filters.status);
    }
    
    // Apply show filter
    if (filters.show !== 'all') {
      result = result.filter(booking => booking.showId === filters.show);
    }
    
    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      result = result.filter(booking => {
        const show = shows.find(s => s.id === booking.showId);
        if (!show) return false;
        
        const startDate = new Date(show.startDate);
        const endDate = new Date(show.endDate);
        
        if (filters.dateRange === 'upcoming') {
          return startDate >= today;
        } else if (filters.dateRange === 'active') {
          return startDate <= today && endDate >= today;
        } else if (filters.dateRange === 'past') {
          return endDate < today;
        }
        return true;
      });
    }
    
    // Sort by creation date (newest first)
    return result.sort((a, b) => {
      // Safely handle missing createdAt values by defaulting to old dates
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });
  }, [bookingsArray, filters, shows, staff, clients]);

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      show: 'all',
      dateRange: 'all'
    });
  };

  const handleSearchChange = (e) => {
    setFilters({
      ...filters,
      search: e.target.value
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  return (
    <>
      <Head>
        <title>Staff Bookings | The Smith Agency</title>
        <meta name="description" content="Manage your staff bookings at The Smith Agency" />
      </Head>

      <DashboardLayout>
        <div className="flex flex-col h-full">
          {/* Filters Section */}
          <BookingFilters 
            filters={filters}
            showOptions={showOptions}
            setFilters={setFilters}
            isShowsOpen={isShowsOpen}
            setIsShowsOpen={setIsShowsOpen}
            filteredBookingsCount={filteredBookings.length}
            handleSearchChange={handleSearchChange}
            handleFilterChange={handleFilterChange}
          />

          {/* Scrollable content area */}
          <div className="flex-1 overflow-auto pb-6">
            {/* Bookings list - card view with snap scrolling on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 p-3 sm:p-6 md:grid-flow-row-dense">
              {/* For mobile: Separate sections for pending and confirmed */}
              <div className="sm:hidden w-full space-y-6">
                {/* Pending bookings section */}
                {filteredBookings.some(booking => booking.status === 'pending') && (
                  <div className="space-y-2">
                    <div className="flex items-center px-3">
                      <ClockIcon className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
                      <h2 className="text-sm font-medium text-secondary-600 uppercase tracking-wide">Pending</h2>
                      <span className="ml-1.5 text-xs text-secondary-500 bg-secondary-50 px-1.5 py-0.5 rounded-full">
                        {filteredBookings.filter(booking => booking.status === 'pending').length}
                      </span>
                    </div>
                    <div className="overflow-x-auto pb-4 snap-x snap-mandatory scroll-p-4 scroll-smooth flex gap-3">
                      {filteredBookings
                        .filter(booking => booking.status === 'pending')
                        .map(booking => {
                          const client = clients.find(c => c.id === booking.clientId);
                          const show = shows.find(s => s.id === booking.showId);
                          
                          return (
                            <div key={booking.id} className="snap-center min-w-[85%] first:ml-3 last:mr-3">
                              <BookingCard
                                booking={booking}
                                staff={staff}
                                client={client}
                                show={show}
                                showTooltip={showTooltip}
                                hideTooltip={hideTooltip}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
                
                {/* Confirmed bookings section */}
                {filteredBookings.some(booking => booking.status === 'confirmed') && (
                  <div className="space-y-2">
                    <div className="flex items-center px-3">
                      <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500 mr-1.5" />
                      <h2 className="text-sm font-medium text-secondary-600 uppercase tracking-wide">Confirmed</h2>
                      <span className="ml-1.5 text-xs text-secondary-500 bg-secondary-50 px-1.5 py-0.5 rounded-full">
                        {filteredBookings.filter(booking => booking.status === 'confirmed').length}
                      </span>
                    </div>
                    <div className="overflow-x-auto pb-4 snap-x snap-mandatory scroll-p-4 scroll-smooth flex gap-3">
                      {filteredBookings
                        .filter(booking => booking.status === 'confirmed')
                        .map(booking => {
                          const client = clients.find(c => c.id === booking.clientId);
                          const show = shows.find(s => s.id === booking.showId);
                          
                          return (
                            <div key={booking.id} className="snap-center min-w-[85%] first:ml-3 last:mr-3">
                              <BookingCard
                                booking={booking}
                                staff={staff}
                                client={client}
                                show={show}
                                showTooltip={showTooltip}
                                hideTooltip={hideTooltip}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
                
                {/* Cancelled bookings section */}
                {filteredBookings.some(booking => booking.status === 'cancelled') && (
                  <div className="space-y-2">
                    <div className="flex items-center px-3">
                      <XMarkIcon className="h-3.5 w-3.5 text-red-500 mr-1.5" />
                      <h2 className="text-sm font-medium text-secondary-600 uppercase tracking-wide">Cancelled</h2>
                      <span className="ml-1.5 text-xs text-secondary-500 bg-secondary-50 px-1.5 py-0.5 rounded-full">
                        {filteredBookings.filter(booking => booking.status === 'cancelled').length}
                      </span>
                    </div>
                    <div className="overflow-x-auto pb-4 snap-x snap-mandatory scroll-p-4 scroll-smooth flex gap-3">
                      {filteredBookings
                        .filter(booking => booking.status === 'cancelled')
                        .map(booking => {
                          const client = clients.find(c => c.id === booking.clientId);
                          const show = shows.find(s => s.id === booking.showId);
                          
                          return (
                            <div key={booking.id} className="snap-center min-w-[85%] first:ml-3 last:mr-3">
                              <BookingCard
                                booking={booking}
                                staff={staff}
                                client={client}
                                show={show}
                                showTooltip={showTooltip}
                                hideTooltip={hideTooltip}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
                
                {/* Empty state */}
                {filteredBookings.length === 0 && (
                  <div className="px-3">
                    <EmptyBookings resetFilters={resetFilters} />
                  </div>
                )}
              </div>
              
              {/* For tablet/desktop: Regular grid layout */}
              {filteredBookings.length > 0 ? (
                filteredBookings.map(booking => {
                  const client = clients.find(c => c.id === booking.clientId);
                  const show = shows.find(s => s.id === booking.showId);
                  
                  return (
                    <div key={booking.id} className="hidden sm:block">
                      <BookingCard
                        booking={booking}
                        staff={staff}
                        client={client}
                        show={show}
                        showTooltip={showTooltip}
                        hideTooltip={hideTooltip}
                      />
                    </div>
                  );
                })
              ) : (
                <div className="hidden sm:block">
                  <EmptyBookings resetFilters={resetFilters} />
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
      
      {/* Staff Tooltip */}
      <StaffTooltip
        activeTooltip={activeTooltip}
        bookings={bookingsArray}
        getStaffForDay={getStaffForDay}
        hideTooltip={hideTooltip}
      />
    </>
  );
} 