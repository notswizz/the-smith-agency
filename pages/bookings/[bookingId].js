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
    <div className="mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
        <div className="flex items-center">
          <Link href="/bookings" className="mr-2">
            <Button variant="ghost" size="sm" className="p-1.5 text-secondary-600 hover:text-primary-600">
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900">Booking Overview</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-0">
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${currentStatusStyles.badge}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusLabels[booking.status] || booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </div>
          <Link href={`/bookings/${bookingId}/edit`}>
            <Button variant="outline" size="xs" className="flex items-center justify-center">
              <UserGroupIcon className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Manage Staff</span>
              <span className="sm:hidden">Staff</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );

  const renderKeyInformationCard = () => (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 mb-4 sm:mb-6 border border-secondary-200">
      <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-6 text-xs sm:text-base">
        <div>
          <div className="flex items-center text-secondary-500 mb-0.5 sm:mb-1">
            <BuildingOffice2Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="text-xs font-medium">Client</span>
          </div>
          <p className="font-semibold text-secondary-900 text-sm sm:text-base break-words">{client?.name || 'Unknown'}</p>
        </div>
        <div>
          <div className="flex items-center text-secondary-500 mb-0.5 sm:mb-1">
            <CalendarIcon className="h-3.5 w-3.5 sm:h-5 sm:w-5 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="text-xs font-medium">Show</span>
          </div>
          <p className="font-semibold text-secondary-900 text-sm sm:text-base break-words">{show?.name || 'Unknown'}</p>
        </div>
        <div>
          <div className="flex items-center text-secondary-500 mb-0.5 sm:mb-1">
            <CalendarDaysIcon className="h-3.5 w-3.5 sm:h-5 sm:w-5 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="text-xs font-medium">Dates</span>
          </div>
          <p className="font-semibold text-secondary-900 text-sm sm:text-base break-words">
            {firstDate && lastDate ? 
              (firstDate.getTime() === lastDate.getTime() ? 
                formatShortDate(firstDate) : 
                `${formatShortDate(firstDate)} - ${formatShortDate(lastDate)}`
              ) : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );

  const renderOverviewContent = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-secondary-200">
        <div className="flex items-center mb-3 sm:mb-4">
            <UserGroupIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500 mr-2 sm:mr-3" />
            <h3 className="text-lg sm:text-xl font-semibold text-secondary-900">Staffing Summary</h3>
        </div>
        
        <div className="block sm:hidden mb-4">
          <div className="flex justify-between text-xs font-medium text-secondary-700 mb-1">
            <span>Overall: {staffingSummary.assigned}/{staffingSummary.needed} Staff</span>
            <span>{staffingSummary.progress}%</span>
          </div>
          <div className="w-full bg-secondary-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${staffingSummary.complete ? 'bg-emerald-500' : 'bg-primary-500'}`}
              style={{ width: `${staffingSummary.progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
          <div className="bg-primary-50 p-2 sm:p-4 rounded-lg text-center">
            <p className="text-xl sm:text-3xl font-bold text-primary-600">{sortedDatesNeeded.length}</p>
            <p className="text-xs sm:text-sm text-primary-500">Days</p>
          </div>
          <div className="bg-indigo-50 p-2 sm:p-4 rounded-lg text-center">
            <p className="text-xl sm:text-3xl font-bold text-indigo-600">{staffingSummary.needed}</p>
            <p className="text-xs sm:text-sm text-indigo-500">Needed</p>
          </div>
          <div className="bg-emerald-50 p-2 sm:p-4 rounded-lg text-center">
            <p className="text-xl sm:text-3xl font-bold text-emerald-600">{staffingSummary.assigned}</p>
            <p className="text-xs sm:text-sm text-emerald-500">Assigned</p>
          </div>
        </div>
        
        <div className="hidden sm:block">
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
        </div>
        
        {staffingSummary.needed > 0 && !staffingSummary.complete && staffingSummary.assigned < staffingSummary.needed && (
          <p className="mt-2 text-xs sm:text-sm text-amber-600 flex items-center">
            <ExclamationTriangleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span>Need {staffingSummary.needed - staffingSummary.assigned} more staff</span>
          </p>
        )}
        {staffingSummary.needed > 0 && staffingSummary.complete && (
          <p className="mt-2 text-xs sm:text-sm text-emerald-600 flex items-center">
            <CheckCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span>All positions filled</span>
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-secondary-200">
        <div className="flex items-center mb-3 sm:mb-4">
            <ClipboardDocumentListIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500 mr-2 sm:mr-3" />
            <h3 className="text-lg sm:text-xl font-semibold text-secondary-900">Notes</h3>
        </div>
        <div className="bg-secondary-50 p-3 sm:p-4 rounded-lg min-h-[80px] sm:min-h-[100px]">
          {booking.notes ? (
            <p className="text-secondary-700 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">{booking.notes}</p>
          ) : (
            <p className="text-secondary-500 italic text-xs sm:text-sm">No notes have been added for this booking.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderDailyScheduleContent = () => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-secondary-200">
      <div className="p-3 sm:p-5 border-b border-secondary-200 bg-secondary-50 flex items-center justify-between">
        <div className="flex items-center">
          <CalendarDaysIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500 mr-2 sm:mr-3" />
          <h3 className="text-base sm:text-xl font-semibold text-secondary-900">Daily Schedule</h3>
        </div>
        <span className="text-xs bg-primary-100 text-primary-700 font-medium px-2 py-1 rounded-full">
          {sortedDatesNeeded.length} Day{sortedDatesNeeded.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {sortedDatesNeeded.length > 0 ? (
        <div className="divide-y divide-secondary-200 max-h-[calc(100vh-280px)] overflow-y-auto">
          {sortedDatesNeeded.map(({ date, staffCount = 1, staffIds = [] }, i) => {
            const assignedStaffForDate = staffIds.filter(Boolean);
            const isDateFullyStaffed = assignedStaffForDate.length >= staffCount;
            const dateObj = new Date(date);
            const adjustedDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
            const formattedDate = adjustedDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            });

            return (
              <div key={i} className="p-3 sm:p-5 hover:bg-secondary-50 transition-colors duration-150">
                <div className="flex flex-row items-center justify-between mb-2 sm:mb-3">
                  <div>
                    <p className="text-base sm:text-lg font-semibold text-primary-600">{formattedDate}</p>
                    <p className="text-xs sm:text-sm text-secondary-500">
                      {staffCount} Staff Needed
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center whitespace-nowrap
                    ${isDateFullyStaffed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isDateFullyStaffed ? 
                      <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" /> : 
                      <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                    }
                    {assignedStaffForDate.length}/{staffCount}
                  </span>
                </div>
                
                {staffCount > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                    {Array.from({ length: staffCount }).map((_, slotIndex) => {
                      const staffId = staffIds[slotIndex];
                      return (
                        <div key={slotIndex} 
                             className={`p-2 sm:p-3 rounded-lg border text-xs sm:text-sm
                                        ${staffId ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                          <div className="flex items-center">
                            <UserGroupIcon className={`w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0 ${staffId ? 'text-emerald-600' : 'text-amber-600'}`} />
                            {staffId ? (
                              <span className="font-medium text-secondary-800 truncate">{getStaffName(staffId)}</span>
                            ) : (
                              <span className="text-amber-700 italic">Open</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                   <p className="text-xs sm:text-sm text-secondary-500">No staff required for this day.</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 sm:p-10 text-center">
          <CalendarIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-secondary-300 mb-3 sm:mb-4" />
          <p className="text-lg sm:text-xl font-semibold text-secondary-700 mb-1 sm:mb-2">No Dates</p>
          <p className="text-xs sm:text-sm text-secondary-500">There are no dates specified yet.</p>
          <Link href={`/bookings/${bookingId}/edit`} className="mt-4 sm:mt-6 inline-block">
            <Button variant="primary" size="sm">
                <UserGroupIcon className="h-4 w-4 mr-1.5" /> Add Dates
            </Button>
          </Link>
        </div>
      )}
    </div>
  );

  const tabItems = [
    { id: 'overview', label: 'Overview', icon: InformationCircleIcon, shortLabel: 'Info' },
    { id: 'schedule', label: 'Daily Schedule', icon: CalendarDaysIcon, shortLabel: 'Schedule' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-3 sm:py-6 px-3 sm:px-6 lg:px-8">
        {renderBookingHeader()}
        {renderKeyInformationCard()}

        <div className="mb-4 sm:mb-6">
          <div className="block">
            <nav className="flex space-x-1 rounded-lg bg-secondary-100 p-1" aria-label="Tabs">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 group flex items-center justify-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-all
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
                    ${activeTab === tab.id
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-secondary-600 hover:bg-secondary-200 hover:text-secondary-800'
                    }
                  `}
                >
                  <tab.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${activeTab === tab.id ? 'text-primary-500' : 'text-secondary-400 group-hover:text-secondary-500'}`} />
                  <span className="hidden sm:ml-2 sm:inline">{tab.label}</span>
                  <span className="ml-1 sm:hidden">{tab.shortLabel}</span>
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
