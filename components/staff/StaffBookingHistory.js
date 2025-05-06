import React from 'react';
import Link from 'next/link';
import { BriefcaseIcon, CalendarIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

export default function StaffBookingHistory({ bookings, staffId, getShowById, clients }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-[0_8px_30px_rgb(219,39,119,0.2)] transition-shadow duration-300">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 py-3 sm:py-4 px-4 sm:px-6 flex justify-between items-center">
        <div className="flex items-center">
          <BriefcaseIcon className="h-4 sm:h-5 w-4 sm:w-5 text-white mr-1.5 sm:mr-2" />
          <h3 className="font-semibold text-white text-sm sm:text-base">Booking History</h3>
        </div>
        <Link href="/bookings">
          <Button variant="white" size="xs" className="text-emerald-700 text-xs">
            View All
          </Button>
        </Link>
      </div>
      
      <div className="divide-y divide-secondary-100 overflow-y-auto" style={{ maxHeight: '320px' }}>
        {bookings.length > 0 ? (
          bookings.map((booking) => {
            const show = getShowById(booking.showId);
            const client = clients.find(c => c.id === booking.clientId);
            const daysWorked = Array.isArray(booking.datesNeeded)
              ? booking.datesNeeded.filter(dn => Array.isArray(dn.staffIds) && dn.staffIds.includes(staffId)).length
              : 0;
            
            // Simply use the show name if available, or a basic fallback if not
            const showName = show?.name || "Unnamed Show";
              
            // Status styles
            const getStatusColor = (status) => {
              switch(status) {
                case 'confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
                case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
                default: return 'bg-secondary-100 text-secondary-800 border-secondary-200';
              }
            };
            
            const statusColor = getStatusColor(booking.status);
            
            return (
              <div key={booking.id} className="p-3 sm:p-4 hover:bg-secondary-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                      <BriefcaseIcon className="h-4 sm:h-5 w-4 sm:w-5" />
                    </div>
                    
                    <div>
                      {client && (
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="text-sm sm:text-base font-semibold text-secondary-900 hover:text-primary-600 transition-colors"
                        >
                          {client.name}
                        </Link>
                      )}
                      
                      <div className="text-xs sm:text-sm text-secondary-500 mt-0.5">
                        {showName}
                      </div>
                      
                      <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1.5 sm:gap-2 items-center">
                        <span className={`text-2xs sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        
                        <span className="text-2xs sm:text-xs font-semibold text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CalendarIcon className="h-3 sm:h-3.5 w-3 sm:w-3.5 mr-0.5 sm:mr-1" />
                          {daysWorked} day{daysWorked !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Link href={`/bookings/${booking.id}`} className="text-primary-600 hover:text-primary-700">
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
            <BriefcaseIcon className="h-10 sm:h-12 w-10 sm:w-12 mx-auto text-secondary-300 mb-3" />
            <p className="text-sm text-secondary-500 mb-4">No bookings found for this staff member</p>
            <Link href="/bookings/new">
              <Button variant="primary" size="sm">Create Booking</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 