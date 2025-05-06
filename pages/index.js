import React from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/ui/DashboardLayout';
import DateHeader from '@/components/dashboard/DateHeader';
import KeyStats from '@/components/dashboard/KeyStats';
import QuickActions from '@/components/dashboard/QuickActions';

export default function Dashboard() {
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
          <DateHeader />

          {/* Key Stats */}
          <KeyStats />

          {/* Quick Actions */}
          <QuickActions />
        </div>
      </DashboardLayout>
    </>
  );
}
