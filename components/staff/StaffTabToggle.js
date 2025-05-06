import React from 'react';
import { BriefcaseIcon, CalendarIcon } from '@heroicons/react/24/outline';

export default function StaffTabToggle({ activeTab, setActiveTab }) {
  return (
    <div className="lg:hidden bg-white rounded-xl shadow-md overflow-hidden mb-2">
      <div className="grid grid-cols-2">
        <button 
          onClick={() => setActiveTab('bookings')}
          className={`py-3 px-4 text-sm font-medium flex items-center justify-center ${
            activeTab === 'bookings' 
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 text-white' 
              : 'bg-gray-50 text-gray-600'
          }`}
        >
          <BriefcaseIcon className="h-4 w-4 mr-1.5" />
          Booking History
        </button>
        <button 
          onClick={() => setActiveTab('availability')}
          className={`py-3 px-4 text-sm font-medium flex items-center justify-center ${
            activeTab === 'availability' 
              ? 'bg-gradient-to-r from-purple-600 to-purple-400 text-white' 
              : 'bg-gray-50 text-gray-600'
          }`}
        >
          <CalendarIcon className="h-4 w-4 mr-1.5" />
          Availability
        </button>
      </div>
    </div>
  );
} 