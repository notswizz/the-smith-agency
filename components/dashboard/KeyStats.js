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
  
  // Calculate total booking days
  const totalBookingDays = bookingsArray.reduce((total, booking) => {
    if (booking.status !== 'cancelled' && Array.isArray(booking.datesNeeded)) {
      return total + booking.datesNeeded.length;
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
      gradient: 'from-indigo-400 to-blue-600',
      iconGradient: 'from-indigo-500 to-blue-600',
      accentColor: 'indigo-400',
      link: '/clients',
      decoration: '✦'
    },
    {
      id: 'staff',
      name: 'Total Staff',
      value: staff.length,
      icon: UserGroupIcon,
      gradient: 'from-violet-400 to-purple-600',
      iconGradient: 'from-violet-500 to-purple-600',
      accentColor: 'violet-400',
      link: '/staff',
      decoration: '✧'
    },
    {
      id: 'days',
      name: 'Days Booked',
      value: totalBookingDays,
      icon: CalendarIcon,
      gradient: 'from-blue-400 to-cyan-600',
      iconGradient: 'from-blue-500 to-cyan-600',
      accentColor: 'blue-400',
      link: '/bookings',
      decoration: '◆'
    },
    {
      id: 'bookings',
      name: 'Total Bookings',
      value: bookingsArray.length,
      icon: ClipboardDocumentListIcon,
      gradient: 'from-emerald-400 to-green-600',
      iconGradient: 'from-emerald-500 to-green-600',
      accentColor: 'emerald-400',
      link: '/bookings',
      decoration: '◇'
    }
  ];

  // Helper function to get accent color class
  const getAccentColorClass = (accentColor) => {
    switch(accentColor) {
      case 'indigo-400': return 'text-indigo-400';
      case 'violet-400': return 'text-violet-400';
      case 'blue-400': return 'text-blue-400';
      case 'emerald-400': return 'text-emerald-400';
      default: return 'text-secondary-400';
    }
  };
  
  // Helper function to get accent background color class
  const getAccentBgClass = (accentColor) => {
    switch(accentColor) {
      case 'indigo-400': return 'bg-indigo-400/10 hover:bg-indigo-400/20';
      case 'violet-400': return 'bg-violet-400/10 hover:bg-violet-400/20';
      case 'blue-400': return 'bg-blue-400/10 hover:bg-blue-400/20';
      case 'emerald-400': return 'bg-emerald-400/10 hover:bg-emerald-400/20';
      default: return 'bg-secondary-400/10 hover:bg-secondary-400/20';
    }
  };
  
  // Helper function to get accent icon color class
  const getAccentIconClass = (accentColor) => {
    switch(accentColor) {
      case 'indigo-400': return 'text-indigo-400';
      case 'violet-400': return 'text-violet-400';
      case 'blue-400': return 'text-blue-400';
      case 'emerald-400': return 'text-emerald-400';
      default: return 'text-secondary-400';
    }
  };
  
  // Helper function to get shadow class
  const getShadowClass = (accentColor) => {
    switch(accentColor) {
      case 'indigo-400': return 'hover:shadow-indigo-400/10';
      case 'violet-400': return 'hover:shadow-violet-400/10';
      case 'blue-400': return 'hover:shadow-blue-400/10';
      case 'emerald-400': return 'hover:shadow-emerald-400/10';
      default: return 'hover:shadow-secondary-400/10';
    }
  };

  // Helper function to get gradient background class for decorative elements
  const getGradientBgClass = (accentColor) => {
    switch(accentColor) {
      case 'indigo-400': return 'from-indigo-400/5';
      case 'violet-400': return 'from-violet-400/5';
      case 'blue-400': return 'from-blue-400/5';
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
          {/* Gradient top border */}
          <div className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${stat.gradient} group-hover:h-3 transition-all duration-300`}></div>
          
          <div className="px-5 sm:px-6 pt-6 sm:pt-7 pb-5 sm:pb-6 flex flex-col h-full relative">
            <div className="flex items-start justify-between">
              <div className={`relative p-3 sm:p-4 rounded-xl bg-gradient-to-br ${stat.iconGradient} shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                
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
                <h3 className={`text-3xl sm:text-4xl font-bold ${getAccentColorClass(stat.accentColor)} transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-lg`}>
                  {stat.value}
                </h3>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getAccentBgClass(stat.accentColor)} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                  <ArrowRightIcon className={`h-5 w-5 ${getAccentIconClass(stat.accentColor)} opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-1 group-hover:rotate-12`} />
                </div>
              </div>
              <p className="text-secondary-600 text-sm mt-2 font-semibold group-hover:text-secondary-700 transition-colors duration-300">{stat.name}</p>
            </div>
            
            {/* Decorative elements */}
            <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-tl ${getGradientBgClass(stat.accentColor)} to-transparent opacity-30 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700`}></div>
            <div className={`absolute -top-8 -left-8 w-28 h-28 rounded-full bg-gradient-to-br ${getGradientBgClass(stat.accentColor)} to-transparent opacity-30 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700`}></div>
            
            {/* Floating particles effect */}
            <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${getAccentColorClass(stat.accentColor)} opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-700 delay-100`}></div>
            <div className={`absolute bottom-8 left-6 w-1.5 h-1.5 rounded-full ${getAccentColorClass(stat.accentColor)} opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-700 delay-200`}></div>
          </div>
        </Link>
      ))}
    </div>
  );
} 