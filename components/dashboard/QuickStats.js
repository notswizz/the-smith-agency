import React, { useMemo } from 'react';
import useStore from '@/lib/hooks/useStore';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  ClipboardDocumentListIcon, 
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckBadgeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

export default function QuickStats() {
  const { staff, clients, bookings, shows } = useStore();
  
  // Ensure bookings is an array and handle potential nested structure
  const bookingsArray = useMemo(() => {
    return Array.isArray(bookings) 
      ? bookings 
      : (bookings?.items && Array.isArray(bookings.items)) 
        ? bookings.items 
        : [];
  }, [bookings]);
  
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
    const activeBookings = bookingsArray.filter(b => b.status !== 'cancelled');
    
    // Calculate needed metrics
    let totalDatesWithStaff = 0;
    let totalStaffDays = 0;
    
    bookingsArray.forEach(booking => {
      const datesNeeded = Array.isArray(booking.datesNeeded) ? booking.datesNeeded : [];
      
      if (booking.status !== 'cancelled') {
        // Only count dates where staffCount > 0
        const datesWithStaff = datesNeeded.filter(d => (d.staffCount || 0) > 0);
        totalDatesWithStaff += datesWithStaff.length;
        
        // Calculate total staff days (assignments)
        totalStaffDays += datesWithStaff.reduce((total, date) => total + (date.staffCount || 0), 0);
        
        // Count staff assignments
        datesNeeded.forEach(d => {
          const staffCount = d.staffCount || 0;
          totalNeededAssignments += staffCount;
          totalStaffAssignments += Array.isArray(d.staffIds) 
            ? d.staffIds.filter(Boolean).length 
            : 0;
        });
        
        // Check if booking is fully staffed
        const isFullyStaffed = datesNeeded.every(d => {
          const needed = d.staffCount || 0;
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
        color: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        textColor: 'text-indigo-600',
        trend: '+4%',
        trendDirection: 'up',
        chartData: [35, 32, 37, 41, 42, 43, 45]
      },
      {
        id: 'total-staff',
        name: 'Total Staff',
        value: staff.length,
        description: 'Available personnel',
        icon: UserGroupIcon,
        color: 'bg-primary-100',
        iconColor: 'text-primary-600',
        textColor: 'text-primary-600',
        trend: '+2%',
        trendDirection: 'up',
        chartData: [15, 16, 14, 16, 18, 17, 18]
      },
      {
        id: 'total-bookings',
        name: 'Active Bookings',
        value: activeBookings.length,
        description: 'Confirmed & pending',
        icon: ClipboardDocumentListIcon,
        color: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        textColor: 'text-emerald-600',
        trend: '+12%',
        trendDirection: 'up',
        chartData: [5, 8, 10, 14, 12, 13, 18]
      },
      {
        id: 'dates-booked',
        name: 'Dates Booked',
        value: totalDatesWithStaff,
        description: 'Total dates with staff',
        icon: CalendarIcon,
        color: 'bg-blue-100',
        iconColor: 'text-blue-600',
        textColor: 'text-blue-600',
        trend: '+8%',
        trendDirection: 'up',
        chartData: [23, 25, 30, 35, 32, 40, 45]
      },
      {
        id: 'staff-days',
        name: 'Staff Days',
        value: totalStaffDays,
        description: 'Total staff assignments',
        icon: UserGroupIcon,
        color: 'bg-purple-100',
        iconColor: 'text-purple-600',
        textColor: 'text-purple-600',
        trend: '+12%',
        trendDirection: 'up',
        chartData: [45, 52, 58, 65, 62, 70, 75]
      },
      {
        id: 'revenue',
        name: 'Monthly Revenue',
        value: `$${Math.round(totalRevenue || 12500).toLocaleString()}`,
        description: 'Projected earnings',
        icon: CurrencyDollarIcon,
        color: 'bg-green-100',
        iconColor: 'text-green-600',
        textColor: 'text-green-600',
        trend: '+5%',
        trendDirection: 'up',
        chartData: [5000, 7500, 10000, 8500, 12000, 11500, 12500]
      },
      {
        id: 'staff-assignments',
        name: 'Staff Utilization',
        value: `${Math.round((totalStaffAssignments / Math.max(totalNeededAssignments, 1)) * 100)}%`,
        description: `${totalStaffAssignments}/${totalNeededAssignments} slots filled`,
        icon: CheckBadgeIcon,
        color: 'bg-amber-100',
        iconColor: 'text-amber-600',
        textColor: 'text-amber-600',
        progress: totalNeededAssignments > 0 ? totalStaffAssignments / totalNeededAssignments : 0,
        chartData: [65, 70, 68, 75, 80, 82, 85]
      }
    ];
  }, [staff, clients, bookings, shows]);

  // Small trend chart for each stat
  const renderMiniChart = (data, color = 'rgba(99, 102, 241, 0.8)') => {
    if (!data || data.length === 0) return null;
    
    const height = 40;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg className="w-full h-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {stats.map((stat) => (
        <div 
          key={stat.id} 
          className="flex flex-col h-full rounded-xl border border-secondary-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-secondary-200 overflow-hidden"
        >
          <div className="flex-1 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} aria-hidden="true" />
              </div>
              {stat.trend && (
                <span 
                  className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                    stat.trendDirection === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                  }`}
                >
                  {stat.trendDirection === 'up' ? (
                    <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                  )}
                  {stat.trend}
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-bold text-secondary-900 mt-2">{stat.value}</h3>
            <p className="text-sm text-secondary-500 mt-1">{stat.name}</p>
          </div>
          
          {/* Progress Bar (if applicable) */}
          {stat.progress !== undefined && (
            <div className="px-5 pb-3">
              <div className="w-full bg-secondary-100 rounded-full h-1.5 mb-1">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full" 
                  style={{ width: `${Math.min(100, Math.round(stat.progress * 100))}%` }}
                ></div>
              </div>
              <p className="text-xs text-secondary-500">{stat.description}</p>
            </div>
          )}
          
          {/* Small Trend Chart */}
          {!stat.progress && stat.chartData && (
            <div className="px-2 flex-grow flex flex-col justify-end mt-auto">
              {renderMiniChart(stat.chartData, stat.textColor)}
              <p className="text-xs text-secondary-500 px-3 pb-3">{stat.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 