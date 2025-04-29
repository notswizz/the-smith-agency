import React, { useMemo } from 'react';
import useStore from '@/lib/hooks/useStore';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  ClipboardDocumentListIcon, 
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

export default function QuickStats() {
  const { staff, clients, bookings, shows } = useStore();
  
  // Calculate stats
  const stats = useMemo(() => {
    // Total booking days (all days across all bookings)
    let totalBookingDays = 0;
    let totalStaffAssignments = 0;
    let totalNeededAssignments = 0;
    let completedBookings = 0;
    let totalRevenue = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Active vs inactive bookings
    const activeBookings = bookings.filter(b => b.status !== 'cancelled');
    
    // Calculate needed metrics
    bookings.forEach(booking => {
      const datesNeeded = Array.isArray(booking.datesNeeded) ? booking.datesNeeded : [];
      
      if (booking.status !== 'cancelled') {
        totalBookingDays += datesNeeded.length;
        
        // Count staff assignments
        datesNeeded.forEach(d => {
          const staffCount = d.staffCount || 1;
          totalNeededAssignments += staffCount;
          totalStaffAssignments += Array.isArray(d.staffIds) 
            ? d.staffIds.filter(Boolean).length 
            : 0;
        });
        
        // Check if booking is fully staffed
        const isFullyStaffed = datesNeeded.every(d => {
          const needed = d.staffCount || 1;
          const assigned = Array.isArray(d.staffIds) ? d.staffIds.filter(Boolean).length : 0;
          return assigned >= needed;
        });
        
        if (isFullyStaffed && datesNeeded.length > 0) {
          completedBookings++;
        }
        
        // Sum revenue if available
        if (booking.revenue) {
          totalRevenue += parseFloat(booking.revenue) || 0;
        }
      }
    });

    return [
      {
        id: 'total-clients',
        name: 'Total Clients',
        value: clients.length,
        description: 'Active client accounts',
        icon: BuildingOffice2Icon,
        color: 'bg-indigo-500',
        textColor: 'text-indigo-50',
        trend: '+4%',
        trendDirection: 'up'
      },
      {
        id: 'total-staff',
        name: 'Total Staff',
        value: staff.length,
        description: 'Available personnel',
        icon: UserGroupIcon,
        color: 'bg-primary-500',
        textColor: 'text-primary-50',
        trend: '+2%',
        trendDirection: 'up'
      },
      {
        id: 'total-bookings',
        name: 'Active Bookings',
        value: activeBookings.length,
        description: 'Confirmed & pending bookings',
        icon: ClipboardDocumentListIcon,
        color: 'bg-success-500',
        textColor: 'text-success-50',
        trend: '+12%',
        trendDirection: 'up'
      },
      {
        id: 'days-booked',
        name: 'Days Booked',
        value: totalBookingDays,
        description: 'Total scheduled days',
        icon: CalendarIcon,
        color: 'bg-blue-500',
        textColor: 'text-blue-50',
        trend: '+8%',
        trendDirection: 'up'
      },
      {
        id: 'staff-assignments',
        name: 'Staff Assignments',
        value: `${totalStaffAssignments}/${totalNeededAssignments}`,
        description: `${Math.round((totalStaffAssignments / Math.max(totalNeededAssignments, 1)) * 100)}% staffed`,
        icon: CheckBadgeIcon,
        color: 'bg-amber-500',
        textColor: 'text-amber-50',
        progress: totalNeededAssignments > 0 ? totalStaffAssignments / totalNeededAssignments : 0
      },
      {
        id: 'total-shows',
        name: 'Total Shows',
        value: shows.length,
        description: 'Active & upcoming shows',
        icon: ClockIcon,
        color: 'bg-purple-500',
        textColor: 'text-purple-50'
      }
    ];
  }, [staff, clients, bookings, shows]);

  return (
    <div className="px-4 py-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <div 
            key={stat.id} 
            className="relative overflow-hidden rounded-lg border-2 border-white bg-white shadow-md transition-all hover:shadow-lg"
          >
            {/* Progress bar for assignment stats */}
            {stat.progress !== undefined && (
              <div 
                className="absolute top-0 left-0 h-1 bg-success-500" 
                style={{ width: `${Math.min(100, Math.round(stat.progress * 100))}%` }}
              ></div>
            )}
            
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className={`h-6 w-6 ${stat.textColor}`} aria-hidden="true" />
                </div>
                <div className="ml-4">
                  <div className="text-base font-medium text-secondary-500">{stat.name}</div>
                  <div className="text-2xl font-bold text-secondary-900">{stat.value}</div>
                </div>
              </div>
              <div className="mt-4 border-t border-secondary-100 pt-3 text-sm text-secondary-500">
                {stat.description}
                {stat.trend && (
                  <span 
                    className={`ml-2 inline-flex items-center font-medium ${
                      stat.trendDirection === 'up' ? 'text-success-600' : 'text-danger-600'
                    }`}
                  >
                    {stat.trend}
                    {stat.trendDirection === 'up' ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                      </svg>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 