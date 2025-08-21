import React from 'react';
import Link from 'next/link';
import { 
  BookOpenIcon, 
  ArrowRightIcon, 
  CalendarIcon, 
  BuildingOffice2Icon,
  ClockIcon
} from '@heroicons/react/24/outline';
import useStore from '@/lib/hooks/useStore';

export default function RecentBookings() {
  const { bookings, clients, shows } = useStore();
  
  // Use createdAt field to find the most recent bookings
  const recentBookings = React.useMemo(() => {
    if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
      return [];
    }
    
    // Copy the array and sort by createdAt (newest first)
    return [...bookings]
      .filter(booking => booking && booking.createdAt)
      .sort((a, b) => {
        // Sort by createdAt timestamp (newest first)
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      })
      .slice(0, 2); // Take just the first 2
  }, [bookings]);

  // Helper function to get client name
  const getClientName = (clientId) => {
    if (!clientId || !clients || !Array.isArray(clients)) return 'Unknown Client';
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  // Helper function to get show name
  const getShowName = (showId) => {
    if (!showId || !shows || !Array.isArray(shows)) return 'Unknown Show';
    const show = shows.find(s => s.id === showId);
    return show ? show.name : 'Unknown Show';
  };

  // Helper function to format date ranges
  const formatDateRange = (datesNeeded) => {
    if (!datesNeeded || !Array.isArray(datesNeeded) || datesNeeded.length === 0) return 'No dates';
    
    const sortedDates = [...datesNeeded].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstDate = sortedDates[0].date;
    const lastDate = sortedDates[sortedDates.length - 1].date;
    
    if (!firstDate || !lastDate) return 'No dates';
    
    const start = new Date(firstDate);
    const end = new Date(lastDate);
    
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    
    if (startMonth === endMonth && start.getFullYear() === end.getFullYear()) {
      if (start.getDate() === end.getDate()) {
        return `${startMonth} ${start.getDate()}, ${end.getFullYear()}`;
      }
      return `${startMonth} ${start.getDate()}-${end.getDate()}, ${end.getFullYear()}`;
    } else {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
    }
  };

  // Helper function to get status styles
  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          dot: 'bg-emerald-500'
        };
      case 'pending':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          dot: 'bg-amber-500'
        };
      case 'cancelled':
        return {
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          dot: 'bg-red-500'
        };
      default:
        return {
          bg: 'bg-secondary-50',
          text: 'text-secondary-700',
          border: 'border-secondary-200',
          dot: 'bg-secondary-500'
        };
    }
  };

  return (
    <div>
      {/* Enhanced Header (theme-aligned) */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-white border border-black-900/10 flex items-center justify-center mr-3 shadow-sm">
            <BookOpenIcon className="h-4 w-4 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-black-950">Recent Bookings</h3>
        </div>
        <Link 
          href="/bookings" 
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center group transition-all duration-300 hover:scale-105"
        >
          View all
          <ArrowRightIcon className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
      </div>
      
      {recentBookings.length > 0 ? (
        <div className="space-y-4">
          {recentBookings.map((booking, index) => {
            if (!booking) return null;
            
            const clientName = getClientName(booking.clientId);
            const showName = getShowName(booking.showId);
            const dateRange = formatDateRange(booking.datesNeeded);
            const statusStyles = getStatusStyle(booking.status);
            
            return (
              <Link 
                key={booking.id || index} 
                href={`/bookings/${booking.id}`}
                className="group block p-5 rounded-xl bg-white/95 border border-secondary-100 hover:border-secondary-200 transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden"
              >
                {/* Decorative elements removed for cleaner theme */}
                
                <div className="flex items-start">
                  {/* Enhanced Icon */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 mr-4 bg-white text-primary-500 flex items-center justify-center font-medium text-sm shadow-md border border-black-900/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative">
                    <BuildingOffice2Icon className="h-6 w-6 text-primary-500" />
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-black-950 text-base leading-tight group-hover:text-secondary-800 transition-colors duration-300">
                          {clientName}
                        </h4>
                        <p className="text-sm text-secondary-600 mt-0.5 leading-tight group-hover:text-secondary-700 transition-colors duration-300">
                          {showName}
                        </p>
                      </div>
                      
                      {/* Enhanced Status Badge */}
                      <div className={`flex items-center px-3 py-1.5 rounded-full ${statusStyles.bg} ${statusStyles.border} ml-3 flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                        <div className={`w-2 h-2 rounded-full ${statusStyles.dot} mr-2`}></div>
                        <span className={`text-xs font-medium ${statusStyles.text} capitalize`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                    
                    {/* Date Range */}
                    <div className="flex items-center text-sm text-secondary-500 group-hover:text-secondary-600 transition-colors duration-300">
                      <CalendarIcon className="h-4 w-4 mr-2 text-primary-500" />
                      <span className="font-medium">{dateRange}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 px-6 bg-white/95 rounded-xl border border-secondary-200 hover:shadow-md transition-all duration-300">
          <div className="w-16 h-16 rounded-full bg-secondary-200 flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-transform duration-300">
            <BookOpenIcon className="h-8 w-8 text-secondary-400" />
          </div>
          <p className="text-secondary-600 font-medium">No recent bookings</p>
          <p className="text-secondary-500 text-sm mt-1">New bookings will appear here</p>
        </div>
      )}
    </div>
  );
} 