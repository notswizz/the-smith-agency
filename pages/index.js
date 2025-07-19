import React from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/ui/DashboardLayout';
import DateHeader from '@/components/dashboard/DateHeader';
import KeyStats from '@/components/dashboard/KeyStats';
import ShowsCalendar from '@/components/dashboard/ShowsCalendar';
import RecentStaffSignups from '@/components/dashboard/RecentStaffSignups';
import RecentBookings from '@/components/dashboard/RecentBookings';

export default function Dashboard() {
  return (
    <>
      <Head>
        <title>Dashboard | The Smith Agency</title>
        <meta name="description" content="The Smith Agency management dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <DashboardLayout>
        {/* Full-width colorful background gradient at the top of the dashboard */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-br from-primary-500/20 via-indigo-400/10 to-purple-500/5 backdrop-blur-3xl -z-10"></div>
        
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary-500/10 animate-float-slow"></div>
          <div className="absolute top-40 right-10 w-24 h-24 rounded-full bg-indigo-500/10 animate-float-medium"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 rounded-full bg-violet-500/10 animate-float-fast"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          {/* Combined Date Header with Search */}
          <DateHeader />

          {/* Key Stats with enhanced appearance */}
          <KeyStats />
          
          {/* Dashboard Content Grid - Two Even Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-8">
            {/* Left Column: Calendar */}
            <div className="space-y-6 sm:space-y-8">
              {/* Calendar - Enhanced with better borders and shadows */}
              <div className="bg-white/95 rounded-2xl shadow-xl shadow-primary-500/5 p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/10 border border-white/80">
                <ShowsCalendar />
              </div>
            </div>
            
            {/* Right Column: Recent Sections */}
            <div className="space-y-6 sm:space-y-8">
              {/* Recent Bookings */}
              <div className="bg-white/95 rounded-2xl shadow-xl shadow-emerald-500/5 p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 border border-white/80">
                <RecentBookings />
              </div>
              
              {/* Recent Staff Signups */}
              <div className="bg-white/95 rounded-2xl shadow-xl shadow-violet-500/5 p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/10 border border-white/80">
                <RecentStaffSignups />
              </div>
            </div>
          </div>
          
          {/* Bottom padding to account for mobile navigation */}
          <div className="h-20 md:h-0"></div>
        </div>
      </DashboardLayout>
      
      {/* Add custom animations */}
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(-5deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 6s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: float-fast 4s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
