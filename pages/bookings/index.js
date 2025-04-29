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
  MagnifyingGlassIcon
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
        <div className="space-y-6">
          {/* Header with title and actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-secondary-900">Staff Bookings</h1>
            <div className="mt-4 sm:mt-0 flex items-center gap-2">
              <Button variant={viewMode==='table' ? 'primary' : 'outline'} size="sm" onClick={()=>setViewMode('table')}>Table</Button>
              <Button variant={viewMode==='card' ? 'primary' : 'outline'} size="sm" onClick={()=>setViewMode('card')}>Card</Button>
              <Link href="/bookings/new">
                <Button variant="primary" size="sm" className="flex items-center">
                  <PlusIcon className="h-5 w-5 mr-1" /> New Booking
                </Button>
              </Link>
            </div>
          </div>

          {/* Search and filters */}
          <div className="bg-white shadow-sm rounded-lg">
            <div className="p-4">
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleSearchChange}
                    placeholder="Search staff, shows, or roles..."
                    className="pl-10 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center w-full md:w-auto justify-center"
                  >
                    <FunnelIcon className="h-5 w-5 mr-1" />
                    Filters
                    {hasActiveFilters && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        Active
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Filter options */}
              {isFilterOpen && (
                <div className="mt-4 border-t border-secondary-200 pt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-secondary-700">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="all">All Statuses</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="show" className="block text-sm font-medium text-secondary-700">
                      Show
                    </label>
                    <select
                      id="show"
                      name="show"
                      value={filters.show}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
                    <label htmlFor="dateRange" className="block text-sm font-medium text-secondary-700">
                      Date Range
                    </label>
                    <select
                      id="dateRange"
                      name="dateRange"
                      value={filters.dateRange}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
                      className="flex items-center"
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Results count */}
            <div className="border-t border-secondary-200 px-4 py-2">
              <p className="text-sm text-secondary-500">
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Staff Member
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Show
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Dates
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Assigned
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {filteredBookings.map((booking) => {
                      const staffMember = staff.find(s => s.id === booking.staffId);
                      const show = shows.find(s => s.id === booking.showId);
                      
                      return (
                        <tr key={booking.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {staffMember ? (
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-secondary-200 flex items-center justify-center text-secondary-600">
                                    {staffMember.firstName.charAt(0)}{staffMember.lastName.charAt(0)}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-secondary-900">
                                    <Link href={`/staff/${staffMember.id}`} className="hover:underline">
                                      {staffMember.firstName} {staffMember.lastName}
                                    </Link>
                                  </div>
                                  <div className="text-sm text-secondary-500">
                                    {staffMember.email}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-secondary-500">Staff not found</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {show ? (
                              <div className="text-sm font-medium text-secondary-900">
                                <Link href={`/shows/${show.id}`} className="hover:underline">
                                  {show.name}
                                </Link>
                              </div>
                            ) : (
                              <span className="text-secondary-500">Show not found</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {show ? (
                              <div className="text-sm text-secondary-500">
                                {formatDate(show.startDate)} - {formatDate(show.endDate)}
                              </div>
                            ) : (
                              <span className="text-secondary-500">--</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              booking.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : booking.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {booking.status === 'confirmed' && <CheckCircleIcon className="h-4 w-4 mr-1" />}
                              {booking.status === 'pending' && <ClockIcon className="h-4 w-4 mr-1" />}
                              {booking.status === 'cancelled' && <XCircleIcon className="h-4 w-4 mr-1" />}
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                            {formatDate(booking.assignedDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/bookings/${booking.id}`} className="text-primary-600 hover:text-primary-900">
                              Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  
                  return (
                    <div
                      key={booking.id}
                      className="group relative overflow-hidden rounded-xl bg-white transition-all duration-200 hover:shadow-lg border border-secondary-200 hover:border-primary-300"
                      onClick={() => router.push(`/bookings/${booking.id}`)}
                      tabIndex={0}
                      role="button"
                      aria-label={`View booking for ${getClientName(booking.clientId)}`}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.push(`/bookings/${booking.id}`); }}
                    >
                      {/* Decorative header bar */}
                      <div className={`h-2 w-full ${
                        booking.status === 'confirmed' 
                          ? 'bg-success-500' 
                          : booking.status === 'pending' 
                            ? 'bg-warning-500'
                            : 'bg-danger-500'
                      }`}></div>
                      
                      <div className="p-5">
                        {/* Top section with status and edit button */}
                        <div className="flex justify-between items-start mb-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' 
                              ? 'bg-success-100 text-success-700' 
                              : booking.status === 'pending' 
                                ? 'bg-warning-100 text-warning-700'
                                : 'bg-danger-100 text-danger-700'
                          }`}>
                            {booking.status === 'confirmed' && (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {booking.status === 'pending' && (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            {booking.status === 'cancelled' && (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            {statusLabels[booking.status] || booking.status}
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/bookings/${booking.id}/edit`);
                            }}
                            className="p-1.5 rounded-md text-secondary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            aria-label="Edit booking"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Client and Show Info */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
                              {client?.name || getClientName(booking.clientId)}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 pl-6">
                            <h4 className="text-base font-medium text-secondary-700">
                              {show?.name || getShowName(booking.showId)}
                            </h4>
                          </div>
                        </div>
                        
                        {/* Booking Details */}
                        <div className="bg-secondary-50 rounded-lg p-3 space-y-3">
                          {/* Date Range */}
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-secondary-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <div className="text-xs uppercase tracking-wide text-secondary-500 font-medium">Booking Period</div>
                              <div className="text-sm font-medium text-secondary-800">
                                {firstDate && lastDate ? (
                                  sortedDates.length > 1 ? 
                                    `${formatDate(firstDate)} - ${formatDate(lastDate)}` : 
                                    formatDate(firstDate)
                                ) : 'No dates selected'}
                                <span className="ml-1 text-xs text-secondary-500">({bookingSummary.days} days)</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Staff Status */}
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-secondary-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-3-3h-2m-4 0H9a3 3 0 00-3 3v2m4-10a4 4 0 11-8 0 4 4 0 018 0zm0 0a4 4 0 100-8 4 4 0 000 8z" />
                            </svg>
                            <div>
                              <div className="text-xs uppercase tracking-wide text-secondary-500 font-medium">Staff Requirements</div>
                              <div className="text-sm font-medium text-secondary-800">
                                <div className="flex items-center gap-2">
                                  <span>{totalStaffAssigned}/{totalStaffNeeded} Staff Assigned</span>
                                  {totalStaffAssigned < totalStaffNeeded && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-100 text-warning-800">
                                      Need {totalStaffNeeded - totalStaffAssigned} more
                                    </span>
                                  )}
                                  {totalStaffAssigned >= totalStaffNeeded && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-100 text-success-800">
                                      Complete
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
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