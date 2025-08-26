import React, { useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/ui/DashboardLayout';
import DateHeader from '@/components/dashboard/DateHeader';
import KeyStats from '@/components/dashboard/KeyStats';
import ShowsCalendar from '@/components/dashboard/ShowsCalendar';
import RecentStaffSignups from '@/components/dashboard/RecentStaffSignups';
import RecentBookings from '@/components/dashboard/RecentBookings';
import dynamic from 'next/dynamic';
import { SparklesIcon } from '@heroicons/react/24/outline';

const ChatInterface = dynamic(() => import('@/components/chat/ChatInterface'), { ssr: false });

export default function Dashboard() {
  const [showChat, setShowChat] = useState(false);
  return (
    <>
      <Head>
        <title>Dashboard | The Smith Agency</title>
        <meta name="description" content="The Smith Agency management dashboard - Streamline your bookings, staff, and client relationships" />
        <meta name="keywords" content="dashboard, booking management, staff management, The Smith Agency, TSA" />
        <link rel="icon" href="/favicon.png" />
        
        {/* Open Graph for Dashboard */}
        <meta property="og:title" content="Dashboard | The Smith Agency" />
        <meta property="og:description" content="The Smith Agency management dashboard - Streamline your bookings, staff, and client relationships" />
        <meta property="og:image" content="https://thesmithagency.com/tsa-social.jpeg" />
        <meta property="og:type" content="website" />
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
              <div className="relative bg-white/95 rounded-2xl shadow-xl p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl border border-white/80">
                <div className="absolute inset-x-0 top-0 h-2 bg-black-900"></div>
                <RecentBookings />
              </div>
              
              {/* Recent Staff Signups */}
              <div className="relative bg-white/95 rounded-2xl shadow-xl p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl border border-white/80">
                <div className="absolute inset-x-0 top-0 h-2 bg-black-900"></div>
                <RecentStaffSignups />
              </div>
            </div>
          </div>
          
          {/* Bottom padding to account for mobile navigation */}
          <div className="h-20 md:h-0"></div>
        </div>

        {/* Floating Chat Button - Dashboard only */}
        <button
          type="button"
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-pink-600 hover:bg-pink-700 text-white shadow-lg border border-pink-500/50 w-14 h-14 flex items-center justify-center"
          title="Open Assistant"
          aria-label="Open Assistant"
        >
          <SparklesIcon className="w-7 h-7" />
        </button>

        {showChat && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowChat(false)} />
            <div className="absolute bottom-8 right-8">
              <div className="bg-transparent">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowChat(false)}
                    className="absolute -top-3 -right-3 bg-zinc-900 text-zinc-100 border border-zinc-700 rounded-full w-8 h-8 text-sm shadow"
                    title="Close"
                  >
                    ×
                  </button>
                  <ChatInterface />
                </div>
              </div>
            </div>
          </div>
        )}
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
