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
        <div className="space-y-8 px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-secondary-900">Dashboard</h1>
            <div className="text-sm text-secondary-500">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          
          {/* Quick Stats with shadow and rounded corners */}
          <div className="bg-white rounded-xl shadow-sm border border-secondary-100 overflow-hidden">
            <QuickStats />
          </div>
          
          {/* Main dashboard content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity with enhanced styling */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-secondary-100 h-full overflow-hidden">
                <div className="p-5 border-b border-secondary-100">
                  <h2 className="text-lg font-semibold text-secondary-900">Recent Activity</h2>
                </div>
                <div className="p-1">
                  <RecentActivity />
                </div>
              </div>
            </div>
            
            {/* Upcoming Shows with enhanced styling */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-secondary-100 h-full overflow-hidden">
                <div className="p-5 border-b border-secondary-100">
                  <h2 className="text-lg font-semibold text-secondary-900">Upcoming Shows</h2>
                </div>
                <div className="p-1">
                  <UpcomingShows />
                </div>
              </div>
            </div>
            
            {/* Pending Actions with enhanced styling */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-secondary-100 h-full overflow-hidden">
                <div className="p-5 border-b border-secondary-100">
                  <h2 className="text-lg font-semibold text-secondary-900">Pending Actions</h2>
                </div>
                <div className="p-1">
                  <PendingActions />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
