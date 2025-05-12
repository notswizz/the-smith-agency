import React from 'react';
import Link from 'next/link';
import { 
  BookOpenIcon, 
  ArrowRightIcon, 
  CalendarIcon, 
  BuildingOffice2Icon 
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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-secondary-50 text-secondary-700 border-secondary-200';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <BookOpenIcon className="h-5 w-5 mr-2 text-violet-600" />
          <h3 className="text-base font-medium text-secondary-900">Recent Bookings</h3>
        </div>
        <Link href="/bookings" className="text-sm text-violet-600 hover:text-violet-800 flex items-center">
          View all
          <ArrowRightIcon className="ml-1 h-4 w-4" />
        </Link>
      </div>
      
      {recentBookings.length > 0 ? (
        <div className="space-y-3">
          {recentBookings.map((booking, index) => {
            if (!booking) return null;
            
            const clientName = getClientName(booking.clientId);
            const showName = getShowName(booking.showId);
            const dateRange = formatDateRange(booking.datesNeeded);
            const statusClass = getStatusStyle(booking.status);
            
            return (
              <Link 
                key={booking.id || index} 
                href={`/bookings/${booking.id}`}
                className="flex items-start p-3 rounded-lg bg-violet-50 border border-violet-100 hover:bg-violet-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-3 bg-violet-500 text-white flex items-center justify-center font-medium text-sm shadow-sm border border-violet-200">
                  <BuildingOffice2Icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-secondary-900">{clientName}</div>
                  <div className="text-xs text-secondary-600">{showName}</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs flex items-center text-secondary-500">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {dateRange}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-4 bg-secondary-50 rounded-lg">
          <BookOpenIcon className="h-8 w-8 mx-auto text-secondary-400 mb-2" />
          <p className="text-secondary-500 text-sm">No recent bookings</p>
        </div>
      )}
    </div>
  );
} 