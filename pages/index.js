import React from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/ui/DashboardLayout';
import DateHeader from '@/components/dashboard/DateHeader';
import KeyStats from '@/components/dashboard/KeyStats';
import GlobalSearch from '@/components/dashboard/GlobalSearch';

export default function Dashboard() {
  return (
    <>
      <Head>
        <title>Dashboard | The Smith Agency</title>
        <meta name="description" content="The Smith Agency management dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-2 sm:px-4">
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
          
          {/* Bottom padding to account for mobile navigation */}
          <div className="h-20 md:h-0"></div>
        </div>
      </DashboardLayout>
    </>
  );
}
