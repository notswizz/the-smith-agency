import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { formatDate } from '@/utils/dateUtils';
import { 
  PlusIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

export default function BookingsDirectory() {
  const { bookings, shows, staff, clients } = useStore();
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    show: 'all',
    dateRange: 'all'
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const router = useRouter();
  
  // State for tracking active tooltip
  const [activeTooltip, setActiveTooltip] = useState({
    visible: false,
    dayIndex: null,
    bookingId: null,
    position: { x: 0, y: 0 }
  });

  // Get unique shows for filter
  const showOptions = useMemo(() => {
    return shows.map(show => ({
      id: show.id,
      name: show.name
    })).sort((a, b) => a.name.localeCompare(b.name));
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

  // Helper: get total booking days and unique staff working
  const getBookingSummary = (datesNeeded = []) => {
    if (!Array.isArray(datesNeeded) || datesNeeded.length === 0) return { days: 0, staffNames: [], staffIds: [] };
    const days = datesNeeded.length;
    const staffIdSet = new Set();
    datesNeeded.forEach(d => {
      if (Array.isArray(d.staffIds)) {
        d.staffIds.filter(Boolean).forEach(id => staffIdSet.add(id));
      }
    });
    const staffNames = Array.from(staffIdSet).map(id => {
      const s = staff.find(st => st.id === id);
      return s ? (s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()) : '[Unknown Staff]';
    });
    const staffIds = Array.from(staffIdSet);
    return { days, staffNames, staffIds };
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
    let result = bookings;
    
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
    
    // Sort by date (most recent assigned first)
    return result.sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate));
  }, [bookings, filters, shows, staff, clients]);

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

  // Check if any filters are active
  const hasActiveFilters = filters.status !== 'all' || filters.show !== 'all' || filters.dateRange !== 'all';

  return (
    <>
      <Head>
        <title>Staff Bookings | The Smith Agency</title>
        <meta name="description" content="Manage your staff bookings at The Smith Agency" />
      </Head>

      <DashboardLayout>
        <div className="flex flex-col h-full">
          {/* Sticky header section */}
          <div className="sticky top-0 z-10 bg-secondary-50 px-4 py-4 border-b border-secondary-200">
            {/* Header with title and actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h1 className="text-xl sm:text-2xl font-bold text-secondary-900">Staff Bookings</h1>
              <div className="flex items-center gap-2">
                <Link href="/bookings/new" className="ml-auto sm:ml-2">
                  <Button variant="primary" size="sm" className="flex items-center text-xs sm:text-sm">
                    <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> <span className="hidden xs:inline">New</span> Booking
                  </Button>
                </Link>
              </div>
            </div>

            {/* Search and filters */}
            <div className="bg-white shadow-sm rounded-lg mb-3">
              <div className="p-3 sm:p-4">
                <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-400" />
                    </div>
                    <input
                      type="text"
                      name="search"
                      value={filters.search}
                      onChange={handleSearchChange}
                      placeholder="Search by staff, client, show, or notes..."
                      className="pl-8 sm:pl-10 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-xs sm:text-sm h-9 sm:h-auto"
                    />
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className="flex items-center w-full md:w-auto justify-center text-xs sm:text-sm h-9 sm:h-auto"
                    >
                      <FunnelIcon className="h-4 w-4 mr-1" />
                      Filters
                      {hasActiveFilters && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-2xs sm:text-xs font-medium bg-primary-100 text-primary-800">
                          Active
                        </span>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Filter options */}
                {isFilterOpen && (
                  <div className="mt-3 sm:mt-4 border-t border-secondary-200 pt-3 sm:pt-4 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="status" className="block text-xs sm:text-sm font-medium text-secondary-700">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-xs sm:text-sm h-9 sm:h-auto"
                      >
                        <option value="all">All Statuses</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="show" className="block text-xs sm:text-sm font-medium text-secondary-700">
                        Show
                      </label>
                      <select
                        id="show"
                        name="show"
                        value={filters.show}
                        onChange={handleFilterChange}
                        className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-xs sm:text-sm h-9 sm:h-auto"
                      >
                        <option value="all">All Shows</option>
                        {showOptions.map(show => (
                          <option key={show.id} value={show.id}>
                            {show.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="dateRange" className="block text-xs sm:text-sm font-medium text-secondary-700">
                        Date Range
                      </label>
                      <select
                        id="dateRange"
                        name="dateRange"
                        value={filters.dateRange}
                        onChange={handleFilterChange}
                        className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-xs sm:text-sm h-9 sm:h-auto"
                      >
                        <option value="all">All Dates</option>
                        <option value="upcoming">Upcoming Shows</option>
                        <option value="active">Currently Active</option>
                        <option value="past">Past Shows</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3 flex justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={resetFilters}
                        disabled={!hasActiveFilters}
                        className="flex items-center text-xs sm:text-sm h-9 sm:h-auto"
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Results count */}
              <div className="border-t border-secondary-200 px-3 sm:px-4 py-1.5 sm:py-2">
                <p className="text-2xs sm:text-sm text-secondary-500">
                  Showing <span className="font-medium">{filteredBookings.length}</span> of{' '}
                  <span className="font-medium">{bookings.length}</span> bookings
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-auto pb-6">
            {/* Bookings list - card view only */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 p-3 sm:p-6">
              {filteredBookings.length > 0 ? (
                filteredBookings.map(booking => {
                  const staffMember = staff.find(s => s.id === booking.staffId);
                  const show = shows.find(s => s.id === booking.showId);
                  const bookingSummary = getBookingSummary(booking.datesNeeded);
                  const client = clients.find(c => c.id === booking.clientId);
                  
                  // Get first and last date for date range display
                  const sortedDates = booking.datesNeeded ? 
                    [...booking.datesNeeded].sort((a, b) => new Date(a.date) - new Date(b.date)) : 
                    [];
                  const firstDate = sortedDates.length > 0 ? sortedDates[0].date : null;
                  const lastDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1].date : null;
                  
                  // Calculate staff needed vs assigned
                  const totalStaffNeeded = booking.datesNeeded?.reduce((total, date) => total + (date.staffCount || 1), 0) || 0;
                  const totalStaffAssigned = booking.datesNeeded?.reduce((total, date) => 
                    total + (date.staffIds?.filter(Boolean).length || 0), 0) || 0;
                  
                  // Format the status
                  const statusLabels = {
                    'confirmed': 'Confirmed',
                    'pending': 'Pending',
                    'cancelled': 'Cancelled'
                  };
                  
                  // Status color mapping
                  const statusColors = {
                    'confirmed': 'success',
                    'pending': 'warning',
                    'cancelled': 'danger'
                  };
                  
                  const statusColor = statusColors[booking.status] || 'secondary';
                  
                  return (
                    <div
                      key={booking.id}
                      className="group relative overflow-hidden rounded-xl bg-white transition-all duration-200 hover:shadow-lg border border-secondary-200 hover:border-primary-300 flex flex-col"
                      onClick={() => router.push(`/bookings/${booking.id}`)}
                      tabIndex={0}
                      role="button"
                      aria-label={`View booking for ${getClientName(booking.clientId)}`}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.push(`/bookings/${booking.id}`); }}
                    >
                      {/* Gradient header */}
                      <div className={`h-2 sm:h-2.5 w-full ${
                        booking.status === 'confirmed' 
                          ? 'bg-gradient-to-r from-success-500 to-success-400' 
                          : booking.status === 'pending' 
                            ? 'bg-gradient-to-r from-warning-500 to-warning-400'
                            : 'bg-gradient-to-r from-danger-500 to-danger-400'
                      }`}></div>
                      
                      <div className="p-3 sm:p-5 flex-grow flex flex-col">
                        {/* Top section with status and edit button */}
                        <div className="flex justify-between items-start mb-2 sm:mb-3">
                          <div className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-2xs sm:text-xs font-semibold ${
                            booking.status === 'confirmed' 
                              ? 'bg-success-100 text-success-800' 
                              : booking.status === 'pending' 
                                ? 'bg-warning-100 text-warning-800'
                                : 'bg-danger-100 text-danger-800'
                          }`}>
                            {booking.status === 'confirmed' && <CheckCircleIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 inline mr-0.5 sm:mr-1" />}
                            {booking.status === 'pending' && <ClockIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 inline mr-0.5 sm:mr-1" />}
                            {booking.status === 'cancelled' && <XCircleIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 inline mr-0.5 sm:mr-1" />}
                            {statusLabels[booking.status] || 'Unknown'}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/bookings/${booking.id}/edit`);
                            }}
                            className="p-1.5 rounded-md text-secondary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            aria-label="Edit booking"
                          >
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Client and Show Info */}
                        <div className="mb-3 sm:mb-4">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-sm sm:text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors leading-tight">
                                {client?.name || getClientName(booking.clientId)}
                              </h3>
                              <h4 className="text-xs sm:text-sm font-medium text-secondary-600">
                                {show?.name || getShowName(booking.showId)}
                              </h4>
                            </div>
                          </div>
                        </div>
                        
                        {/* Compact Staff/Days Stats with Bar Chart */}
                        <div className="rounded-lg sm:rounded-xl bg-secondary-50 p-2 sm:p-3 border border-secondary-100">
                          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <div className="flex items-baseline gap-1">
                              <span className="text-base sm:text-xl font-bold text-secondary-900">{bookingSummary.days}</span>
                              <span className="text-2xs sm:text-xs text-secondary-500 uppercase">days</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-medium text-secondary-900">{totalStaffAssigned}/{totalStaffNeeded}</span>
                              <span className="text-2xs text-secondary-500 uppercase">staff</span>
                            </div>
                          </div>
                          
                          {/* Enhanced Staff Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-medium text-secondary-700">Staff Filled</span>
                              <span className="font-medium text-secondary-700">
                                {Math.round((totalStaffAssigned / Math.max(1, totalStaffNeeded)) * 100)}%
                              </span>
                            </div>
                            <div className="relative h-2 bg-secondary-200 rounded-full overflow-hidden">
                              <div 
                                className={`absolute top-0 left-0 h-full ${
                                  totalStaffAssigned >= totalStaffNeeded 
                                    ? 'bg-gradient-to-r from-success-500 to-success-400' 
                                    : totalStaffAssigned >= totalStaffNeeded/2
                                      ? 'bg-gradient-to-r from-warning-500 to-warning-400'
                                      : 'bg-gradient-to-r from-danger-500 to-danger-400'
                                }`}
                                style={{ width: `${Math.min(100, (totalStaffAssigned / Math.max(1, totalStaffNeeded)) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          {/* Days Bar Chart */}
                          <div className="mt-3 flex items-end h-10 gap-px overflow-hidden relative">
                            {Array.from({ length: Math.min(bookingSummary.days, 15) }).map((_, i) => {
                              // Calculate day staff fullness (random for visualization)
                              const dayIndex = Math.min(i, (booking.datesNeeded || []).length - 1);
                              const dayStaffIds = booking.datesNeeded && dayIndex >= 0 ? 
                                booking.datesNeeded[dayIndex].staffIds || [] : [];
                              const dayStaffCount = booking.datesNeeded && dayIndex >= 0 ? 
                                booking.datesNeeded[dayIndex].staffCount || 1 : 1;
                              const fullness = Math.min(1, dayStaffIds.length / Math.max(1, dayStaffCount));
                              
                              // Get date for this bar
                              const dayDate = booking.datesNeeded && dayIndex >= 0 
                                ? booking.datesNeeded[dayIndex].date 
                                : null;
                              
                              return (
                                <div 
                                  key={i} 
                                  className={`flex-1 rounded-t ${
                                    fullness >= 1 
                                      ? 'bg-success-500 hover:bg-success-600' 
                                      : fullness >= 0.5 
                                        ? 'bg-warning-500 hover:bg-warning-600' 
                                        : 'bg-danger-400 hover:bg-danger-500'
                                  } cursor-pointer transition-colors relative`}
                                  style={{ height: `${50 + fullness * 50}%` }}
                                  onClick={(e) => showTooltip(e, dayIndex, booking.id)}
                                  onMouseEnter={(e) => showTooltip(e, dayIndex, booking.id)}
                                  onMouseLeave={hideTooltip}
                                  title={dayDate ? formatDate(dayDate) : 'Date information not available'}
                                ></div>
                              );
                            })}
                            {bookingSummary.days > 15 && (
                              <div className="flex-1 rounded-t bg-secondary-300 hover:bg-secondary-400 h-1/2 flex items-center justify-center cursor-pointer transition-colors">
                                <span className="text-[8px] text-white font-bold">+{bookingSummary.days - 15}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 p-8 text-center bg-secondary-50 rounded-lg border border-secondary-200">
                  <MagnifyingGlassIcon className="h-10 w-10 mx-auto text-secondary-400 mb-4" />
                  <h3 className="text-base font-medium text-secondary-900 mb-1">No bookings found</h3>
                  <p className="text-sm text-secondary-600 mb-4">Try adjusting your search or filter criteria</p>
                  <Button variant="primary" size="sm" onClick={resetFilters}>
                    Reset all filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
      
      {/* Staff Tooltip Modal */}
      {activeTooltip.visible && (
        <div 
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-secondary-200 w-64 transform -translate-x-1/2 animate-fade-in"
          style={{ 
            left: `${activeTooltip.position.x}px`, 
            top: `${activeTooltip.position.y - 10}px`,
            marginTop: '-160px'  // Position above the bar
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {bookings.map(booking => {
            if (booking.id !== activeTooltip.bookingId) return null;
            
            const dateInfo = booking.datesNeeded?.[activeTooltip.dayIndex];
            const dateDisplay = dateInfo?.date ? formatDate(dateInfo.date) : 'Unknown Date';
            const staffList = getStaffForDay(booking, activeTooltip.dayIndex);
            
            // Calculate the number of unfilled positions
            const staffNeeded = dateInfo?.staffCount || 0;
            const staffAssigned = staffList.length;
            const unfilled = Math.max(0, staffNeeded - staffAssigned);
            
            // Create an array with unfilled placeholders
            const displayList = [
              ...staffList,
              ...Array(unfilled).fill({ id: `unfilled-${Date.now()}-${Math.random()}`, name: null })
            ];
            
            return (
              <div key={booking.id} className="p-3">
                <div className="flex justify-between items-center border-b border-secondary-100 pb-2 mb-2">
                  <h3 className="font-medium text-sm text-secondary-900">{dateDisplay}</h3>
                  <button 
                    onClick={hideTooltip}
                    className="text-secondary-400 hover:text-secondary-600"
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="max-h-32 overflow-y-auto">
                  {displayList.map((staffMember, index) => (
                    staffMember.name ? (
                      <Link 
                        href={`/staff/${staffMember.id}`} 
                        key={staffMember.id}
                        className="flex items-center py-1.5 px-1 hover:bg-secondary-50 rounded-md"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="h-6 w-6 rounded-full bg-secondary-200 flex items-center justify-center text-xs mr-2">
                          {staffMember.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-secondary-900">{staffMember.name}</div>
                        </div>
                      </Link>
                    ) : (
                      <div 
                        key={staffMember.id || `unfilled-${index}`}
                        className="flex items-center py-1.5 px-1 rounded-md"
                      >
                        <div className="h-6 w-6 rounded-full bg-secondary-100 flex items-center justify-center text-xs mr-2 text-secondary-400">
                          ?
                        </div>
                        <div>
                          <div className="text-sm font-medium text-secondary-400 italic">Unfilled</div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
} 