import React from 'react';
import Link from 'next/link';
import { BriefcaseIcon, CalendarIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

export default function StaffBookingHistory({ bookings, staffId, getShowById, clients }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border-t-2 border-pink-400">
      <div className="bg-gray-800 py-3 sm:py-4 px-4 sm:px-6 flex justify-between items-center relative overflow-hidden">
        {/* Subtle diagonal pink accent */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-pink-500/10 to-transparent transform -skew-x-12"></div>
        
        <div className="flex items-center relative z-10">
          <BriefcaseIcon className="h-4 sm:h-5 w-4 sm:w-5 text-white mr-1.5 sm:mr-2" />
          <h3 className="font-semibold text-white text-sm sm:text-base">Booking History</h3>
        </div>
        <Link href="/bookings">
          <Button variant="white" size="xs" className="text-gray-800 text-xs relative z-10">
            View All
          </Button>
        </Link>
      </div>
      
      <div className="divide-y divide-gray-100 overflow-y-auto" style={{ maxHeight: '320px' }}>
        {bookings.length > 0 ? (
          bookings.map((booking) => {
            const show = getShowById(booking.showId);
            const client = clients.find(c => c.id === booking.clientId);
            const daysWorked = Array.isArray(booking.datesNeeded)
              ? booking.datesNeeded.filter(dn => Array.isArray(dn.staffIds) && dn.staffIds.includes(staffId)).length
              : 0;
            
            // Simply use the show name if available, or a basic fallback if not
            const showName = show?.name || "Unnamed Show";
              
            // Status styles with pink accent for confirmed
            const getStatusColor = (status) => {
              switch(status) {
                case 'confirmed': return 'bg-pink-50 text-pink-700 border-pink-200';
                case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
                case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
                default: return 'bg-gray-50 text-gray-700 border-gray-200';
              }
            };
            
            const statusColor = getStatusColor(booking.status);
            
            return (
              <div key={booking.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-500 border-l-2 border-pink-400">
                      <BriefcaseIcon className="h-4 sm:h-5 w-4 sm:w-5" />
                    </div>
                    
                    <div>
                      {client && (
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="text-sm sm:text-base font-semibold text-gray-800 hover:text-pink-600 transition-colors"
                        >
                          {client.name}
                        </Link>
                      )}
                      
                      <div className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        {showName}
                      </div>
                      
                      <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1.5 sm:gap-2 items-center">
                        <span className={`text-2xs sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-md border ${statusColor}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        
                        <span className="text-2xs sm:text-xs font-medium text-gray-600 flex items-center bg-gray-100 px-2 py-0.5 rounded-md border-l border-pink-400">
                          <CalendarIcon className="h-3 sm:h-3.5 w-3 sm:w-3.5 mr-0.5 sm:mr-1" />
                          {daysWorked} day{daysWorked !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Link href={`/bookings/${booking.id}`} className="text-gray-400 hover:text-pink-500 transition-colors">
                    <svg className="h-4 sm:h-5 w-4 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 sm:p-6 text-center">
            <BriefcaseIcon className="h-10 sm:h-12 w-10 sm:w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-4">No bookings found for this staff member</p>
            <Link href="/bookings/new">
              <Button variant="primary" size="sm">Create Booking</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 