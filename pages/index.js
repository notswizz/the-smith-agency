import React from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/ui/DashboardLayout';
import QuickStats from '@/components/dashboard/QuickStats';
import RecentActivity from '@/components/dashboard/RecentActivity';
import UpcomingShows from '@/components/dashboard/UpcomingShows';
import PendingActions from '@/components/dashboard/PendingActions';

export default function Dashboard() {
  return (
    <>
      <Head>
        <title>Dashboard | The Smith Agency</title>
        <meta name="description" content="The Smith Agency management dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <DashboardLayout>
        <div className="min-h-screen bg-secondary-50 space-y-8 py-6">
          {/* Header with welcome message and date */}
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">
                  Agency Dashboard
                </h1>
                <p className="mt-1 text-sm text-secondary-500">
                  Welcome back to your agency management system
                </p>
              </div>
              <div className="mt-4 sm:mt-0 text-sm font-medium text-secondary-600 bg-white px-4 py-2 rounded-lg shadow-sm border border-secondary-100">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
          
          {/* Quick Stats Section */}
          <section>
            <div className="px-4 sm:px-6 lg:px-8">
              <h2 className="text-lg font-medium text-secondary-800 mb-4">Agency Overview</h2>
              <div className="bg-white rounded-xl shadow-sm border border-secondary-100 overflow-hidden">
                <QuickStats />
              </div>
            </div>
          </section>
          
          {/* Main dashboard content */}
          <section className="px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity with enhanced styling */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-secondary-100 h-full overflow-hidden">
                  <div className="px-5 py-4 border-b border-secondary-100 flex items-center justify-between">
                    <h2 className="font-semibold text-secondary-900">Recent Activity</h2>
                    <span className="text-xs text-secondary-500 bg-secondary-50 px-2 py-1 rounded-full">
                      Last 7 days
                    </span>
                  </div>
                  <div className="p-1">
                    <RecentActivity />
                  </div>
                </div>
              </div>
              
              {/* Upcoming Shows with enhanced styling */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-secondary-100 h-full overflow-hidden">
                  <div className="px-5 py-4 border-b border-secondary-100 flex items-center justify-between">
                    <h2 className="font-semibold text-secondary-900">Upcoming Shows</h2>
                    <span className="text-xs text-secondary-500 bg-secondary-50 px-2 py-1 rounded-full">
                      Next 30 days
                    </span>
                  </div>
                  <div className="p-1">
                    <UpcomingShows />
                  </div>
                </div>
              </div>
              
              {/* Pending Actions with enhanced styling */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-secondary-100 h-full overflow-hidden">
                  <div className="px-5 py-4 border-b border-secondary-100 flex items-center justify-between">
                    <h2 className="font-semibold text-secondary-900">Pending Actions</h2>
                    <span className="text-xs text-secondary-500 bg-secondary-50 px-2 py-1 rounded-full">
                      Needs attention
                    </span>
                  </div>
                  <div className="p-1">
                    <PendingActions />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </DashboardLayout>
    </>
  );
}
