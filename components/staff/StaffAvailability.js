import React from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/utils/dateUtils';

export default function StaffAvailability({ staffId, availability, getShowById }) {
  const filteredAvailability = (availability || []).filter(a => a.staffId === staffId);
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-[0_8px_30px_rgb(219,39,119,0.2)] transition-shadow duration-300">
      <div className="bg-gradient-to-r from-purple-600 to-purple-400 py-3 sm:py-4 px-4 sm:px-6">
        <div className="flex items-center">
          <CalendarIcon className="h-4 sm:h-5 w-4 sm:w-5 text-white mr-1.5 sm:mr-2" />
          <h3 className="font-semibold text-white text-sm sm:text-base">Availability</h3>
        </div>
      </div>
      
      <div className="p-3 sm:p-4 overflow-y-auto" style={{ maxHeight: '320px' }}>
        {filteredAvailability.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {filteredAvailability.map(availability => {
              const show = getShowById(availability.showId);
              if (!show) return null;
              
              const availableDates = availability.availableDates || availability.dates || [];
              
              // Simply use the show name if available
              const showName = show.name || "Unnamed Show";
              
              return (
                <div key={availability.id} className="border border-secondary-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-purple-50 px-3 sm:px-4 py-2 sm:py-3 border-b border-secondary-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-secondary-900 text-sm sm:text-base">{showName}</h3>
                      <span className="text-2xs sm:text-xs bg-purple-100 text-purple-800 px-1.5 sm:px-2 py-0.5 rounded-full">
                        {availableDates.length} day{availableDates.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-2xs sm:text-xs text-secondary-500 mt-0.5 sm:mt-1 flex items-center">
                      <CalendarIcon className="h-3 sm:h-3.5 w-3 sm:w-3.5 mr-0.5 sm:mr-1" />
                      {formatDate(show.startDate)} - {formatDate(show.endDate)}
                    </p>
                  </div>
                  
                  <div className="p-2 sm:p-3">
                    {availableDates.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {availableDates.map(date => (
                          <span 
                            key={date} 
                            className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-2xs sm:text-xs font-medium bg-green-100 text-green-800 border border-green-200 shadow-sm"
                          >
                            {formatDate(date, 'MMM d')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-secondary-500 text-xs sm:text-sm text-center py-2">No specific dates available</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 sm:py-6">
            <CalendarIcon className="h-10 sm:h-12 w-10 sm:w-12 mx-auto text-secondary-300 mb-3" />
            <p className="text-sm text-secondary-500 mb-1">No availability submitted</p>
            <p className="text-xs sm:text-sm text-secondary-400">This staff member has not submitted availability for any shows yet.</p>
          </div>
        )}
      </div>
    </div>
  );
} 