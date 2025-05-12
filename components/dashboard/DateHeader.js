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
      gradient: 'from-primary-400 to-primary-600',
      hoverGradient: 'hover:from-primary-500 hover:to-primary-700',
      hoverEffect: 'hover:shadow-primary-300/50',
      link: '/staff/new'
    },
    {
      id: 'add-client',
      title: 'Add Client',
      description: 'Create a new client',
      icon: BuildingOffice2Icon,
      gradient: 'from-indigo-400 to-indigo-600',
      hoverGradient: 'hover:from-indigo-500 hover:to-indigo-700',
      hoverEffect: 'hover:shadow-indigo-300/50',
      link: '/clients/new'
    },
    {
      id: 'new-booking',
      title: 'New Booking',
      description: 'Create a new booking',
      icon: ClipboardDocumentListIcon,
      gradient: 'from-emerald-400 to-emerald-600',
      hoverGradient: 'hover:from-emerald-500 hover:to-emerald-700',
      hoverEffect: 'hover:shadow-emerald-300/50',
      link: '/bookings/new'
    },
    {
      id: 'add-show',
      title: 'Add Show',
      description: 'Create a new show',
      icon: CalendarIcon,
      gradient: 'from-blue-400 to-blue-600',
      hoverGradient: 'hover:from-blue-500 hover:to-blue-700',
      hoverEffect: 'hover:shadow-blue-300/50',
      link: '/shows/new'
    }
  ];

  return (
    <div className="mb-6 sm:mb-8 overflow-visible">
      <div className="relative p-4 sm:p-6 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/70 transition-all duration-300 hover:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          {/* Date section with improved visual badge */}
          <div className="flex items-center">
            <div className="flex-shrink-0 overflow-hidden rounded-2xl shadow-lg mr-4 transition-transform duration-300 hover:scale-105 border border-primary-100/70">
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex flex-col relative overflow-hidden">
                {/* Subtle gradient background for the date badge */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-primary-500/20 z-0"></div>
                
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-center py-1.5 text-xs font-semibold uppercase tracking-wider relative z-10">
                  {month}
                </div>
                <div className="bg-white text-center flex-1 flex items-center justify-center relative z-10">
                  <span className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-500">{day}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-medium text-secondary-800 tracking-tight">
                {formattedDate}
              </p>
              <p className="text-xs sm:text-sm text-secondary-500 mt-0.5">
                {today.toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          
          {/* Quick actions with improved styling */}
          <div className="flex gap-3 sm:gap-4">
            {quickActions.map((action) => (
              <Link 
                key={action.id}
                href={action.link}
                className={`
                  group relative flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 
                  rounded-xl text-white shadow-lg 
                  bg-gradient-to-br ${action.gradient} ${action.hoverGradient}
                  transition-all duration-300 ease-in-out
                  hover:shadow-xl ${action.hoverEffect}
                  transform hover:scale-105 active:scale-95
                  before:absolute before:inset-0 before:rounded-xl before:bg-white/20 before:opacity-0 
                  hover:before:opacity-100 before:transition-opacity
                `}
                title={action.title}
              >
                <action.icon className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:scale-110 relative z-10" />
                
                {/* Enhanced tooltip on hover */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-36
                              px-2.5 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-xl text-center 
                              pointer-events-none opacity-0 group-hover:opacity-100
                              transition-all duration-300 z-20 translate-y-1 group-hover:translate-y-0
                              border border-white/50">
                  <div className="font-medium text-xs text-secondary-800">{action.title}</div>
                  <div className="text-2xs text-secondary-500 mt-0.5">{action.description}</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1.5
                                w-3 h-3 rotate-45 bg-white border-r border-b border-white/50"></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-primary-500/5 to-transparent rounded-tl-full"></div>
        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-primary-500/5 to-transparent rounded-br-full"></div>
      </div>
    </div>
  );
} 