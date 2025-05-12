import React from 'react';
import { BriefcaseIcon, CalendarIcon } from '@heroicons/react/24/outline';

export default function StaffTabToggle({ activeTab, setActiveTab }) {
  return (
    <div className="lg:hidden bg-white rounded-xl shadow-md overflow-hidden mb-2 border border-gray-200">
      <div className="grid grid-cols-2">
        <button 
          onClick={() => setActiveTab('bookings')}
          className={`py-3 px-4 text-sm font-medium flex items-center justify-center relative ${
            activeTab === 'bookings' 
              ? 'bg-gray-800 text-white' 
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          } transition-colors duration-200`}
        >
          {activeTab === 'bookings' && (
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent"></div>
          )}
          <div className="relative z-10 flex items-center">
            <BriefcaseIcon className="h-4 w-4 mr-1.5" />
            Booking History
            {activeTab === 'bookings' && (
              <span className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-pink-400 rounded-full"></span>
            )}
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('availability')}
          className={`py-3 px-4 text-sm font-medium flex items-center justify-center relative ${
            activeTab === 'availability' 
              ? 'bg-gray-800 text-white' 
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          } transition-colors duration-200`}
        >
          {activeTab === 'availability' && (
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent"></div>
          )}
          <div className="relative z-10 flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1.5" />
            Availability
            {activeTab === 'availability' && (
              <span className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-pink-400 rounded-full"></span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
} 