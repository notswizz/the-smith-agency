import React, { useMemo } from 'react';
import { 
  XMarkIcon, 
  CalendarIcon, 
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/20/solid';

export default function StaffAvailabilityModal({ 
  isOpen, 
  onClose, 
  showId, 
  showName, 
  availability, 
  staff, 
  bookings, 
  currentBookingId,
  showDateRange = [],
  clientId
}) {
  // Calculate booking status for each staff member
  const staffAvailabilitySummary = useMemo(() => {
    if (!showId || !Array.isArray(availability) || !Array.isArray(staff)) {
      return [];
    }
    
    // Filter availability for this show
    const showAvailability = availability.filter(a => a.showId === showId);
    
    // Get all bookings for this show (INCLUDING current one to show all booked staff)
    const showBookings = Array.isArray(bookings) 
      ? bookings.filter(b => b.showId === showId)
      : [];
    
    // Count bookings for the selected client
    const clientBookings = Array.isArray(bookings) 
      ? bookings.filter(b => b.clientId === clientId && b.id !== currentBookingId)
      : [];
    
    // Create a map of dates to booked staff
    const dateToBookedStaffMap = {};
    
    showBookings.forEach(booking => {
      if (Array.isArray(booking.datesNeeded)) {
        booking.datesNeeded.forEach(dateItem => {
          if (!dateToBookedStaffMap[dateItem.date]) {
            dateToBookedStaffMap[dateItem.date] = [];
          }
          
          if (Array.isArray(dateItem.staffIds)) {
            dateItem.staffIds.forEach(staffId => {
              if (staffId) {
                dateToBookedStaffMap[dateItem.date].push(staffId);
              }
            });
          }
        });
      }
    });
    
    // Process each staff member
    return staff.map(member => {
      // Match availability records either by staff document ID or by email (for legacy records)
      const availRecord = showAvailability.find(a => 
        a.staffId === member.id ||
        (member.email && a.staffId === member.email) ||
        (member.email && a.staffEmail === member.email)
      );
      if (!availRecord) return null; // Staff member hasn't signed up for this show
      
      const availableDates = availRecord.availableDates || [];
      
      // For each date in the show range, determine status
      const dateStatusMap = {};
      let totalUnavailableDates = 0;
      let totalAvailableDates = 0;
      let totalBookedDates = 0;
      
      showDateRange.forEach(date => {
        const isMarkedAvailable = availableDates.includes(date);
        const isBooked = dateToBookedStaffMap[date]?.includes(member.id);
        
        if (!isMarkedAvailable) {
          dateStatusMap[date] = 'unavailable';
          totalUnavailableDates++;
        } else if (isBooked) {
          dateStatusMap[date] = 'booked';
          totalBookedDates++;
        } else {
          dateStatusMap[date] = 'available';
          totalAvailableDates++;
        }
      });
      
      // Skip staff with no availability for this show
      if (availableDates.length === 0) return null;
      
      // Count how many times this staff member is booked for the selected client
      const clientBookingCount = clientBookings.reduce((count, booking) => {
        if (Array.isArray(booking.datesNeeded)) {
          return count + booking.datesNeeded.reduce((dateCount, dateItem) => {
            if (Array.isArray(dateItem.staffIds)) {
              return dateCount + dateItem.staffIds.filter(id => id === member.id).length;
            }
            return dateCount;
          }, 0);
        }
        return count;
      }, 0);
      
      return {
        id: member.id,
        name: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || '[NO NAME]',
        photoURL: member.photoURL || member.photoUrl || member.profileImage || member.picture,
        totalUnavailableDates,
        totalAvailableDates,
        totalBookedDates,
        dateStatusMap,
        clientBookingCount,
        isFullyBooked: totalAvailableDates === 0 && totalBookedDates > 0
      };
    }).filter(Boolean).sort((a, b) => {
      // Sort by available dates first (most available at top)
      if (b.totalAvailableDates !== a.totalAvailableDates) {
        return b.totalAvailableDates - a.totalAvailableDates;
      }
      // Then by booked dates
      return a.totalBookedDates - b.totalBookedDates;
    });
  }, [showId, availability, staff, bookings, currentBookingId, showDateRange, clientId]);
  
  if (!isOpen) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-secondary-900/70 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Modal header */}
          <div className="px-5 py-4 border-b border-secondary-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900">
                Staff Availability
              </h3>
              <p className="text-sm text-secondary-500">{showName || 'Show'} • {showDateRange.length} days</p>
            </div>
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-400 hover:text-secondary-600 transition-colors"
              onClick={onClose}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Legend */}
          <div className="px-5 py-3 bg-secondary-50 border-b border-secondary-200 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300"></div>
              <span className="text-secondary-600">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300"></div>
              <span className="text-secondary-600">Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-secondary-100 border border-secondary-300"></div>
              <span className="text-secondary-600">Unavailable</span>
            </div>
          </div>
          
          {/* Modal content */}
          <div className="max-h-[65vh] overflow-y-auto p-5">
            {staffAvailabilitySummary.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffAvailabilitySummary.map(staffMember => (
                  <div key={staffMember.id} className="bg-white border border-secondary-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3 mb-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                        {staffMember.photoURL ? (
                          <img src={staffMember.photoURL} alt={staffMember.name} className="w-full h-full object-cover" />
                        ) : (
                          staffMember.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      
                      {/* Name & badges */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-secondary-900 truncate">{staffMember.name}</h4>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {staffMember.totalAvailableDates > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                              <CheckCircleIcon className="w-3 h-3" />
                              {staffMember.totalAvailableDates} available
                            </span>
                          )}
                          {staffMember.totalBookedDates > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                              <CalendarIcon className="w-3 h-3" />
                              {staffMember.totalBookedDates} booked
                            </span>
                          )}
                          {staffMember.totalUnavailableDates > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-secondary-100 text-secondary-600 px-1.5 py-0.5 rounded">
                              <XCircleIcon className="w-3 h-3" />
                              {staffMember.totalUnavailableDates} unavailable
                            </span>
                          )}
                          {staffMember.isFullyBooked && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                              Fully Booked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Calendar grid */}
                    {showDateRange.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {showDateRange.map(date => {
                          const status = staffMember.dateStatusMap[date] || 'unavailable';
                          const dateObj = new Date(date);
                          const adjustedDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
                          const day = adjustedDate.getDate();
                          const dayName = adjustedDate.toLocaleDateString('en-US', { weekday: 'short' });
                          
                          let bgColor = 'bg-secondary-100 text-secondary-400 border-secondary-200'; // unavailable
                          if (status === 'available') {
                            bgColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                          } else if (status === 'booked') {
                            bgColor = 'bg-amber-100 text-amber-700 border-amber-200';
                          }
                          
                          return (
                            <div 
                              key={date} 
                              className={`w-9 h-9 ${bgColor} rounded-lg flex flex-col items-center justify-center text-xs border`}
                              title={`${adjustedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}: ${status}`}
                            >
                              <span className="text-[9px] opacity-70">{dayName.charAt(0)}</span>
                              <span className="font-semibold -mt-0.5">{day}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserGroupIcon className="mx-auto h-12 w-12 text-secondary-300" />
                <h3 className="mt-3 text-base font-medium text-secondary-900">No staff availability</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  No staff members have signed up for this show yet.
                </p>
              </div>
            )}
          </div>
          
          {/* Modal footer */}
          <div className="px-5 py-4 border-t border-secondary-200 flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-secondary-100 hover:bg-secondary-200 rounded-lg text-sm font-medium text-secondary-700 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
