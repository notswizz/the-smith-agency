import React from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/ui/DashboardLayout';
import DateHeader from '@/components/dashboard/DateHeader';
import KeyStats from '@/components/dashboard/KeyStats';
import GlobalSearch from '@/components/dashboard/GlobalSearch';
import ShowsCalendar from '@/components/dashboard/ShowsCalendar';
import UpcomingShows from '@/components/dashboard/UpcomingShows';
import RecentStaffSignups from '@/components/dashboard/RecentStaffSignups';

export default function Dashboard() {
  return (
    <>
      <Head>
        <title>Dashboard | The Smith Agency</title>
        <meta name="description" content="The Smith Agency management dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          {/* Date Header with Quick Actions */}
          <DateHeader />
          
          {/* Global Search Section */}
          <div className="mb-6 mt-3 sm:mt-4 w-full mx-auto relative overflow-visible">
            <div className="bg-white/80 backdrop-blur-sm p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-md overflow-visible relative">
              <GlobalSearch />
            </div>
          </div>

          {/* Key Stats */}
          <KeyStats />
          
          {/* Dashboard Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Left Column: Calendar */}
            <div className="bg-white rounded-xl shadow-md p-5 transition-shadow hover:shadow-lg h-full">
              <ShowsCalendar />
            </div>
            
            {/* Right Column: Split into two components */}
            <div className="space-y-4 sm:space-y-6">
              {/* Top Right: Upcoming Shows */}
              <div className="bg-white rounded-xl shadow-md p-5 transition-shadow hover:shadow-lg">
                <UpcomingShows />
              </div>
              
              {/* Bottom Right: Recent Staff Signups */}
              <div className="bg-white rounded-xl shadow-md p-5 transition-shadow hover:shadow-lg">
                <RecentStaffSignups />
              </div>
            </div>
          </div>
          
          {/* Bottom padding to account for mobile navigation */}
          <div className="h-20 md:h-0"></div>
        </div>
      </DashboardLayout>
    </>
  );
}
