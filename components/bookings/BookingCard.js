import React from 'react';
import { useRouter } from 'next/router';
import { formatDate } from '@/utils/dateUtils';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  CalendarIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  PencilSquareIcon
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
    if (!Array.isArray(datesNeeded) || datesNeeded.length === 0) return { dates: 0, days: 0, staffNames: [], staffIds: [] };
    
    // Only count dates where staffCount > 0
    const datesWithStaff = datesNeeded.filter(d => (d.staffCount || 0) > 0);
    const dates = datesWithStaff.length;
    
    // Calculate total days (staff assignments)
    const days = datesWithStaff.reduce((total, date) => total + (date.staffCount || 0), 0);
    
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
    return { dates, days, staffNames, staffIds };
  };

  const bookingSummary = getBookingSummary(booking.datesNeeded);
  
  // Get sorted dates for the booking (only dates that need staff)
  const sortedDates = booking.datesNeeded ? 
    [...booking.datesNeeded].filter(d => (d.staffCount || 0) > 0).sort((a, b) => new Date(a.date) - new Date(b.date)) : 
    [];
  const firstDate = sortedDates.length > 0 ? sortedDates[0].date : null;
  const lastDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1].date : null;
  
  // Calculate staff needed vs assigned
  const totalStaffNeeded = booking.datesNeeded?.reduce((total, date) => total + (date.staffCount || 0), 0) || 0;
  const totalStaffAssigned = booking.datesNeeded?.reduce((total, date) => 
    total + (date.staffIds?.filter(Boolean).length || 0), 0) || 0;
  
  // Status information
  const statusLabels = {
    'confirmed': 'Confirmed',
    'pending': 'Pending',
    'cancelled': 'Cancelled',
    'paid': 'Paid',
    'final_paid': 'Paid',
    'deposit_paid': 'Deposit Paid',
  };
  
  const statusStyles = {
    'confirmed': {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-300',
      icon: <CheckCircleIcon className="h-4 w-4 mr-1.5" />,
      gradient: 'from-emerald-500 to-green-400',
      fillColor: 'bg-emerald-500'
    },
    'pending': {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-300',
      icon: <ClockIcon className="h-4 w-4 mr-1.5" />,
      gradient: 'from-amber-500 to-yellow-400',
      fillColor: 'bg-amber-500'
    },
    'cancelled': {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-300',
      icon: <XCircleIcon className="h-4 w-4 mr-1.5" />,
      gradient: 'from-red-500 to-rose-400',
      fillColor: 'bg-red-500'
    },
    'paid': {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-300',
      icon: <CheckCircleIcon className="h-4 w-4 mr-1.5" />,
      gradient: 'from-emerald-500 to-green-400',
      fillColor: 'bg-emerald-500'
    },
    'final_paid': {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-300',
      icon: <CheckCircleIcon className="h-4 w-4 mr-1.5" />,
      gradient: 'from-emerald-500 to-green-400',
      fillColor: 'bg-emerald-500'
    },
    'deposit_paid': {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-300',
      icon: <CheckCircleIcon className="h-4 w-4 mr-1.5" />,
      gradient: 'from-blue-500 to-indigo-400',
      fillColor: 'bg-blue-500'
    }
  };
  
  const currentStatusStyle = statusStyles[booking.status] || statusStyles['pending'];
  
  // Format date range
  const formatDateRange = () => {
    if (!firstDate || !lastDate) return 'No dates';
    
    const start = new Date(firstDate);
    const end = new Date(lastDate);
    
    // Adjust for timezone offset
    const adjustedStart = new Date(start.getTime() + start.getTimezoneOffset() * 60000);
    const adjustedEnd = new Date(end.getTime() + end.getTimezoneOffset() * 60000);
    
    const startMonth = adjustedStart.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = adjustedEnd.toLocaleDateString('en-US', { month: 'short' });
    
    if (startMonth === endMonth && adjustedStart.getFullYear() === adjustedEnd.getFullYear()) {
      if (adjustedStart.getDate() === adjustedEnd.getDate()) {
        return `${startMonth} ${adjustedStart.getDate()}, ${adjustedEnd.getFullYear()}`;
      }
      return `${startMonth} ${adjustedStart.getDate()}-${adjustedEnd.getDate()}, ${adjustedEnd.getFullYear()}`;
    } else {
      return `${startMonth} ${adjustedStart.getDate()}, ${adjustedStart.getFullYear()} - ${endMonth} ${adjustedEnd.getDate()}, ${adjustedEnd.getFullYear()}`;
    }
  };

  const staffCompletionPercentage = Math.max(1, totalStaffNeeded) > 0 ? (totalStaffAssigned / Math.max(1, totalStaffNeeded)) * 100 : 0;

  // Get color based on fill percentage
  const getFillColorClass = (percentage) => {
    if (percentage >= 100) return currentStatusStyle.fillColor; // Use status color for complete
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getDayBarFillColor = (fullness) => {
    if (fullness >= 1) return 'bg-emerald-400 group-hover:bg-emerald-500';
    if (fullness > 0) return 'bg-amber-400 group-hover:bg-amber-500';
    return 'bg-red-400 group-hover:bg-red-500';
  }

  // Derived staffing/payment statuses
  const staffingStatus = totalStaffNeeded > 0 && totalStaffAssigned >= totalStaffNeeded ? 'filled' : 'unfilled';
  const paymentStatus = booking.paymentStatus || (booking.status === 'paid' ? 'paid' : 'payment_pending');

  const paymentLabel = paymentStatus === 'paid' ? 'Paid' : 'Payment Pending';
  const staffingLabel = staffingStatus === 'filled' ? 'Filled' : 'Unfilled';

  const paymentBadge = paymentStatus === 'paid'
    ? { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500' }
    : { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' };

  const staffingBadge = staffingStatus === 'filled'
    ? { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-300', dot: 'bg-sky-500' }
    : { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300', dot: 'bg-rose-500' };

  return (
    <div
      className="group relative overflow-hidden rounded-lg bg-white transition-all duration-300 hover:shadow-xl border border-secondary-200 hover:border-primary-300 flex flex-col cursor-pointer transform hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2"
      onClick={() => router.push(`/bookings/${booking.id}`)}
      tabIndex={0}
      role="button"
      aria-label={`View booking for ${client?.name || 'Unknown Client'}`}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.push(`/bookings/${booking.id}`); }}
    >
      {/* Gradient header based on status */}
      <div className={`h-2 w-full bg-gradient-to-r ${currentStatusStyle.gradient}`}></div>
      
      <div className="p-4 flex-grow flex flex-col space-y-3">
        {/* Top section with statuses and edit button */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${paymentBadge.bg} ${paymentBadge.text} border ${paymentBadge.border}`}>
              <span className={`w-2 h-2 rounded-full mr-1.5 ${paymentBadge.dot}`}></span>
              {paymentLabel}
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${staffingBadge.bg} ${staffingBadge.text} border ${staffingBadge.border}`}>
              <span className={`w-2 h-2 rounded-full mr-1.5 ${staffingBadge.dot}`}></span>
              {staffingLabel}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/bookings/${booking.id}/edit`);
            }}
            className="p-1 rounded-md text-secondary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors opacity-50 group-hover:opacity-100 focus:opacity-100"
            aria-label="Edit staff assignments"
          >
            <PencilSquareIcon className="w-4 h-4" />
          </button>
        </div>
        
        {/* Client and Show Info */}
        <div>
          <div className="flex items-start gap-3 mb-0.5">
            <div className="flex-shrink-0 mt-1 w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 shadow-sm border border-primary-100">
              <BuildingOffice2Icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-secondary-800 group-hover:text-primary-600 transition-colors leading-tight">
                {client?.name || '[Unknown Client]'}
              </h3>
              <h4 className="text-xs text-secondary-500">
                {show?.name || '[Unknown Show]'}
              </h4>
            </div>
          </div>
          
          <div className="flex items-center text-xs text-secondary-500 ml-10 mt-0.5">
            <CalendarIcon className="w-3 h-3 mr-1 flex-shrink-0 text-secondary-400" />
            <span>{formatDateRange()}</span>
          </div>
        </div>
        
        {/* Staff/Dates/Days Stats and Progress */}
        <div className="rounded-lg bg-secondary-50 p-2.5 border border-secondary-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-medium text-secondary-700">{bookingSummary.dates} Date{bookingSummary.dates !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <UserGroupIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-medium text-secondary-700">{totalStaffAssigned}/{totalStaffNeeded} Days</span>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center text-2xs mb-0.5">
              <span className="font-medium text-secondary-600">Staff Filled</span>
              <span className={`font-semibold ${
                staffCompletionPercentage >= 100 ? 'text-emerald-600' :
                staffCompletionPercentage >= 50 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {Math.round(staffCompletionPercentage)}%
              </span>
            </div>
            <div className="relative h-2 bg-secondary-200 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out ${getFillColorClass(staffCompletionPercentage)}`}
                style={{ width: `${staffCompletionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Daily Staffing Micro-Bars */}
        {bookingSummary.dates > 0 && (
          <div className="flex items-end h-7 gap-0.5 overflow-hidden relative group/microbars">
            {Array.from({ length: Math.min(bookingSummary.dates, 30) }).map((_, i) => {
              // Filter to only show days that need staff
              const daysWithStaff = sortedDates.filter(day => (day.staffCount || 0) > 0);
              const day = daysWithStaff[i];
              if (!day) return null;
              const dayStaffIds = day.staffIds || [];
              const dayStaffCount = day.staffCount || 0;
              const fullness = Math.min(1, dayStaffIds.length / Math.max(1, dayStaffCount));
              
              return (
                <div 
                  key={i} 
                  className={`flex-1 rounded-sm cursor-pointer transition-all duration-150 border border-white/50 ${getDayBarFillColor(fullness)}`}
                  style={{ height: `${30 + fullness * 70}%` }} // Scale from 30% to 100% height
                  onClick={(e) => showTooltip(e, i, booking.id)}
                  onMouseEnter={(e) => showTooltip(e, i, booking.id)}
                  onMouseLeave={hideTooltip}
                  title={`${formatDate(day.date)}: ${dayStaffIds.length}/${dayStaffCount} staff`}
                ></div>
              );
            })}
            {bookingSummary.dates > 30 && (
              <div className="flex-1 rounded-sm bg-secondary-300 group-hover/microbars:bg-secondary-400 h-1/2 flex items-center justify-center cursor-default transition-colors">
                <span className="text-2xs text-white font-bold">+{bookingSummary.dates - 30}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCard; 