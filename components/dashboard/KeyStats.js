import React from 'react';
import useStore from '@/lib/hooks/useStore';
import { 
  UserGroupIcon, 
  BuildingOffice2Icon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function KeyStats() {
  const { staff, clients, bookings } = useStore();
  
  // Calculate total booking days
  const totalBookingDays = bookings.reduce((total, booking) => {
    if (booking.status !== 'cancelled' && Array.isArray(booking.datesNeeded)) {
      return total + booking.datesNeeded.length;
    }
    return total;
  }, 0);

  // Active bookings (not cancelled)
  const activeBookings = bookings.filter(b => b.status !== 'cancelled');

  // Stats array
  const stats = [
    {
      id: 'clients',
      name: 'Total Clients',
      value: clients.length,
      icon: BuildingOffice2Icon,
      color: 'from-indigo-500 to-blue-500',
      link: '/clients'
    },
    {
      id: 'staff',
      name: 'Total Staff',
      value: staff.length,
      icon: UserGroupIcon,
      color: 'from-violet-500 to-purple-500',
      link: '/staff'
    },
    {
      id: 'days',
      name: 'Days Booked',
      value: totalBookingDays,
      icon: CalendarIcon,
      color: 'from-blue-500 to-cyan-500',
      link: '/bookings'
    },
    {
      id: 'bookings',
      name: 'Active Bookings',
      value: activeBookings.length,
      icon: ClipboardDocumentListIcon,
      color: 'from-emerald-500 to-green-500',
      link: '/bookings'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-5 sm:mb-8">
      {stats.map((stat) => (
        <a 
          href={stat.link}
          key={stat.id}
          className="relative bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden"
        >
          {/* Gradient top border */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${stat.color}`}></div>
          
          <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4 sm:pb-6">
            <div className={`inline-flex rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 bg-gradient-to-br ${stat.color} shadow-md`}>
              <stat.icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            
            <div className="mt-3 sm:mt-4">
              <div className="flex items-end justify-between">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary-900">{stat.value}</h3>
                <span className="p-1.5 sm:p-2 rounded-full bg-secondary-50 group-hover:bg-secondary-100 transition-colors">
                  <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-secondary-400 group-hover:text-secondary-600" />
                </span>
              </div>
              <p className="text-secondary-500 text-xs sm:text-sm mt-1">{stat.name}</p>
            </div>
            
            {/* Subtle decorative corner element */}
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl opacity-5 rounded-tl-full"></div>
          </div>
        </a>
      ))}
    </div>
  );
} 