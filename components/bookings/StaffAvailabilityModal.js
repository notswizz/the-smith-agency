import React, { useMemo } from 'react';
import { 
  XMarkIcon, 
  CalendarIcon, 
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
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
  showDateRange = []
}) {
  // Calculate booking status for each staff member
  const staffAvailabilitySummary = useMemo(() => {
    if (!showId || !Array.isArray(availability) || !Array.isArray(staff)) {
      return [];
    }
    
    // Filter availability for this show
    const showAvailability = availability.filter(a => a.showId === showId);
    
    // Get all bookings for this show, except the current one
    const showBookings = Array.isArray(bookings) 
      ? bookings.filter(b => b.showId === showId && b.id !== currentBookingId)
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
      const availRecord = showAvailability.find(a => a.staffId === member.id);
      if (!availRecord) return null; // Staff member hasn't signed up for this show
      
      const availableDates = availRecord.availableDates || [];
      
      // For each available date, check if already booked
      const dateStatusMap = {};
      let totalAvailableDates = 0;
      let totalBookedDates = 0;
      let totalActuallyAvailableDates = 0;
      
      availableDates.forEach(date => {
        const isBooked = dateToBookedStaffMap[date]?.includes(member.id);
        dateStatusMap[date] = isBooked ? 'booked' : 'available';
        totalAvailableDates++;
        if (isBooked) {
          totalBookedDates++;
        } else {
          totalActuallyAvailableDates++;
        }
      });
      
      // Skip staff with no availability for this show
      if (totalAvailableDates === 0) return null;
      
      return {
        id: member.id,
        name: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || '[NO NAME]',
        photoURL: member.photoURL || member.photoUrl || member.profileImage || member.picture,
        totalAvailableDates,
        totalBookedDates,
        totalActuallyAvailableDates,
        availabilityRate: totalAvailableDates / showDateRange.length,
        bookedRate: totalAvailableDates > 0 ? totalBookedDates / totalAvailableDates : 0,
        actuallyAvailableRate: totalActuallyAvailableDates / showDateRange.length,
        dateStatusMap
      };
    }).filter(Boolean).sort((a, b) => {
      // Sort by actually available dates (highest first), then by total available dates
      if (b.totalActuallyAvailableDates !== a.totalActuallyAvailableDates) {
        return b.totalActuallyAvailableDates - a.totalActuallyAvailableDates;
      }
      return b.availabilityRate - a.availabilityRate;
    });
  }, [showId, availability, staff, bookings, currentBookingId, showDateRange]);
  
  if (!isOpen) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-secondary-900 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Modal header */}
          <div className="bg-secondary-50 px-4 py-3 border-b border-secondary-200 flex justify-between items-center">
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-base font-medium text-secondary-900">
                Staff Availability Overview: {showName || 'Show'}
              </h3>
            </div>
            <button
              type="button"
              className="bg-secondary-50 rounded-md text-secondary-400 hover:text-secondary-600 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          {/* Modal content */}
          <div className="max-h-[80vh] overflow-y-auto p-4">
            {staffAvailabilitySummary.length > 0 ? (
              <div className="space-y-4">
                {/* Staff list with availability */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {staffAvailabilitySummary.map(staff => (
                    <div key={staff.id} className="bg-white border border-secondary-200 rounded-lg shadow-sm p-4">
                      <div className="flex items-start">
                        {/* Avatar/initials */}
                        <div className="flex-shrink-0 h-10 w-10 rounded-full mr-3 bg-primary-100 border border-primary-200 flex items-center justify-center text-primary-700 overflow-hidden">
                          {staff.photoURL ? (
                            <img src={staff.photoURL} alt={staff.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-medium">{staff.name.charAt(0)}</span>
                          )}
                        </div>
                        
                        {/* Staff info */}
                        <div className="flex-1">
                          <h4 className="font-medium text-secondary-900">{staff.name}</h4>
                          
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            {/* Available & bookable days badge */}
                            {staff.totalActuallyAvailableDates > 0 && (
                              <span className="bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 flex items-center">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                {staff.totalActuallyAvailableDates} day{staff.totalActuallyAvailableDates !== 1 ? 's' : ''} available
                                {showDateRange.length > 0 && (
                                  <span className="ml-1 opacity-75">
                                    ({Math.round(staff.actuallyAvailableRate * 100)}%)
                                  </span>
                                )}
                              </span>
                            )}
                            
                            {/* Booked days badge */}
                            {staff.totalBookedDates > 0 && (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 flex items-center">
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                {staff.totalBookedDates} day{staff.totalBookedDates !== 1 ? 's' : ''} booked
                                {staff.totalAvailableDates > 0 && (
                                  <span className="ml-1 opacity-75">
                                    ({Math.round(staff.bookedRate * 100)}%)
                                  </span>
                                )}
                              </span>
                            )}
                            
                            {/* Fully booked warning */}
                            {staff.totalBookedDates > 0 && staff.totalActuallyAvailableDates === 0 && (
                              <span className="bg-red-50 text-red-700 border border-red-200 rounded-full px-2 py-0.5 flex items-center">
                                <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                Fully Booked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Calendar view */}
                      {showDateRange.length > 0 && (
                        <div className="mt-3 border-t border-secondary-100 pt-3">
                          <div className="text-xs text-secondary-500 mb-2 flex items-center">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            Availability Calendar
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {showDateRange.map(date => {
                              const status = staff.dateStatusMap[date] || 'unavailable';
                              let bgColor = 'bg-secondary-100 text-secondary-400'; // unavailable
                              let icon = null;
                              
                              if (status === 'available') {
                                bgColor = 'bg-green-100 text-green-700';
                                icon = <CheckIcon className="h-2 w-2" />;
                              } else if (status === 'booked') {
                                bgColor = 'bg-amber-100 text-amber-700';
                                icon = <ExclamationCircleIcon className="h-2 w-2" />;
                              }
                              
                              const dateObj = new Date(date);
                              const day = dateObj.getDate();
                              
                              return (
                                <div 
                                  key={date} 
                                  className={`w-6 h-6 ${bgColor} rounded flex items-center justify-center text-xs relative`}
                                  title={`${new Date(date).toLocaleDateString()}: ${status}`}
                                >
                                  {day}
                                  {icon && (
                                    <span className="absolute -top-0.5 -right-0.5">
                                      {icon}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <UserGroupIcon className="mx-auto h-12 w-12 text-secondary-300" />
                <h3 className="mt-2 text-base font-medium text-secondary-900">No staff availability</h3>
                <p className="mt-1 text-sm text-secondary-500">
                  No staff members have signed up for this show yet.
                </p>
              </div>
            )}
          </div>
          
          {/* Modal footer */}
          <div className="bg-secondary-50 px-4 py-3 border-t border-secondary-200 flex justify-end">
            <button
              type="button"
              className="bg-white py-2 px-4 border border-secondary-300 rounded-md shadow-sm text-sm font-medium text-secondary-700 hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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