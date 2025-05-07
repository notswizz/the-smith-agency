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
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BuildingOffice2Icon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export default function BookingDetail() {
  const router = useRouter();
  const { bookingId } = router.query;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const { staff = [], clients = [], shows = [] } = useStore();
  
  const [activeTab, setActiveTab] = useState('overview');

  const sortedDatesNeeded = useMemo(() => {
    if (!booking?.datesNeeded) return [];
    return [...booking.datesNeeded].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [booking]);

  const staffingSummary = useMemo(() => {
    if (!booking?.datesNeeded) return { needed: 0, assigned: 0, complete: false, progress: 0 };
    
    const totalStaffNeeded = booking.datesNeeded.reduce((total, date) => 
      total + (date.staffCount || 1), 0);
    
    const totalStaffAssigned = booking.datesNeeded.reduce((total, date) => 
      total + (date.staffIds?.filter(Boolean).length || 0), 0);
      
    return {
      needed: totalStaffNeeded,
      assigned: totalStaffAssigned,
      complete: totalStaffNeeded > 0 && totalStaffAssigned >= totalStaffNeeded,
      progress: totalStaffNeeded > 0 ? Math.round((totalStaffAssigned / totalStaffNeeded) * 100) : 0
    };
  }, [booking]);

  const getStaffName = (id) => {
    const member = staff.find(s => s.id === id);
    if (!member) return '[Unknown Staff]';
    return member.firstName && member.lastName
      ? `${member.firstName} ${member.lastName}`
      : member.name || '[Unknown Staff]';
  };
  
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
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!booking) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
            <ExclamationTriangleIcon className="w-20 h-20 mx-auto text-red-400 mb-6" />
            <h1 className="text-3xl font-bold text-secondary-900 mb-3">Booking Not Found</h1>
            <p className="text-secondary-600 text-lg mb-8">The booking you're looking for doesn't exist or has been removed.</p>
            <Link href="/bookings">
              <Button variant="primary" size="lg">Return to Bookings List</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusLabels = { 'confirmed': 'Confirmed', 'pending': 'Pending', 'cancelled': 'Cancelled' };
  const firstDate = sortedDatesNeeded.length > 0 ? new Date(sortedDatesNeeded[0].date) : null;
  const lastDate = sortedDatesNeeded.length > 0 ? new Date(sortedDatesNeeded[sortedDatesNeeded.length - 1].date) : null;
  
  const formatShortDate = (date) => {
    if (!date) return '--';
    const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return adjustedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusStyles = (status) => {
    switch(status) {
      case 'confirmed': return { badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircleIcon };
      case 'pending': return { badge: 'bg-amber-100 text-amber-700', icon: ClockIcon };
      case 'cancelled': return { badge: 'bg-red-100 text-red-700', icon: XMarkIcon };
      default: return { badge: 'bg-secondary-100 text-secondary-700', icon: InformationCircleIcon };
    }
  };
  const currentStatusStyles = getStatusStyles(booking.status);
  const StatusIcon = currentStatusStyles.icon;

  const renderBookingHeader = () => (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center">
          <Link href="/bookings" className="mr-3">
            <Button variant="ghost" size="sm" className="p-2 text-secondary-600 hover:text-primary-600">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">Booking Overview</h1>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-2 sm:mt-0 items-end sm:items-center">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold ${currentStatusStyles.badge}`}>
            <StatusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            {statusLabels[booking.status] || booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </div>
          <Link href={`/bookings/${bookingId}/edit`} className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto flex items-center justify-center">
              <UserGroupIcon className="h-4 w-4 mr-2" />
              Manage Staff
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );

  const renderKeyInformationCard = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-secondary-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <div className="flex items-center text-secondary-500 mb-1">
            <BuildingOffice2Icon className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Client</span>
          </div>
          <p className="text-lg font-semibold text-secondary-900">{client?.name || 'Unknown Client'}</p>
        </div>
        <div>
          <div className="flex items-center text-secondary-500 mb-1">
            <CalendarIcon className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Show</span>
          </div>
          <p className="text-lg font-semibold text-secondary-900">{show?.name || 'Unknown Show'}</p>
        </div>
        <div>
          <div className="flex items-center text-secondary-500 mb-1">
            <CalendarDaysIcon className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Dates</span>
          </div>
          <p className="text-lg font-semibold text-secondary-900">
            {firstDate && lastDate ? `${formatShortDate(firstDate)} - ${formatShortDate(lastDate)}` : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );

  const renderOverviewContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-secondary-200">
        <div className="flex items-center mb-4">
            <UserGroupIcon className="h-6 w-6 text-primary-500 mr-3" />
            <h3 className="text-xl font-semibold text-secondary-900">Staffing Summary</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-primary-50 p-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-primary-600">{sortedDatesNeeded.length}</p>
            <p className="text-sm text-primary-500">Total Days</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-indigo-600">{staffingSummary.needed}</p>
            <p className="text-sm text-indigo-500">Staff Positions</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-emerald-600">{staffingSummary.assigned}</p>
            <p className="text-sm text-emerald-500">Staff Assigned</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm font-medium text-secondary-700 mb-1">
            <span>Overall Progress</span>
            <span>{staffingSummary.progress}% ({staffingSummary.assigned}/{staffingSummary.needed})</span>
          </div>
          <div className="w-full bg-secondary-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full ${staffingSummary.complete ? 'bg-emerald-500' : 'bg-primary-500'}`}
              style={{ width: `${staffingSummary.progress}%` }}
            ></div>
          </div>
           {staffingSummary.needed > 0 && !staffingSummary.complete && staffingSummary.assigned < staffingSummary.needed && (
            <p className="mt-2 text-sm text-amber-600 flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1.5" />
              This booking needs {staffingSummary.needed - staffingSummary.assigned} more staff.
            </p>
          )}
          {staffingSummary.needed > 0 && staffingSummary.complete && (
             <p className="mt-2 text-sm text-emerald-600 flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-1.5" />
              All staff positions are filled for this booking.
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-secondary-200">
        <div className="flex items-center mb-4">
            <ClipboardDocumentListIcon className="h-6 w-6 text-primary-500 mr-3" />
            <h3 className="text-xl font-semibold text-secondary-900">Notes</h3>
        </div>
        <div className="bg-secondary-50 p-4 rounded-lg min-h-[100px]">
          {booking.notes ? (
            <p className="text-secondary-700 whitespace-pre-wrap text-sm leading-relaxed">{booking.notes}</p>
          ) : (
            <p className="text-secondary-500 italic text-sm">No notes have been added for this booking.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderDailyScheduleContent = () => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-secondary-200">
      <div className="p-5 border-b border-secondary-200 bg-secondary-50 flex items-center justify-between">
        <div className="flex items-center">
          <CalendarDaysIcon className="h-6 w-6 text-primary-500 mr-3" />
          <h3 className="text-xl font-semibold text-secondary-900">Daily Staffing Schedule</h3>
        </div>
        <span className="text-sm bg-primary-100 text-primary-700 font-medium px-3 py-1 rounded-full">
          {sortedDatesNeeded.length} Day{sortedDatesNeeded.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {sortedDatesNeeded.length > 0 ? (
        <div className="divide-y divide-secondary-200 max-h-[calc(100vh-300px)] overflow-y-auto">
          {sortedDatesNeeded.map(({ date, staffCount = 1, staffIds = [] }, i) => {
            const assignedStaffForDate = staffIds.filter(Boolean);
            const isDateFullyStaffed = assignedStaffForDate.length >= staffCount;
            const dateObj = new Date(date);
            const adjustedDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
            const formattedDate = adjustedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

            return (
              <div key={i} className="p-5 hover:bg-secondary-50 transition-colors duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                  <div>
                    <p className="text-lg font-semibold text-primary-600">{formattedDate}</p>
                    <p className="text-sm text-secondary-500">
                      {staffCount} Staff Position{staffCount !== 1 ? 's' : ''} Needed
                    </p>
                  </div>
                  <span className={`mt-2 sm:mt-0 text-xs font-medium px-3 py-1 rounded-full flex items-center
                    ${isDateFullyStaffed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isDateFullyStaffed ? <CheckCircleIcon className="w-4 h-4 mr-1.5" /> : <ClockIcon className="w-4 h-4 mr-1.5" />}
                    {assignedStaffForDate.length}/{staffCount} Assigned
                  </span>
                </div>
                
                {staffCount > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Array.from({ length: staffCount }).map((_, slotIndex) => {
                      const staffId = staffIds[slotIndex];
                      return (
                        <div key={slotIndex} 
                             className={`p-3 rounded-lg border
                                        ${staffId ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                          <div className="flex items-center">
                            <UserGroupIcon className={`w-5 h-5 mr-2 ${staffId ? 'text-emerald-600' : 'text-amber-600'}`} />
                            {staffId ? (
                              <span className="text-sm font-medium text-secondary-800 truncate">{getStaffName(staffId)}</span>
                            ) : (
                              <span className="text-sm text-amber-700 italic">Position Open</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                   <p className="text-sm text-secondary-500">No staff required for this day.</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-10 text-center">
          <CalendarIcon className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
          <p className="text-xl font-semibold text-secondary-700 mb-2">No Dates Scheduled</p>
          <p className="text-secondary-500">There are no dates specified for this booking's schedule.</p>
          <Link href={`/bookings/${bookingId}/edit`} className="mt-6 inline-block">
            <Button variant="primary" size="md">
                <UserGroupIcon className="h-5 w-5 mr-2" /> Manage Staff & Dates
            </Button>
          </Link>
        </div>
      )}
    </div>
  );

  const tabItems = [
    { id: 'overview', label: 'Overview', icon: InformationCircleIcon },
    { id: 'schedule', label: 'Daily Schedule', icon: CalendarDaysIcon },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {renderBookingHeader()}
        {renderKeyInformationCard()}

        <div className="mb-6">
          <div className="block">
            <nav className="flex space-x-1 sm:space-x-2 rounded-lg bg-secondary-100 p-1" aria-label="Tabs">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 group flex items-center justify-center px-3 py-2.5 text-sm font-medium rounded-md transition-all
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary-100
                    ${activeTab === tab.id
                      ? 'bg-white text-primary-600 shadow-md'
                      : 'text-secondary-600 hover:bg-secondary-200 hover:text-secondary-800'
                    }
                  `}
                >
                  <tab.icon className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-primary-500' : 'text-secondary-400 group-hover:text-secondary-500'}`} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div>
          {activeTab === 'overview' && renderOverviewContent()}
          {activeTab === 'schedule' && renderDailyScheduleContent()}
        </div>
        
        <div className="h-16"></div>
      </div>
    </DashboardLayout>
  );
}
