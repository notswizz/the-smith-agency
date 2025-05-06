import React from 'react';
import Link from 'next/link';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/utils/dateUtils';

const StaffTooltip = ({ 
  activeTooltip, 
  bookings, 
  getStaffForDay, 
  hideTooltip 
}) => {
  if (!activeTooltip.visible) {
    return null;
  }

  return (
    <div 
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-secondary-200 w-64 transform -translate-x-1/2 animate-fade-in"
      style={{ 
        left: `${activeTooltip.position.x}px`, 
        top: `${activeTooltip.position.y - 10}px`,
        marginTop: '-160px'  // Position above the bar
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {bookings.map(booking => {
        if (booking.id !== activeTooltip.bookingId) return null;
        
        const dateInfo = booking.datesNeeded?.[activeTooltip.dayIndex];
        const dateDisplay = dateInfo?.date ? formatDate(dateInfo.date) : 'Unknown Date';
        const staffList = getStaffForDay(booking, activeTooltip.dayIndex);
        
        // Calculate the number of unfilled positions
        const staffNeeded = dateInfo?.staffCount || 0;
        const staffAssigned = staffList.length;
        const unfilled = Math.max(0, staffNeeded - staffAssigned);
        
        // Create an array with unfilled placeholders
        const displayList = [
          ...staffList,
          ...Array(unfilled).fill({ id: `unfilled-${Date.now()}-${Math.random()}`, name: null })
        ];
        
        return (
          <div key={booking.id} className="p-3">
            <div className="flex justify-between items-center border-b border-secondary-100 pb-2 mb-2">
              <h3 className="font-medium text-sm text-secondary-900">{dateDisplay}</h3>
              <button 
                onClick={hideTooltip}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <XCircleIcon className="h-4 w-4" />
              </button>
            </div>
            
            <div className="max-h-32 overflow-y-auto">
              {displayList.map((staffMember, index) => (
                staffMember.name ? (
                  <Link 
                    href={`/staff/${staffMember.id}`} 
                    key={staffMember.id}
                    className="flex items-center py-1.5 px-1 hover:bg-secondary-50 rounded-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="h-6 w-6 rounded-full bg-secondary-200 flex items-center justify-center text-xs mr-2">
                      {staffMember.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-secondary-900">{staffMember.name}</div>
                    </div>
                  </Link>
                ) : (
                  <div 
                    key={staffMember.id || `unfilled-${index}`}
                    className="flex items-center py-1.5 px-1 rounded-md"
                  >
                    <div className="h-6 w-6 rounded-full bg-secondary-100 flex items-center justify-center text-xs mr-2 text-secondary-400">
                      ?
                    </div>
                    <div>
                      <div className="text-sm font-medium text-secondary-400 italic">Unfilled</div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StaffTooltip; 