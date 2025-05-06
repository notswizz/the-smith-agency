import React from 'react';
import { useRouter } from 'next/router';
import { formatDate } from '@/utils/dateUtils';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const BookingCard = ({ 
  booking, 
  staff, 
  client, 
  show, 
  showTooltip,
  hideTooltip
}) => {
  const router = useRouter();
  
  // Get booking summary information
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

  const bookingSummary = getBookingSummary(booking.datesNeeded);
  
  // Get sorted dates for the booking
  const sortedDates = booking.datesNeeded ? 
    [...booking.datesNeeded].sort((a, b) => new Date(a.date) - new Date(b.date)) : 
    [];
  const firstDate = sortedDates.length > 0 ? sortedDates[0].date : null;
  const lastDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1].date : null;
  
  // Calculate staff needed vs assigned
  const totalStaffNeeded = booking.datesNeeded?.reduce((total, date) => total + (date.staffCount || 1), 0) || 0;
  const totalStaffAssigned = booking.datesNeeded?.reduce((total, date) => 
    total + (date.staffIds?.filter(Boolean).length || 0), 0) || 0;
  
  // Status information
  const statusLabels = {
    'confirmed': 'Confirmed',
    'pending': 'Pending',
    'cancelled': 'Cancelled'
  };
  
  const statusColors = {
    'confirmed': 'success',
    'pending': 'warning',
    'cancelled': 'danger'
  };
  
  const statusColor = statusColors[booking.status] || 'secondary';

  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-white transition-all duration-200 hover:shadow-lg border border-secondary-200 hover:border-primary-300 flex flex-col"
      onClick={() => router.push(`/bookings/${booking.id}`)}
      tabIndex={0}
      role="button"
      aria-label={`View booking for ${client?.name || 'Unknown Client'}`}
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
                {client?.name || '[Unknown Client]'}
              </h3>
              <h4 className="text-xs sm:text-sm font-medium text-secondary-600">
                {show?.name || '[Unknown Show]'}
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
              // Calculate day staff fullness
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
};

export default BookingCard; 