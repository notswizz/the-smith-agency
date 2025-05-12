import React from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/utils/dateUtils';

export default function StaffAvailability({ staffId, availability, getShowById }) {
  const filteredAvailability = (availability || []).filter(a => a.staffId === staffId);
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border-t-2 border-pink-400">
      <div className="bg-gray-800 py-3 sm:py-4 px-4 sm:px-6 relative overflow-hidden">
        {/* Subtle pink decorative element */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full -mr-12 -mt-12"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-500/10 rounded-full -ml-8 -mb-8"></div>
        
        <div className="flex items-center relative z-10">
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
                <div key={availability.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-gray-100 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 border-l-2 border-l-pink-400">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-800 text-sm sm:text-base">{showName}</h3>
                      <span className="text-2xs sm:text-xs bg-gray-200 text-gray-700 px-1.5 sm:px-2 py-0.5 rounded-md">
                        {availableDates.length} day{availableDates.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-2xs sm:text-xs text-gray-500 mt-0.5 sm:mt-1 flex items-center">
                      <CalendarIcon className="h-3 sm:h-3.5 w-3 sm:w-3.5 mr-0.5 sm:mr-1" />
                      {formatDate(show.startDate)} - {formatDate(show.endDate)}
                    </p>
                  </div>
                  
                  <div className="p-2 sm:p-3 bg-white bg-opacity-50 bg-pattern-dots">
                    {availableDates.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {availableDates.map(date => (
                          <span 
                            key={date} 
                            className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-2xs sm:text-xs font-medium bg-white text-gray-700 border border-gray-200 shadow-sm hover:border-pink-200 transition-colors"
                          >
                            {formatDate(date, 'MMM d')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs sm:text-sm text-center py-2">No specific dates available</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 sm:py-6">
            <div className="relative inline-block">
              <CalendarIcon className="h-10 sm:h-12 w-10 sm:w-12 text-gray-300" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-pink-400 rounded-full"></div>
            </div>
            <p className="text-sm text-gray-500 mt-3 mb-1">No availability submitted</p>
            <p className="text-xs sm:text-sm text-gray-400">This staff member has not submitted availability for any shows yet.</p>
          </div>
        )}
      </div>
    </div>
  );
} 