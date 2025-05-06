import React from 'react';
import Link from 'next/link';
import { 
  UserGroupIcon, 
  BuildingOffice2Icon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function DateHeader() {
  // Format date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get day and month for the visual date badge
  const day = today.getDate();
  const month = today.toLocaleDateString('en-US', { month: 'short' });

  // Quick action buttons
  const quickActions = [
    {
      id: 'add-staff',
      title: 'Add Staff',
      description: 'Create a new staff profile',
      icon: UserGroupIcon,
      gradient: 'from-primary-500 to-primary-600',
      hoverEffect: 'hover:shadow-primary-200/50',
      link: '/staff/new'
    },
    {
      id: 'add-client',
      title: 'Add Client',
      description: 'Create a new client',
      icon: BuildingOffice2Icon,
      gradient: 'from-indigo-500 to-indigo-600',
      hoverEffect: 'hover:shadow-indigo-200/50',
      link: '/clients/new'
    },
    {
      id: 'new-booking',
      title: 'New Booking',
      description: 'Create a new booking',
      icon: ClipboardDocumentListIcon,
      gradient: 'from-emerald-500 to-emerald-600',
      hoverEffect: 'hover:shadow-emerald-200/50',
      link: '/bookings/new'
    },
    {
      id: 'add-show',
      title: 'Add Show',
      description: 'Create a new show',
      icon: CalendarIcon,
      gradient: 'from-blue-500 to-blue-600',
      hoverEffect: 'hover:shadow-blue-200/50',
      link: '/shows/new'
    }
  ];

  return (
    <div className="mb-5 sm:mb-6 overflow-visible">
      <div className="relative p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          {/* Date section with visual badge */}
          <div className="flex items-center">
            <div className="flex-shrink-0 overflow-hidden rounded-xl shadow-md mr-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex flex-col">
                <div className="bg-primary-500 text-white text-center py-1 text-xs font-semibold">
                  {month}
                </div>
                <div className="bg-white text-center flex-1 flex items-center justify-center">
                  <span className="text-secondary-800 text-xl sm:text-2xl font-bold">{day}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-medium text-secondary-800">
                {formattedDate}
              </p>
            </div>
          </div>
          
          {/* Quick actions with improved styling */}
          <div className="flex gap-2 sm:gap-3">
            {quickActions.map((action) => (
              <Link 
                key={action.id}
                href={action.link}
                className={`
                  group relative flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 
                  rounded-full text-white shadow-md 
                  bg-gradient-to-br ${action.gradient} 
                  transition-all duration-200 
                  hover:shadow-lg ${action.hoverEffect}
                  transform hover:scale-105 active:scale-95
                `}
                title={action.title}
              >
                <action.icon className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:scale-110" />
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-32 
                              px-2 py-1.5 bg-white rounded-lg shadow-lg text-center 
                              pointer-events-none opacity-0 group-hover:opacity-100 
                              transition-opacity text-xs text-secondary-700 font-medium">
                  {action.title}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 
                                border-t-4 border-l-4 border-r-4 border-transparent border-t-white"></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 