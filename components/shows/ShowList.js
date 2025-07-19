import React from 'react';
import Link from 'next/link';
import { formatDate } from '@/utils/dateUtils';
import { 
  CalendarIcon, 
  BuildingOffice2Icon,
  TagIcon,
  MapPinIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import useStore from '@/lib/hooks/useStore';

export default function ShowList({ shows }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shows.map((show) => (
          <ShowCard key={show.id} show={show} />
        ))}
      </div>
    </div>
  );
}

function ShowCard({ show }) {
  const { getClientById, updateShow } = useStore();
  const client = getClientById(show.client);
  const dateRange = `${formatDate(show.startDate)} - ${formatDate(show.endDate)}`;

  // Calculate show duration in days
  const startDate = new Date(show.startDate);
  const endDate = new Date(show.endDate);
  const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  // Get show status (default to active if not set)
  const showStatus = show.status || 'active';



  // Handle status toggle
  const handleStatusToggle = (e) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent event bubbling
    
    const newStatus = showStatus === 'active' ? 'inactive' : 'active';
    if (updateShow && typeof updateShow === 'function') {
      updateShow(show.id, { ...show, status: newStatus });
    }
  };

  return (
    <Link 
      href={`/shows/${show.id}`}
      className="group block bg-white rounded-lg shadow-sm hover:shadow-lg border border-secondary-200 hover:border-primary-300 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
    >
      {/* Enhanced gradient header */}
      <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 h-2 w-full relative">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
      </div>
      
      <div className="p-4 space-y-3">
        {/* Header section with title, client, and status */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-bold text-secondary-900 group-hover:text-primary-600 transition-colors leading-tight pr-4 flex-1">
              {show.name}
            </h3>
            <div className="flex items-center space-x-2 flex-shrink-0">
              {/* Quick Status Toggle */}
              <button
                onClick={handleStatusToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500/20 hover:scale-105 ${
                  showStatus === 'active' 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md' 
                    : 'bg-gradient-to-r from-secondary-400 to-secondary-500 shadow-md'
                }`}
                title={`Toggle ${showStatus === 'active' ? 'inactive' : 'active'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out ${
                    showStatus === 'active' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
                <span className="sr-only">Toggle show status</span>
              </button>
              
              {/* Status Label */}
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                showStatus === 'active' 
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                  : 'bg-secondary-100 text-secondary-700 border border-secondary-200'
              }`}>
                {showStatus === 'active' ? (
                  <>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1 animate-pulse"></div>
                    <PlayIcon className="h-3 w-3 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-secondary-500 rounded-full mr-1"></div>
                    <PauseIcon className="h-3 w-3 mr-1" />
                    Inactive
                  </>
                )}
              </div>
            </div>
          </div>
          
          {client && (
            <div className="flex items-center text-sm text-secondary-600 bg-secondary-50 rounded-md px-2 py-1 border border-secondary-100">
              <BuildingOffice2Icon className="h-3 w-3 mr-1 text-secondary-500" />
              <span className="font-medium text-xs">{client.name}</span>
            </div>
          )}
        </div>

        {/* Compact details section */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-secondary-700 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-md px-3 py-2 border border-blue-200/50">
            <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center mr-2 shadow-sm">
              <CalendarIcon className="h-3 w-3 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-secondary-900 text-xs">{dateRange}</div>
              <div className="text-xs text-secondary-600">{durationDays} day{durationDays !== 1 ? 's' : ''}</div>
            </div>
          </div>
          
          {show.location && (
            <div className="flex items-center text-sm text-secondary-700 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-md px-3 py-2 border border-emerald-200/50">
              <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center mr-2 shadow-sm">
                <MapPinIcon className="h-3 w-3 text-white" />
              </div>
              <span className="font-medium text-xs">{show.location}</span>
            </div>
          )}
          
          {show.type && (
            <div className="flex items-center text-sm text-secondary-700 bg-gradient-to-r from-violet-50 to-violet-100/50 rounded-md px-3 py-2 border border-violet-200/50">
              <div className="w-6 h-6 rounded-md bg-violet-500 flex items-center justify-center mr-2 shadow-sm">
                <TagIcon className="h-3 w-3 text-white" />
              </div>
              <span className="font-medium text-xs capitalize">{show.type}</span>
            </div>
          )}


        </div>
      </div>
      
      {/* Subtle decorative elements */}
      <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-primary-500/5 to-transparent rounded-bl-full"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-primary-500/5 to-transparent rounded-tr-full"></div>
    </Link>
  );
} 