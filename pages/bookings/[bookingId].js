import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
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
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

export default function BookingDetail() {
  const router = useRouter();
  const { bookingId } = router.query;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
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
            <div className="text-danger-500 text-4xl mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header with back button and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center">
            <Link href="/bookings" className="mr-4">
              <Button variant="ghost" size="sm" className="flex items-center text-secondary-600">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-secondary-900">Booking Details</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/bookings/${bookingId}/edit`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <PencilIcon className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="danger" size="sm" className="flex items-center gap-1">
              <TrashIcon className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-6">
          {/* Booking overview card */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-secondary-200 relative">
            {/* Status header */}
            <div className={`h-2 w-full ${
              booking.status === 'confirmed' 
                ? 'bg-success-500' 
                : booking.status === 'pending' 
                  ? 'bg-warning-500'
                  : 'bg-danger-500'
            }`} />

            <div className="p-6">
              {/* Booking header with client, show and status */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BuildingOfficeIcon className="h-5 w-5 text-primary-500" />
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

                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                  booking.status === 'confirmed' 
                    ? 'bg-success-100 text-success-700' 
                    : booking.status === 'pending' 
                      ? 'bg-warning-100 text-warning-700'
                      : 'bg-danger-100 text-danger-700'
                }`}>
                  {booking.status === 'confirmed' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {booking.status === 'pending' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {booking.status === 'cancelled' && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {statusLabels[booking.status] || booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </div>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Date information */}
                <div className="bg-secondary-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CalendarIcon className="h-5 w-5 text-secondary-500 mr-2" />
                    <h3 className="text-sm font-medium text-secondary-900">Booking Period</h3>
                  </div>
                  <div className="space-y-1">
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
                <div className="bg-secondary-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <UserGroupIcon className="h-5 w-5 text-secondary-500 mr-2" />
                    <h3 className="text-sm font-medium text-secondary-900">Staff</h3>
                  </div>
                  <div className="space-y-1">
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
                          ? 'bg-success-100 text-success-800' 
                          : 'bg-warning-100 text-warning-800'
                      }`}>
                        {staffingSummary.complete ? 'Complete' : 'Needs Staff'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Show information */}
                {show && (
                  <div className="bg-secondary-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <svg className="h-5 w-5 text-secondary-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      <h3 className="text-sm font-medium text-secondary-900">Show Info</h3>
                    </div>
                    <div className="space-y-1">
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
              {(booking.notes || true) && (
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <DocumentTextIcon className="h-5 w-5 text-secondary-500 mr-2" />
                    <h3 className="text-sm font-medium text-secondary-900">Notes</h3>
                  </div>
                  <div className="bg-secondary-50 rounded-lg p-4 min-h-[80px]">
                    {booking.notes ? (
                      <p className="text-secondary-700 whitespace-pre-wrap text-sm">{booking.notes}</p>
                    ) : (
                      <p className="text-secondary-400 italic text-sm">No notes added</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Staff schedule card */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-secondary-200">
            <div className="p-4 border-b border-secondary-200 flex items-center justify-between">
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-secondary-500 mr-2" />
                <h3 className="font-medium text-secondary-900">Schedule</h3>
              </div>
              <span className="text-xs text-secondary-500">
                {sortedDatesNeeded.length} date{sortedDatesNeeded.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {sortedDatesNeeded.length > 0 ? (
              <div className="p-4">
                <div className="space-y-4">
                  {sortedDatesNeeded.map((date, i) => (
                    <div key={i} className="bg-secondary-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className={`w-2.5 h-2.5 rounded-full mr-3 ${
                            date.staffIds?.some(id => id)
                              ? 'bg-success-500'
                              : 'bg-secondary-300'
                          }`} />
                          <span className="text-sm font-medium text-secondary-900">
                            {new Date(date.date).toLocaleDateString('en-US', { 
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-secondary-500 bg-white px-2 py-1 rounded-full">
                          {date.staffIds?.filter(Boolean).length || 0}/{date.staffCount || 1} Staff
                        </span>
                      </div>
                      <div className="ml-5">
                        {date.staffIds?.some(id => id) ? (
                          <div className="flex flex-wrap gap-1">
                            {date.staffIds.filter(Boolean).map((staffId, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-success-50 text-success-700 text-xs">
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {getStaffName(staffId)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-secondary-400 text-xs flex items-center">
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            No staff assigned
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 mx-auto text-secondary-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
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
    </DashboardLayout>
  );
}
