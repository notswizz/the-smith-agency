import React from 'react';
import useStore from '@/lib/hooks/useStore';
import { 
  UserGroupIcon, 
  BuildingOffice2Icon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function KeyStats() {
  const { staff, clients, bookings } = useStore();
  
  // Ensure bookings is an array and handle potential nested structure
  const bookingsArray = Array.isArray(bookings) 
    ? bookings 
    : (bookings?.items && Array.isArray(bookings.items)) 
      ? bookings.items 
      : [];
  
  // Calculate total booking dates and days
  const totalBookingDates = bookingsArray.reduce((total, booking) => {
    if (booking.status !== 'cancelled' && Array.isArray(booking.datesNeeded)) {
      // Only count dates where staffCount > 0
      const datesWithStaff = booking.datesNeeded.filter(d => (d.staffCount || 0) > 0);
      return total + datesWithStaff.length;
    }
    return total;
  }, 0);

  const totalStaffDays = bookingsArray.reduce((total, booking) => {
    if (booking.status !== 'cancelled' && Array.isArray(booking.datesNeeded)) {
      // Calculate total staff days (assignments)
      const datesWithStaff = booking.datesNeeded.filter(d => (d.staffCount || 0) > 0);
      return total + datesWithStaff.reduce((sum, date) => sum + (date.staffCount || 0), 0);
    }
    return total;
  }, 0);

  // Active bookings (not cancelled)
  const activeBookings = bookingsArray.filter(b => b.status !== 'cancelled');

  // Stats array
  const stats = [
    {
      id: 'clients',
      name: 'Total Clients',
      value: clients.length,
      icon: BuildingOffice2Icon,
      gradient: 'from-primary-500 to-black-900',
      iconGradient: 'from-black-900 to-primary-700',
      accentColor: 'primary-500',
      link: '/clients',
      decoration: '✦'
    },
    {
      id: 'staff',
      name: 'Total Staff',
      value: staff.length,
      icon: UserGroupIcon,
      gradient: 'from-primary-500 to-black-900',
      iconGradient: 'from-black-900 to-primary-700',
      accentColor: 'primary-500',
      link: '/staff',
      decoration: '✧'
    },
    {
      id: 'days',
      name: 'Days Booked',
      value: totalStaffDays,
      icon: CalendarIcon,
      gradient: 'from-primary-500 to-black-900',
      iconGradient: 'from-black-900 to-primary-700',
      accentColor: 'primary-500',
      link: '/bookings',
      decoration: '◇'
    },
    {
      id: 'bookings',
      name: 'Total Bookings',
      value: bookingsArray.length,
      icon: ClipboardDocumentListIcon,
      gradient: 'from-primary-500 to-black-900',
      iconGradient: 'from-black-900 to-primary-700',
      accentColor: 'primary-500',
      link: '/bookings',
      decoration: '◇'
    }
  ];

  // Helper function to get accent color class
  const getAccentColorClass = (accentColor) => {
    switch(accentColor) {
      case 'primary-500': return 'text-primary-500';
      case 'indigo-400': return 'text-indigo-400';
      case 'violet-400': return 'text-violet-400';
      case 'blue-400': return 'text-blue-400';
      case 'purple-400': return 'text-purple-400';
      case 'emerald-400': return 'text-emerald-400';
      default: return 'text-secondary-400';
    }
  };
  
  // Helper function to get accent background color class
  const getAccentBgClass = (accentColor) => {
    switch(accentColor) {
      case 'primary-500': return 'bg-primary-500/10 hover:bg-primary-500/20';
      case 'indigo-400': return 'bg-indigo-400/10 hover:bg-indigo-400/20';
      case 'violet-400': return 'bg-violet-400/10 hover:bg-violet-400/20';
      case 'blue-400': return 'bg-blue-400/10 hover:bg-blue-400/20';
      case 'purple-400': return 'bg-purple-400/10 hover:bg-purple-400/20';
      case 'emerald-400': return 'bg-emerald-400/10 hover:bg-emerald-400/20';
      default: return 'bg-secondary-400/10 hover:bg-secondary-400/20';
    }
  };
  
  // Helper function to get accent icon color class
  const getAccentIconClass = (accentColor) => {
    switch(accentColor) {
      case 'primary-500': return 'text-primary-500';
      case 'indigo-400': return 'text-indigo-400';
      case 'violet-400': return 'text-violet-400';
      case 'blue-400': return 'text-blue-400';
      case 'purple-400': return 'text-purple-400';
      case 'emerald-400': return 'text-emerald-400';
      default: return 'text-secondary-400';
    }
  };
  
  // Helper function to get shadow class
  const getShadowClass = (accentColor) => {
    switch(accentColor) {
      case 'primary-500': return 'hover:shadow-primary-500/10';
      case 'indigo-400': return 'hover:shadow-indigo-400/10';
      case 'violet-400': return 'hover:shadow-violet-400/10';
      case 'blue-400': return 'hover:shadow-blue-400/10';
      case 'purple-400': return 'hover:shadow-purple-400/10';
      case 'emerald-400': return 'hover:shadow-emerald-400/10';
      default: return 'hover:shadow-secondary-400/10';
    }
  };

  // Helper function to get gradient background class for decorative elements
  const getGradientBgClass = (accentColor) => {
    switch(accentColor) {
      case 'primary-500': return 'from-primary-500/5';
      case 'indigo-400': return 'from-indigo-400/5';
      case 'violet-400': return 'from-violet-400/5';
      case 'blue-400': return 'from-blue-400/5';
      case 'purple-400': return 'from-purple-400/5';
      case 'emerald-400': return 'from-emerald-400/5';
      default: return 'from-secondary-400/5';
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-8 sm:mb-10">
      {stats.map((stat) => (
        <Link 
          href={stat.link}
          key={stat.id}
          className={`relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl ${getShadowClass(stat.accentColor)} transition-all duration-500 transform hover:-translate-y-2 group overflow-hidden border border-white/80 hover:border-white/90`}
        >
          {/* Solid top border accent (black) */}
          <div className={`absolute inset-x-0 top-0 h-2 bg-black-900 group-hover:h-3 transition-all duration-300`}></div>
          
          <div className="px-5 sm:px-6 pt-6 sm:pt-7 pb-5 sm:pb-6 flex flex-col h-full relative">
            <div className="flex items-start justify-between">
              <div className={`relative p-3 sm:p-4 rounded-xl bg-white border border-black-900/10 shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500" />
                
                {/* Subtle shine effect */}
                <div className="absolute inset-0 rounded-xl bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Animated ring effect */}
                <div className={`absolute inset-0 rounded-xl border-2 border-white/30 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700`}></div>
              </div>
              
              <span className={`text-4xl opacity-5 ${getAccentColorClass(stat.accentColor)} font-bold group-hover:opacity-15 group-hover:scale-110 transition-all duration-500`}>
                {stat.decoration}
              </span>
            </div>
            
            <div className="mt-5 sm:mt-6 flex-grow flex flex-col justify-end">
              <div className="flex items-end justify-between">
                <h3 className={`text-3xl sm:text-4xl font-bold text-black-950 transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-lg`}>
                  {stat.value}
                </h3>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getAccentBgClass(stat.accentColor)} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                  <ArrowRightIcon className={`h-5 w-5 ${getAccentIconClass(stat.accentColor)} opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-1 group-hover:rotate-12`} />
                </div>
              </div>
              <p className="text-secondary-600 text-sm mt-2 font-semibold group-hover:text-secondary-700 transition-colors duration-300">{stat.name}</p>
            </div>
            
            {/* Decorative gradient elements removed per design preference */}
            
            {/* Floating particles effect */}
            <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${getAccentColorClass(stat.accentColor)} opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-700 delay-100`}></div>
            <div className={`absolute bottom-8 left-6 w-1.5 h-1.5 rounded-full ${getAccentColorClass(stat.accentColor)} opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-700 delay-200`}></div>
          </div>
        </Link>
      ))}
    </div>
  );
} 