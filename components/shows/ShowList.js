import React from 'react';
import Link from 'next/link';
import { 
  CalendarDaysIcon, 
  MapPinIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import useStore from '@/lib/hooks/useStore';

export default function ShowList({ shows }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {shows.map((show) => (
        <ShowCard key={show.id} show={show} />
      ))}
    </div>
  );
}

function ShowCard({ show }) {
  const { updateShow } = useStore();
  
  // Parse dates - add T12:00 to avoid timezone issues
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    if (typeof dateStr === 'string' && !dateStr.includes('T')) {
      return new Date(dateStr + 'T12:00:00');
    }
    return new Date(dateStr);
  };
  
  const startDate = parseDate(show.startDate);
  const endDate = parseDate(show.endDate);
  const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  // Format dates
  const formatDate = (date) => {
    const d = parseDate(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Calculate days until show
  const now = new Date();
  const daysUntil = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
  const isUpcoming = daysUntil > 0;
  const isOngoing = now >= startDate && now <= endDate;
  const isPast = now > endDate;

  const showStatus = show.status || 'active';
  const isActive = showStatus === 'active';

  const handleStatusToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = isActive ? 'inactive' : 'active';
    if (updateShow) {
      updateShow(show.id, { ...show, status: newStatus });
    }
  };

  return (
    <Link href={`/shows/${show.id}`} className="group block">
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden hover:shadow-lg hover:border-primary-300 transition-all">
        {/* Header with gradient */}
        <div className={`h-2 ${isActive ? 'bg-gradient-to-r from-primary-500 to-pink-500' : 'bg-secondary-300'}`} />
        
        <div className="p-4">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-bold text-secondary-900 group-hover:text-primary-600 transition-colors leading-tight">
              {show.name}
            </h3>
            <ChevronRightIcon className="w-4 h-4 text-secondary-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
          </div>
          
          {/* Date & Location */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDaysIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
              <span className="text-secondary-700">
                {formatDate(show.startDate)} – {formatDate(show.endDate)}
              </span>
              <span className="text-xs text-secondary-400">({durationDays}d)</span>
            </div>
            
            {show.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPinIcon className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                <span className="text-secondary-600">{show.location}</span>
              </div>
            )}
          </div>
          
          {/* Footer with status */}
          <div className="flex items-center justify-between pt-3 border-t border-secondary-100">
            {/* Timing badge */}
            <div className="flex items-center gap-2">
              {isOngoing && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Happening Now
                </span>
              )}
              {isUpcoming && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  daysUntil <= 7 ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-600'
                }`}>
                  {daysUntil}d away
                </span>
              )}
              {isPast && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-500">
                  Completed
                </span>
              )}
              
              {show.type && (
                <span className="text-xs text-secondary-400 capitalize">{show.type}</span>
              )}
            </div>
            
            {/* Status toggle */}
            <button
              onClick={handleStatusToggle}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                isActive ? 'bg-emerald-500' : 'bg-secondary-300'
              }`}
              title={isActive ? 'Active' : 'Inactive'}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  isActive ? 'left-[18px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
