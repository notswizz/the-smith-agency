import React from 'react';
import { useRouter } from 'next/router';
import { formatDate } from '@/utils/dateUtils';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon,
  ArrowRightIcon,
  CalendarIcon,
  UserGroupIcon,
  BuildingOffice2Icon
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
    'confirmed': {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      icon: <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />,
      gradient: 'from-emerald-500 to-green-400'
    },
    'pending': {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: <ClockIcon className="h-3.5 w-3.5 mr-1" />,
      gradient: 'from-amber-500 to-yellow-400'
    },
    'cancelled': {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      icon: <XCircleIcon className="h-3.5 w-3.5 mr-1" />,
      gradient: 'from-red-500 to-rose-400'
    }
  };
  
  const statusStyle = statusColors[booking.status] || statusColors['pending'];
  
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
    
    if (startMonth === endMonth) {
      return `${startMonth} ${adjustedStart.getDate()}-${adjustedEnd.getDate()}, ${adjustedEnd.getFullYear()}`;
    } else {
      return `${startMonth} ${adjustedStart.getDate()} - ${endMonth} ${adjustedEnd.getDate()}, ${adjustedEnd.getFullYear()}`;
    }
  };

  // Get color based on fill percentage
  const getFillColor = (percentage) => {
    if (percentage >= 1) return 'bg-gradient-to-r from-emerald-500 to-emerald-400';
    if (percentage >= 0.5) return 'bg-gradient-to-r from-amber-500 to-amber-400';
    return 'bg-gradient-to-r from-red-500 to-red-400';
  };

  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-white transition-all duration-300 hover:shadow-lg border border-secondary-200 hover:border-primary-300 flex flex-col cursor-pointer transform hover:-translate-y-1"
      onClick={() => router.push(`/bookings/${booking.id}`)}
      tabIndex={0}
      role="button"
      aria-label={`View booking for ${client?.name || 'Unknown Client'}`}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.push(`/bookings/${booking.id}`); }}
    >
      {/* Gradient header */}
      <div className={`h-3 w-full bg-gradient-to-r ${statusStyle.gradient}`}></div>
      
      <div className="p-4 flex-grow flex flex-col">
        {/* Top section with status and edit button */}
        <div className="flex justify-between items-start mb-4">
          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
            {statusStyle.icon}
            {statusLabels[booking.status] || 'Unknown'}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/bookings/${booking.id}/edit`);
            }}
            className="p-1.5 rounded-md text-secondary-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            aria-label="Edit booking"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
        
        {/* Client and Show Info */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 shadow-sm border border-primary-100">
              <BuildingOffice2Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors leading-tight">
                {client?.name || '[Unknown Client]'}
              </h3>
              <h4 className="text-sm text-secondary-600">
                {show?.name || '[Unknown Show]'}
              </h4>
            </div>
          </div>
          
          {/* Date Range */}
          <div className="flex items-center text-xs text-secondary-500 ml-13 mt-1">
            <CalendarIcon className="w-3 h-3 mr-1 flex-shrink-0" />
            <span>{formatDateRange()}</span>
          </div>
        </div>
        
        {/* Staff/Days Stats with Bar Chart */}
        <div className="rounded-xl bg-secondary-50 p-4 border border-secondary-100 shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-secondary-900">{bookingSummary.days}</span>
                  <span className="text-xs text-secondary-500 uppercase">days</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <UserGroupIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-secondary-900">{totalStaffAssigned}/{totalStaffNeeded}</span>
                  <span className="text-xs text-secondary-500 uppercase">staff</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Staff Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-secondary-700">Staff Filled</span>
              <span className={`font-medium ${
                totalStaffAssigned >= totalStaffNeeded ? 'text-emerald-600' :
                totalStaffAssigned >= totalStaffNeeded/2 ? 'text-amber-600' :
                'text-red-600'
              }`}>
                {Math.round((totalStaffAssigned / Math.max(1, totalStaffNeeded)) * 100)}%
              </span>
            </div>
            <div className="relative h-3 bg-secondary-200 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`absolute top-0 left-0 h-full ${getFillColor(totalStaffAssigned / Math.max(1, totalStaffNeeded))}`}
                style={{ width: `${Math.min(100, (totalStaffAssigned / Math.max(1, totalStaffNeeded)) * 100)}%` }}
              ></div>
            </div>
          </div>
          
          {/* Days Bar Chart */}
          <div className="mt-4 flex items-end h-12 gap-1 overflow-hidden relative">
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
                
              // Get bar color based on fullness
              const barColor = fullness >= 1 
                ? 'bg-emerald-500 hover:bg-emerald-600' 
                : fullness >= 0.5 
                  ? 'bg-amber-500 hover:bg-amber-600' 
                  : 'bg-red-500 hover:bg-red-600';
              
              return (
                <div 
                  key={i} 
                  className={`flex-1 rounded-md ${barColor} cursor-pointer transition-all shadow-sm hover:shadow transform hover:-translate-y-1`}
                  style={{ height: `${50 + fullness * 50}%` }}
                  onClick={(e) => showTooltip(e, dayIndex, booking.id)}
                  onMouseEnter={(e) => showTooltip(e, dayIndex, booking.id)}
                  onMouseLeave={hideTooltip}
                  title={dayDate ? formatDate(dayDate) : 'Date information not available'}
                ></div>
              );
            })}
            {bookingSummary.days > 15 && (
              <div className="flex-1 rounded-md bg-secondary-300 hover:bg-secondary-400 h-1/2 flex items-center justify-center cursor-pointer transition-colors">
                <span className="text-xs text-white font-bold">+{bookingSummary.days - 15}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Arrow indicator for clickable card */}
        <div className="flex justify-end mt-3">
          <div className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRightIcon className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCard; 