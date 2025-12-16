import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import useStore from '@/lib/hooks/useStore';

export default function ShowList({ shows }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
  now.setHours(12, 0, 0, 0);
  const daysUntil = Math.round((startDate - now) / (1000 * 60 * 60 * 24));
  const isUpcoming = daysUntil > 0;
  const isOngoing = now >= startDate && now <= endDate;
  const isPast = now > endDate;

  const showStatus = show.status || 'active';
  const isActive = showStatus === 'active';

  const handleStatusToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = isActive ? 'inactive' : 'active';
    if (updateShow) {
      try {
        await updateShow(show.id, { status: newStatus });
      } catch (err) {
        console.error('Failed to update show status:', err);
      }
    }
  };

  return (
    <Link href={`/shows/${show.id}`} className="group block">
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden hover:shadow-lg hover:border-primary-300 transition-all">
        {/* Top bar */}
        <div className={`h-1.5 ${isActive ? 'bg-gradient-to-r from-primary-500 to-pink-500' : 'bg-secondary-300'}`} />
        
        <div className="p-4">
          {/* Badges row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {show.location && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-100 text-primary-700">
                  {show.location}
                </span>
              )}
              {show.season && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary-100 text-secondary-700">
                  {show.season}
                </span>
              )}
              {show.type && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 capitalize">
                  {show.type}
                </span>
              )}
            </div>
            <ChevronRightIcon className="w-4 h-4 text-secondary-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </div>
          
          {/* Date and status row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-secondary-700">
              <span>{formatDate(show.startDate)} – {formatDate(show.endDate)}</span>
              <span className="text-xs text-secondary-400">({durationDays}d)</span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Status badge */}
              {isOngoing && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Live</span>
              )}
              {isUpcoming && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  daysUntil <= 7 ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-600'
                }`}>
                  {daysUntil}d
                </span>
              )}
              {isPast && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-500">Done</span>
              )}
              
              {/* Toggle */}
              <button
                onClick={handleStatusToggle}
                className={`relative w-10 h-5 rounded-full transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-inner' 
                    : 'bg-secondary-200'
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all ${
                  isActive ? 'left-[22px]' : 'left-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
