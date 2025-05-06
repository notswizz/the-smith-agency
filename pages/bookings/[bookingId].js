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
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function BookingDetail() {
  const router = useRouter();
  const { bookingId } = router.query;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { staff = [], clients = [], shows = [] } = useStore();
  
  // Tab state for mobile view
  const [activeTab, setActiveTab] = useState('details');

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
    // Adjust for timezone offset to fix date being behind by 1 day
    const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return adjustedDate.toLocaleDateString('en-US', { 
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

  // Render booking details content
  const renderDetailsContent = () => (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-secondary-200">
      {/* Status header */}
      <div className={`h-2 w-full bg-gradient-to-r from-${statusColor}-500 to-${statusColor}-400`} />

      <div className="p-4 sm:p-6">
        {/* Booking header with client, show and status */}
        <div className="flex flex-col mb-4 sm:mb-6">
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <BuildingOffice2Icon className="h-5 w-5 text-primary-500 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-semibold text-secondary-900 line-clamp-1">
                {client?.name || 'Unknown Client'}
              </h2>
            </div>
            <div className="flex items-center gap-2 ml-7">
              <p className="text-sm sm:text-base text-secondary-700 line-clamp-1">
                {show?.name || 'Unknown Show'}
              </p>
            </div>
            {/* Subtle date range */}
            <div className="flex items-center gap-1 ml-7 mt-1 text-xs text-secondary-500">
              <CalendarIcon className="h-3 w-3" />
              <span>{formatShortDate(firstDate)} - {formatShortDate(lastDate)}</span>
            </div>
          </div>

          {/* Status badge for tablet/desktop */}
          <div className="hidden sm:flex">
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
        </div>

        {/* Stats summary - Improved for mobile */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="flex flex-col items-center p-1 sm:p-2">
              <div className="flex items-center text-indigo-600 mb-1">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> 
                <span className="text-xs sm:text-sm font-medium">Days</span>
              </div>
              <span className="text-lg sm:text-2xl font-bold">{sortedDatesNeeded.length}</span>
            </div>
            
            <div className="flex flex-col items-center p-1 sm:p-2">
              <div className="flex items-center text-indigo-600 mb-1">
                <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> 
                <span className="text-xs sm:text-sm font-medium">Needed</span>
              </div>
              <span className="text-lg sm:text-2xl font-bold">{staffingSummary.needed}</span>
            </div>
            
            <div className="flex flex-col items-center p-1 sm:p-2">
              <div className="flex items-center text-indigo-600 mb-1">
                <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> 
                <span className="text-xs sm:text-sm font-medium">Assigned</span>
              </div>
              <span className="text-lg sm:text-2xl font-bold">{staffingSummary.assigned}</span>
            </div>
          </div>
        </div>

        {/* Notes section - improved spacing and padding */}
        <div>
          <div className="flex items-center mb-2 sm:mb-3">
            <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2" />
            <h3 className="text-sm font-medium text-secondary-900">Notes</h3>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-secondary-200 shadow-sm min-h-[80px]">
            {booking.notes ? (
              <p className="text-secondary-700 whitespace-pre-wrap text-sm leading-relaxed">{booking.notes}</p>
            ) : (
              <p className="text-secondary-400 italic text-sm">No notes added</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Render schedule content
  const renderScheduleContent = () => (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-secondary-200">
      <div className="p-3 sm:p-4 border-b border-secondary-200 bg-secondary-50 flex items-center justify-between">
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2" />
          <h3 className="font-medium text-sm sm:text-base text-secondary-900">Schedule</h3>
        </div>
        <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
          {sortedDatesNeeded.length} date{sortedDatesNeeded.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {sortedDatesNeeded.length > 0 ? (
        <div className="p-2 sm:p-3 max-h-[500px] sm:max-h-[800px] overflow-y-auto">
          <div className="space-y-2 sm:space-y-3">
            {sortedDatesNeeded.map(({ date, staffCount = 1, staffIds }, i) => (
              <div key={i} className="bg-secondary-50 rounded-lg p-2 sm:p-3 border border-secondary-100">
                <div className="flex flex-col mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <ClockIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600 mr-1.5 flex-shrink-0" />
                      <span className="font-medium text-xs sm:text-sm line-clamp-1">
                        {(() => {
                          const dateObj = new Date(date);
                          // Adjust for timezone offset to fix date being behind by 1 day
                          const adjustedDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
                          return adjustedDate.toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          });
                        })()}
                      </span>
                    </div>
                    <span className={`text-2xs sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0
                      ${(staffIds?.filter(Boolean).length || 0) >= (staffCount || 1)
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {staffIds?.filter(Boolean).length || 0}/{staffCount || 1}
                    </span>
                  </div>
                </div>
                
                <div className="ml-5 sm:ml-6">
                  {staffIds?.some(id => id) ? (
                    <div className="flex flex-col gap-1.5">
                      {staffIds.filter(Boolean).map((staffId, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-primary-100 text-primary-700 text-xs shadow-sm">
                          <UserGroupIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                          <span className="truncate">{getStaffName(staffId)}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border border-amber-100 text-amber-700 rounded-md p-1.5 flex items-center shadow-sm">
                      <ExclamationTriangleIcon className="w-3 w-3 sm:w-3.5 sm:h-3.5 mr-1" />
                      <span className="text-2xs sm:text-xs">No staff assigned</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6 sm:p-8 text-center">
          <CalendarIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-secondary-300 mb-3" />
          <p className="text-sm text-secondary-500">No dates selected for this booking</p>
          <div className="mt-4">
            <Link href={`/bookings/${bookingId}/edit`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1 mx-auto">
                <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                Add Dates
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
        {/* Header with back button and actions - improved for mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/bookings" className="mr-3">
                <Button variant="ghost" size="sm" className="flex items-center text-secondary-600 p-1 sm:p-2">
                  <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline ml-1">Back</span>
                </Button>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-500">
                Booking Details
              </h1>
            </div>
            
            {/* Status badge - moved to header for mobile visibility */}
            <div className="sm:hidden">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium 
                ${booking.status === 'confirmed' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : booking.status === 'pending' 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                {booking.status === 'confirmed' && (
                  <CheckCircleIcon className="w-3 h-3" />
                )}
                {booking.status === 'pending' && (
                  <ClockIcon className="w-3 h-3" />
                )}
                {booking.status === 'cancelled' && (
                  <XMarkIcon className="w-3 h-3" />
                )}
                {statusLabels[booking.status]}
              </div>
            </div>
          </div>
          
          {/* Action buttons - stacked on mobile, side by side on desktop */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <Link href={`/bookings/${bookingId}/edit`} className="flex-1 sm:flex-auto">
              <Button variant="outline" size="sm" className="flex items-center justify-center gap-1 w-full">
                <PencilIcon className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button 
              variant="danger" 
              size="sm" 
              className="flex items-center justify-center gap-1 flex-1 sm:flex-auto"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <TrashIcon className="h-4 w-4" />
              )}
              Delete
            </Button>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="lg:hidden flex border-b border-secondary-200 mb-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2.5 px-2 text-sm font-medium flex justify-center items-center gap-2 ${
              activeTab === 'details'
                ? 'text-primary-600 border-b-2 border-primary-500'
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            <InformationCircleIcon className="h-4 w-4" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-2.5 px-2 text-sm font-medium flex justify-center items-center gap-2 ${
              activeTab === 'schedule'
                ? 'text-primary-600 border-b-2 border-primary-500'
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            Schedule
            <span className="bg-primary-100 text-primary-800 text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1">
              {sortedDatesNeeded.length}
            </span>
          </button>
        </div>

        {/* Main content - Single column with tabs on mobile, two columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left column - Booking details */}
          <div className={`lg:col-span-2 space-y-4 sm:space-y-6 ${activeTab !== 'details' && 'hidden lg:block'}`}>
            {renderDetailsContent()}
          </div>

          {/* Right column - Staff schedule */}
          <div className={`lg:col-span-1 ${activeTab !== 'schedule' && 'hidden lg:block'}`}>
            {renderScheduleContent()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
