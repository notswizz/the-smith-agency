import React from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/ui/DashboardLayout';
import useStore from '@/lib/hooks/useStore';
import { 
  UserGroupIcon, 
  BuildingOffice2Icon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
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
  
  // Format date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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

  // Quick actions array
  const quickActions = [
    {
      id: 'add-staff',
      name: 'Add Staff',
      icon: UserGroupIcon,
      color: 'bg-primary-50 border-primary-100 text-primary-700 hover:bg-primary-100',
      link: '/staff/new'
    },
    {
      id: 'add-client',
      name: 'Add Client',
      icon: BuildingOffice2Icon,
      color: 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100',
      link: '/clients/new'
    },
    {
      id: 'new-booking',
      name: 'New Booking',
      icon: ClipboardDocumentListIcon,
      color: 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100',
      link: '/bookings/new'
    },
    {
      id: 'add-show',
      name: 'Add Show',
      icon: CalendarIcon,
      color: 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100',
      link: '/shows/new'
    }
  ];

  return (
    <>
      <Head>
        <title>Dashboard | The Smith Agency</title>
        <meta name="description" content="The Smith Agency management dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <DashboardLayout>
        <div className="max-w-5xl mx-auto px-2 sm:px-0">
          {/* Date Header */}
          <div className="mb-4 sm:mb-8 bg-white rounded-xl sm:rounded-2xl shadow-md border border-secondary-100 overflow-hidden">
            <div className="relative p-4 sm:p-8">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 -mt-8 sm:-mt-12 -mr-8 sm:-mr-12 w-28 sm:w-40 h-28 sm:h-40 rounded-full bg-primary-50 opacity-30"></div>
              <div className="absolute bottom-0 left-0 -mb-6 sm:-mb-8 -ml-6 sm:-ml-8 w-16 sm:w-24 h-16 sm:h-24 rounded-full bg-secondary-100 opacity-50"></div>
              
              <div className="relative">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
                    Agency Dashboard
                  </span>
                </h1>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base md:text-lg text-secondary-600">
                  {formattedDate}
                </p>
              </div>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
            {stats.map((stat) => (
              <a 
                href={stat.link}
                key={stat.id}
                className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-secondary-100 overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 group"
              >
                <div className="px-3 sm:px-6 pt-3 sm:pt-5 pb-3 sm:pb-6">
                  <div className={`inline-flex rounded-lg sm:rounded-xl p-2 sm:p-3 bg-gradient-to-br ${stat.color} shadow-md`}>
                    <stat.icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                  
                  <div className="mt-3 sm:mt-5">
                    <div className="flex items-end justify-between">
                      <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary-900">{stat.value}</h3>
                      <span className="p-1 sm:p-1.5 rounded-full bg-secondary-50 group-hover:bg-secondary-100 transition-colors">
                        <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4 text-secondary-400 group-hover:text-secondary-600" />
                      </span>
                    </div>
                    <p className="text-secondary-500 text-xs sm:text-sm mt-1 sm:mt-2">{stat.name}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-secondary-100 overflow-hidden">
            <div className="p-4 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-secondary-900 mb-3 sm:mb-6">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {quickActions.map((action) => (
                  <a 
                    key={action.id}
                    href={action.link} 
                    className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl border ${action.color} transition-all duration-200 hover:shadow-sm`}
                  >
                    <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base font-medium">{action.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
