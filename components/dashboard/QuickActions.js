import React from 'react';
import { 
  UserGroupIcon, 
  BuildingOffice2Icon,
  CalendarIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export default function QuickActions() {
  // Quick actions array
  const quickActions = [
    {
      id: 'add-staff',
      name: 'Add Staff',
      icon: UserGroupIcon,
      color: 'bg-primary-50 border-primary-100 text-primary-700 hover:bg-primary-100',
      link: '/staff/new'
    },
    {
      id: 'add-client',
      name: 'Add Client',
      icon: BuildingOffice2Icon,
      color: 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100',
      link: '/clients/new'
    },
    {
      id: 'new-booking',
      name: 'New Booking',
      icon: ClipboardDocumentListIcon,
      color: 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100',
      link: '/bookings/new'
    },
    {
      id: 'add-show',
      name: 'Add Show',
      icon: CalendarIcon,
      color: 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100',
      link: '/shows/new'
    }
  ];

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-secondary-100 overflow-hidden">
      <div className="p-5 sm:p-8">
        <h2 className="text-lg sm:text-xl font-bold text-secondary-900 mb-4 sm:mb-6 flex items-center">
          <span className="bg-secondary-100 rounded-md p-1 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-secondary-700">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <a 
              key={action.id}
              href={action.link} 
              className={`flex items-center gap-2 sm:gap-3 p-3.5 sm:p-4 rounded-lg sm:rounded-xl border ${action.color} transition-all duration-200 hover:shadow-md hover:scale-[1.02] transform`}
            >
              <action.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-sm sm:text-base font-medium">{action.name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
} 