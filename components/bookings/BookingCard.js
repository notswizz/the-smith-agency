import React from 'react';
import { useRouter } from 'next/router';
import { 
  CheckCircleIcon, 
  ClockIcon,
  CalendarDaysIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

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
    if (!Array.isArray(datesNeeded) || datesNeeded.length === 0) return { dates: 0, days: 0 };
    const datesWithStaff = datesNeeded.filter(d => (d.staffCount || 0) > 0);
    const dates = datesWithStaff.length;
    const days = datesWithStaff.reduce((total, date) => total + (date.staffCount || 0), 0);
    return { dates, days };
  };

  const bookingSummary = getBookingSummary(booking.datesNeeded);
  
  // Get sorted dates for the booking
  const sortedDates = booking.datesNeeded ? 
    [...booking.datesNeeded].filter(d => (d.staffCount || 0) > 0).sort((a, b) => new Date(a.date) - new Date(b.date)) : 
    [];
  const firstDate = sortedDates.length > 0 ? sortedDates[0].date : null;
  const lastDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1].date : null;
  
  // Calculate staff needed vs assigned
  const totalStaffNeeded = booking.datesNeeded?.reduce((total, date) => total + (date.staffCount || 0), 0) || 0;
  const totalStaffAssigned = booking.datesNeeded?.reduce((total, date) => 
    total + (date.staffIds?.filter(Boolean).length || 0), 0) || 0;
  
  // Format date range
  const formatDateRange = () => {
    if (!firstDate || !lastDate) return 'No dates';
    const start = new Date(firstDate);
    const end = new Date(lastDate);
    const adjustedStart = new Date(start.getTime() + start.getTimezoneOffset() * 60000);
    const adjustedEnd = new Date(end.getTime() + end.getTimezoneOffset() * 60000);
    
    const startMonth = adjustedStart.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = adjustedEnd.toLocaleDateString('en-US', { month: 'short' });
    
    if (startMonth === endMonth && adjustedStart.getFullYear() === adjustedEnd.getFullYear()) {
      if (adjustedStart.getDate() === adjustedEnd.getDate()) {
        return `${startMonth} ${adjustedStart.getDate()}`;
      }
      return `${startMonth} ${adjustedStart.getDate()}-${adjustedEnd.getDate()}`;
    }
    return `${startMonth} ${adjustedStart.getDate()} - ${endMonth} ${adjustedEnd.getDate()}`;
  };

  const completionPercentage = totalStaffNeeded > 0 ? Math.round((totalStaffAssigned / totalStaffNeeded) * 100) : 0;
  const isComplete = totalStaffNeeded > 0 && totalStaffAssigned >= totalStaffNeeded;

  // Status badge config
  const statusConfig = {
    pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700' },
    booked: { label: 'Booked', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    confirmed: { label: 'Confirmed', bg: 'bg-violet-100', text: 'text-violet-700' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700' },
  };
  const bookingStatusBadge = statusConfig[booking.status] || null;

  // Payment status badge config
  const paymentConfig = {
    deposit_paid: { label: 'Deposit', bg: 'bg-blue-100', text: 'text-blue-700' },
    final_paid: { label: 'Paid', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  };
  const paymentStatusBadge = paymentConfig[booking.paymentStatus] || null;

  return (
    <div
      className="group relative bg-white rounded-xl border border-secondary-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={() => router.push(`/bookings/${booking.id}`)}
    >
      {/* Header */}
      <div className="p-3 pb-2">
        {/* Client & Show */}
        <div className="mb-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-semibold text-sm text-secondary-900 truncate group-hover:text-primary-600 transition-colors leading-tight flex-1">
              {client?.name || 'Unknown Client'}
            </h3>
            {bookingStatusBadge && (
              <span className={`${bookingStatusBadge.bg} ${bookingStatusBadge.text} text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0`}>
                {bookingStatusBadge.label}
              </span>
            )}
            {paymentStatusBadge && (
              <span className={`${paymentStatusBadge.bg} ${paymentStatusBadge.text} text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0`}>
                {paymentStatusBadge.label}
              </span>
            )}
          </div>
          <p className="text-xs text-secondary-500 truncate leading-tight">{show?.name || 'Unknown Show'}</p>
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-1.5 text-xs text-secondary-400 mb-2">
          <CalendarDaysIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{formatDateRange()}</span>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-secondary-900">{bookingSummary.dates}</span>
            <span className="text-secondary-400">dates</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`font-semibold ${isComplete ? 'text-emerald-600' : 'text-secondary-900'}`}>
              {totalStaffAssigned}/{totalStaffNeeded}
            </span>
            <span className="text-secondary-400">staff</span>
          </div>
          <div className={`font-semibold ${isComplete ? 'text-emerald-600' : completionPercentage >= 50 ? 'text-amber-600' : 'text-secondary-900'}`}>
            {completionPercentage}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-3 pb-2">
        <div className="h-1 bg-secondary-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete ? 'bg-emerald-500' : completionPercentage >= 50 ? 'bg-amber-500' : 'bg-primary-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Day Bars */}
      {sortedDates.length > 0 && (
        <div className="px-3 pb-2">
          <div className="flex gap-0.5">
            {sortedDates.slice(0, 14).map((day, i) => {
              const dayStaffIds = Array.isArray(day.staffIds) ? day.staffIds.filter(Boolean) : [];
              const dayStaffCount = day.staffCount || 0;
              const filledCount = dayStaffIds.length;
              const isFull = filledCount >= dayStaffCount;
              const isPartial = filledCount > 0 && filledCount < dayStaffCount;
              
              return (
                <div 
                  key={i} 
                  className={`flex-1 h-5 rounded-sm transition-colors ${
                    isFull ? 'bg-emerald-400' : isPartial ? 'bg-amber-400' : 'bg-secondary-200'
                  }`}
                  onMouseEnter={(e) => showTooltip?.(e, i, booking.id)}
                  onMouseLeave={() => hideTooltip?.()}
                />
              );
            })}
            {sortedDates.length > 14 && (
              <div className="flex-1 h-5 rounded-sm bg-secondary-200 flex items-center justify-center">
                <span className="text-[9px] text-secondary-500 font-medium">+{sortedDates.length - 14}</span>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default BookingCard;
