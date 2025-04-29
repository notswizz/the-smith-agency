import React from 'react';
import useStore from '@/lib/hooks/useStore';
import Card from '@/components/ui/Card';
import { 
  UserGroupIcon, 
  CalendarIcon, 
  ClipboardDocumentCheckIcon, 
  BuildingOffice2Icon 
} from '@heroicons/react/24/outline';

export default function QuickStats() {
  const { staff, clients, bookings, shows } = useStore();
  
  // Calculate upcoming bookings (from today onwards)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Total booking days (all future days across all bookings)
  let totalBookingDays = 0;
  let totalStaffAssignments = 0;
  let totalNeededAssignments = 0;
  let uniqueStaffIds = new Set();

  bookings.forEach(booking => {
    const datesNeeded = Array.isArray(booking.datesNeeded) ? booking.datesNeeded : [];
    totalBookingDays += datesNeeded.length;
    datesNeeded.forEach(d => {
      totalNeededAssignments += d.staffCount || 1;
      if (Array.isArray(d.staffIds)) {
        totalStaffAssignments += d.staffIds.filter(Boolean).length;
        d.staffIds.filter(Boolean).forEach(id => uniqueStaffIds.add(id));
      }
    });
  });

  const upcomingBookings = bookings.filter(booking => {
    // Support both booking.dates (legacy) and booking.datesNeeded (current)
    const dateArray = Array.isArray(booking.dates)
      ? booking.dates
      : Array.isArray(booking.datesNeeded)
        ? booking.datesNeeded.map(d => d.date)
        : [];
    return dateArray.some(dateStr => {
      const bookingDate = new Date(dateStr);
      return bookingDate >= today;
    });
  });
  
  // Calculate completion rate (fully staffed bookings / all bookings)
  const fullyStaffedBookings = upcomingBookings.filter(
    booking => booking.status === 'fully_staffed'
  );
  
  const completionRate = upcomingBookings.length > 0
    ? Math.round((fullyStaffedBookings.length / upcomingBookings.length) * 100)
    : 0;
  
  const stats = [
    {
      name: 'Active Staff',
      value: staff.length,
      icon: UserGroupIcon,
      color: 'bg-primary-100 text-primary-600',
    },
    {
      name: 'Upcoming Bookings',
      value: upcomingBookings.length,
      icon: ClipboardDocumentCheckIcon,
      color: 'bg-green-100 text-green-600',
    },
    {
      name: 'Booking Days',
      value: totalBookingDays,
      icon: CalendarIcon,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      name: 'Staff Assigned',
      value: totalStaffAssignments,
      icon: UserGroupIcon,
      color: 'bg-teal-100 text-teal-600',
    },
    {
      name: 'Needed Assignments',
      value: totalNeededAssignments,
      icon: ClipboardDocumentCheckIcon,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      name: 'Unique Staff Working',
      value: uniqueStaffIds.size,
      icon: UserGroupIcon,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      name: 'Staffing Rate',
      value: `${completionRate}%`,
      icon: CalendarIcon,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      name: 'Total Clients',
      value: clients.length,
      icon: BuildingOffice2Icon,
      color: 'bg-indigo-100 text-indigo-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.name} className="p-0">
          <div className="p-4 flex items-center">
            <div className={`p-2 rounded-md ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-secondary-500">{stat.name}</div>
              <div className="text-xl font-semibold text-secondary-900">{stat.value}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
} 