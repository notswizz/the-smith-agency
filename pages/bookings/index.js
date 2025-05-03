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
  ChevronRightIcon
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
  const [viewMode, setViewMode] = useState('card');
  const router = useRouter();

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
      return s ? s.name : '[Unknown Staff]';
    });
    const staffIds = Array.from(staffIdSet);
    return { days, staffNames, staffIds };
  };

  // Apply filters to bookings
  const filteredBookings = useMemo(() => {
    let result = bookings;
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(booking => {
        const staffMember = staff.find(s => s.id === booking.staffId);
        const show = shows.find(s => s.id === booking.showId);
        
        return (
          (staffMember && 
            (`${staffMember.firstName} ${staffMember.lastName}`).toLowerCase().includes(searchLower)) ||
          (show && show.name.toLowerCase().includes(searchLower)) ||
          booking.role.toLowerCase().includes(searchLower)
        );
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
  }, [bookings, filters, shows, staff]);

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
        <div className="space-y-4 sm:space-y-6">
          {/* Header with title and actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-secondary-900">Staff Bookings</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-md shadow-sm">
                <Button variant={viewMode==='table' ? 'primary' : 'outline'} size="sm" onClick={()=>setViewMode('table')} className="rounded-r-none text-xs sm:text-sm">Table</Button>
                <Button variant={viewMode==='card' ? 'primary' : 'outline'} size="sm" onClick={()=>setViewMode('card')} className="rounded-l-none text-xs sm:text-sm">Card</Button>
              </div>
              <Link href="/bookings/new" className="ml-auto sm:ml-2">
                <Button variant="primary" size="sm" className="flex items-center text-xs sm:text-sm">
                  <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> <span className="hidden xs:inline">New</span> Booking
                </Button>
              </Link>
            </div>
          </div>

          {/* Search and filters */}
          <div className="bg-white shadow-sm rounded-lg">
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
                    placeholder="Search staff, shows, or roles..."
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

            {/* Bookings list */}
            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-2xs sm:text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Staff Member
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-2xs sm:text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Show
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-2xs sm:text-xs font-medium text-secondary-500 uppercase tracking-wider hidden sm:table-cell">
                        Dates
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-2xs sm:text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-3 sm:px-6 py-2 sm:py-3 text-left text-2xs sm:text-xs font-medium text-secondary-500 uppercase tracking-wider hidden md:table-cell">
                        Assigned
                      </th>
                      <th scope="col" className="relative px-3 sm:px-6 py-2 sm:py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {filteredBookings.map((booking) => {
                      const staffMember = staff.find(s => s.id === booking.staffId);
                      const show = shows.find(s => s.id === booking.showId);
                      
                      return (
                        <tr key={booking.id} className="hover:bg-secondary-50 cursor-pointer" onClick={() => router.push(`/bookings/${booking.id}`)}>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            {staffMember ? (
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-7 w-7 sm:h-10 sm:w-10 rounded-full">
                                  <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-full bg-secondary-200 flex items-center justify-center text-2xs sm:text-sm text-secondary-600">
                                    {staffMember.firstName.charAt(0)}{staffMember.lastName.charAt(0)}
                                  </div>
                                </div>
                                <div className="ml-2 sm:ml-4">
                                  <div className="text-xs sm:text-sm font-medium text-secondary-900 truncate max-w-[100px] sm:max-w-full">
                                    <Link href={`/staff/${staffMember.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                                      {staffMember.firstName} {staffMember.lastName}
                                    </Link>
                                  </div>
                                  <div className="text-2xs sm:text-sm text-secondary-500 truncate max-w-[100px] sm:max-w-full hidden xs:block">
                                    {staffMember.email}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-2xs sm:text-sm text-secondary-500">Staff not found</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            {show ? (
                              <div className="text-xs sm:text-sm font-medium text-secondary-900 truncate max-w-[120px] sm:max-w-full">
                                <Link href={`/shows/${show.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                                  {show.name}
                                </Link>
                              </div>
                            ) : (
                              <span className="text-2xs sm:text-sm text-secondary-500">Show not found</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                            {show ? (
                              <div className="text-2xs sm:text-sm text-secondary-500">
                                {formatDate(show.startDate)} - {formatDate(show.endDate)}
                              </div>
                            ) : (
                              <span className="text-2xs sm:text-sm text-secondary-500">--</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 inline-flex text-2xs sm:text-xs leading-5 font-semibold rounded-full ${
                              booking.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : booking.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {booking.status === 'confirmed' && <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />}
                              {booking.status === 'pending' && <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />}
                              {booking.status === 'cancelled' && <XCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />}
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-2xs sm:text-sm text-secondary-500 hidden md:table-cell">
                            {formatDate(booking.assignedDate)}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-2xs sm:text-sm font-medium">
                            <Link href={`/bookings/${booking.id}`} className="text-primary-600 hover:text-primary-900" onClick={(e) => e.stopPropagation()}>
                              Details <ChevronRightIcon className="h-3 w-3 sm:h-4 sm:w-4 inline ml-0.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 p-3 sm:p-6">
                {filteredBookings.map(booking => {
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
                          <div className="mt-3 flex items-end h-10 gap-px overflow-hidden">
                            {Array.from({ length: Math.min(bookingSummary.days, 15) }).map((_, i) => {
                              // Calculate day staff fullness (random for visualization)
                              const dayIndex = Math.min(i, (booking.datesNeeded || []).length - 1);
                              const dayStaffIds = booking.datesNeeded && dayIndex >= 0 ? 
                                booking.datesNeeded[dayIndex].staffIds || [] : [];
                              const dayStaffCount = booking.datesNeeded && dayIndex >= 0 ? 
                                booking.datesNeeded[dayIndex].staffCount || 1 : 1;
                              const fullness = Math.min(1, dayStaffIds.length / Math.max(1, dayStaffCount));
                              
                              return (
                                <div 
                                  key={i} 
                                  className={`flex-1 rounded-t ${
                                    fullness >= 1 
                                      ? 'bg-success-500' 
                                      : fullness >= 0.5 
                                        ? 'bg-warning-500' 
                                        : 'bg-danger-400'
                                  }`}
                                  style={{ height: `${50 + fullness * 50}%` }}
                                ></div>
                              );
                            })}
                            {bookingSummary.days > 15 && (
                              <div className="flex-1 rounded-t bg-secondary-300 h-1/2 flex items-center justify-center">
                                <span className="text-[8px] text-white font-bold">+{bookingSummary.days - 15}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 