import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import useStore from '@/lib/hooks/useStore';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon, 
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BuildingOffice2Icon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function BookingDetail() {
  const router = useRouter();
  const { bookingId } = router.query;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { staff = [], clients = [], shows = [] } = useStore();

  // Sort dates needed chronologically
  const sortedDatesNeeded = useMemo(() => {
    if (!booking?.datesNeeded) return [];
    return [...booking.datesNeeded].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [booking]);

  // Calculate total staff needed vs assigned
  const staffingSummary = useMemo(() => {
    if (!booking?.datesNeeded) return { needed: 0, assigned: 0, complete: false };
    
    const totalStaffNeeded = booking.datesNeeded.reduce((total, date) => 
      total + (date.staffCount || 1), 0);
    
    const totalStaffAssigned = booking.datesNeeded.reduce((total, date) => 
      total + (date.staffIds?.filter(Boolean).length || 0), 0);
      
    return {
      needed: totalStaffNeeded,
      assigned: totalStaffAssigned,
      complete: totalStaffAssigned >= totalStaffNeeded
    };
  }, [booking]);

  // Helper to get staff names by ID
  const getStaffName = (id) => {
    const member = staff.find(s => s.id === id);
    if (!member) return '[Unknown Staff]';
    return member.firstName && member.lastName
      ? `${member.firstName} ${member.lastName}`
      : member.name || '[Unknown Staff]';
  };
  
  // Helper to get client and show
  const client = useMemo(() => {
    if (!booking) return null;
    return clients.find(c => c.id === booking.clientId) || null;
  }, [booking, clients]);
  
  const show = useMemo(() => {
    if (!booking) return null;
    return shows.find(s => s.id === booking.showId) || null;
  }, [booking, shows]);

  useEffect(() => {
    if (!bookingId) return;
    async function fetchBooking() {
      const docRef = doc(db, 'bookings', bookingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBooking({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    }
    fetchBooking();
  }, [bookingId]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      try {
        setDeleting(true);
        await deleteDoc(doc(db, 'bookings', bookingId));
        router.push('/bookings');
      } catch (error) {
        console.error('Error deleting booking:', error);
        setDeleting(false);
        alert('Failed to delete booking. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!booking) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-red-500 text-4xl mb-4">
              <ExclamationTriangleIcon className="w-16 h-16 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">Booking Not Found</h1>
            <p className="text-secondary-600 mb-6">The booking you're looking for doesn't exist or has been removed.</p>
            <Link href="/bookings">
              <Button variant="primary">Return to Bookings</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Format the status labels
  const statusLabels = {
    'confirmed': 'Confirmed',
    'pending': 'Pending',
    'cancelled': 'Cancelled'
  };

  // Get date range
  const firstDate = sortedDatesNeeded.length > 0 ? new Date(sortedDatesNeeded[0].date) : null;
  const lastDate = sortedDatesNeeded.length > 0 ? new Date(sortedDatesNeeded[sortedDatesNeeded.length - 1].date) : null;
  const formatShortDate = (date) => {
    if (!date) return '--';
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get status colors
  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'emerald';
      case 'pending': return 'amber';
      case 'cancelled': return 'red';
      default: return 'secondary';
    }
  };
  
  const statusColor = getStatusColor(booking.status);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header with back button and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center">
            <Link href="/bookings" className="mr-4">
              <Button variant="ghost" size="sm" className="flex items-center text-secondary-600">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-500">
              Booking Details
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/bookings/${bookingId}/edit`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <PencilIcon className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button 
              variant="danger" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
              ) : (
                <TrashIcon className="h-4 w-4" />
              )}
              Delete
            </Button>
          </div>
        </div>

        {/* Main content - Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Booking details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking overview card */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-secondary-200">
              {/* Status header */}
              <div className={`h-2 w-full bg-gradient-to-r from-${statusColor}-500 to-${statusColor}-400`} />

              <div className="p-6">
                {/* Booking header with client, show and status */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BuildingOffice2Icon className="h-5 w-5 text-primary-500" />
                      <h2 className="text-xl font-semibold text-secondary-900">
                        {client?.name || 'Unknown Client'}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 ml-7">
                      <p className="text-base text-secondary-700">
                        {show?.name || 'Unknown Show'}
                      </p>
                    </div>
                  </div>

                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium 
                    ${booking.status === 'confirmed' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : booking.status === 'pending' 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {booking.status === 'confirmed' && (
                      <CheckCircleIcon className="w-4 h-4" />
                    )}
                    {booking.status === 'pending' && (
                      <ClockIcon className="w-4 h-4" />
                    )}
                    {booking.status === 'cancelled' && (
                      <XMarkIcon className="w-4 h-4" />
                    )}
                    {statusLabels[booking.status] || booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </div>
                </div>

                {/* Stats summary */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 mb-6 shadow-sm">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center text-indigo-600 mb-1">
                        <CalendarIcon className="h-5 w-5 mr-1" /> 
                        <span className="text-sm font-medium">Days Booked</span>
                      </div>
                      <span className="text-2xl font-bold">{sortedDatesNeeded.length}</span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className="flex items-center text-indigo-600 mb-1">
                        <UserGroupIcon className="h-5 w-5 mr-1" /> 
                        <span className="text-sm font-medium">Staff Needed</span>
                      </div>
                      <span className="text-2xl font-bold">{staffingSummary.needed}</span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className="flex items-center text-indigo-600 mb-1">
                        <CheckCircleIcon className="h-5 w-5 mr-1" /> 
                        <span className="text-sm font-medium">Staff Assigned</span>
                      </div>
                      <span className="text-2xl font-bold">{staffingSummary.assigned}</span>
                    </div>
                  </div>
                </div>

                {/* Key stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Date information */}
                  <div className="bg-white rounded-lg p-4 border border-secondary-200 shadow-sm">
                    <div className="flex items-center mb-3">
                      <CalendarIcon className="h-5 w-5 text-primary-600 mr-2" />
                      <h3 className="text-sm font-medium text-secondary-900">Booking Period</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-secondary-500">Start Date:</span>
                        <span className="text-sm font-medium text-secondary-900">{formatShortDate(firstDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-secondary-500">End Date:</span>
                        <span className="text-sm font-medium text-secondary-900">{formatShortDate(lastDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-secondary-500">Total Days:</span>
                        <span className="text-sm font-medium text-secondary-900">{sortedDatesNeeded.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Staff information */}
                  <div className="bg-white rounded-lg p-4 border border-secondary-200 shadow-sm">
                    <div className="flex items-center mb-3">
                      <UserGroupIcon className="h-5 w-5 text-primary-600 mr-2" />
                      <h3 className="text-sm font-medium text-secondary-900">Staff</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-secondary-500">Required:</span>
                        <span className="text-sm font-medium text-secondary-900">{staffingSummary.needed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-secondary-500">Assigned:</span>
                        <span className="text-sm font-medium text-secondary-900">{staffingSummary.assigned}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-secondary-500">Status:</span>
                        <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                          staffingSummary.complete 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {staffingSummary.complete ? 'Complete' : 'Needs Staff'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Show information */}
                  {show && (
                    <div className="bg-white rounded-lg p-4 border border-secondary-200 shadow-sm">
                      <div className="flex items-center mb-3">
                        <svg className="h-5 w-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        <h3 className="text-sm font-medium text-secondary-900">Show Info</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-secondary-500">Type:</span>
                          <span className="text-sm font-medium text-secondary-900">{show.type || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-secondary-500">Location:</span>
                          <span className="text-sm font-medium text-secondary-900">{show.location || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-secondary-500">Season:</span>
                          <span className="text-sm font-medium text-secondary-900">{show.season || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes section */}
                <div>
                  <div className="flex items-center mb-3">
                    <DocumentTextIcon className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="text-sm font-medium text-secondary-900">Notes</h3>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-secondary-200 shadow-sm min-h-[80px]">
                    {booking.notes ? (
                      <p className="text-secondary-700 whitespace-pre-wrap text-sm">{booking.notes}</p>
                    ) : (
                      <p className="text-secondary-400 italic text-sm">No notes added</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Staff schedule */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-secondary-200 sticky top-6">
              <div className="p-4 border-b border-secondary-200 bg-secondary-50 flex items-center justify-between">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-primary-600 mr-2" />
                  <h3 className="font-medium text-secondary-900">Schedule</h3>
                </div>
                <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                  {sortedDatesNeeded.length} date{sortedDatesNeeded.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {sortedDatesNeeded.length > 0 ? (
                <div className="p-3 max-h-[800px] overflow-y-auto">
                  <div className="space-y-3">
                    {sortedDatesNeeded.map(({ date, staffCount = 1, staffIds }, i) => (
                      <div key={i} className="bg-secondary-50 rounded-lg p-3 border border-secondary-100">
                        <div className="flex flex-col mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 text-primary-600 mr-1.5 flex-shrink-0" />
                              <span className="font-medium text-sm line-clamp-1">
                                {new Date(date).toLocaleDateString('en-US', { 
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0
                              ${(staffIds?.filter(Boolean).length || 0) >= (staffCount || 1)
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {staffIds?.filter(Boolean).length || 0}/{staffCount || 1}
                            </span>
                          </div>
                        </div>
                        
                        <div className="ml-6">
                          {staffIds?.some(id => id) ? (
                            <div className="flex flex-col gap-1.5">
                              {staffIds.filter(Boolean).map((staffId, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-primary-100 text-primary-700 text-xs shadow-sm">
                                  <UserGroupIcon className="w-3.5 h-3.5 mr-1" />
                                  {getStaffName(staffId)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-white border border-amber-100 text-amber-700 rounded-md p-1.5 flex items-center shadow-sm">
                              <ExclamationTriangleIcon className="w-3.5 h-3.5 mr-1" />
                              <span className="text-xs">No staff assigned</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <CalendarIcon className="w-12 h-12 mx-auto text-secondary-300 mb-3" />
                  <p className="text-secondary-500">No dates selected for this booking</p>
                  <div className="mt-4">
                    <Link href={`/bookings/${bookingId}/edit`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1 mx-auto">
                        <PencilIcon className="h-4 w-4" />
                        Add Dates
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
