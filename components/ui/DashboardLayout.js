import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import classNames from 'classnames';
import { 
  HomeIcon, 
  UserGroupIcon, 
  BuildingOffice2Icon, 
  CalendarIcon, 
  ClipboardDocumentListIcon, 
  Bars3Icon,
  XMarkIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import DateHeader from '../dashboard/DateHeader';
import adminLogger from '@/lib/utils/adminLogger';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, shortName: 'Home' },
  // { name: 'Activity', href: '/activity', icon: ChatBubbleLeftRightIcon, shortName: 'Activity' },
  { name: 'Staff', href: '/staff', icon: UserGroupIcon, shortName: 'Staff' },
  { name: 'Clients', href: '/clients', icon: BuildingOffice2Icon, shortName: 'Clients' },
  { name: 'Shows', href: '/shows', icon: CalendarIcon, shortName: 'Shows' },
  { name: 'Bookings', href: '/bookings', icon: ClipboardDocumentListIcon, shortName: 'Bookings' },
];

export default function DashboardLayout({ children, onLogout }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Close sidebar when navigation happens
  useEffect(() => {
    const handleRouteChange = () => {
      setSidebarOpen(false);
    };

    router.events.on('routeChangeStart', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-secondary-50 to-white">
      {/* Mobile sidebar */}
      <div 
        className={classNames(
          "fixed inset-0 z-40 flex md:hidden transition-all duration-300",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )} 
        role="dialog" 
        aria-modal="true"
      >
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-secondary-900 bg-opacity-60 backdrop-blur-sm transition-opacity ease-out duration-300" 
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        ></div>
        
        {/* Sidebar */}
        <div 
          className={classNames(
            "relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl transition ease-out duration-300 transform",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm focus:outline-none transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-primary-600">The Smith Agency</h1>
            </div>
            <nav className="mt-6 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    router.pathname === item.href
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                      : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 border-l-4 border-transparent',
                    'group flex items-center px-2 py-2.5 text-base font-medium rounded-md transition-all duration-200'
                  )}
                  aria-current={router.pathname === item.href ? 'page' : undefined}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={classNames(
                      router.pathname === item.href
                        ? 'text-primary-600'
                        : 'text-secondary-400 group-hover:text-secondary-600',
                      'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Footer in mobile sidebar */}
          <div className="flex-shrink-0 flex flex-col border-t border-secondary-100 p-4">
            {/* TSA Image and DateHeader at bottom */}
            <div className="flex flex-col items-center mb-4">
              <a href="https://www.smithagency.app/" target="_blank" rel="noopener noreferrer">
                <img
                  src="/tsa.jpeg"
                  alt="The Smith Agency Logo"
                  className="w-32 h-32 object-cover rounded-full shadow-lg border-4 border-pink-500 transition-transform duration-300 hover:scale-105 mb-3"
                  style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #e0e7ff 100%)' }}
                />
              </a>
              <div className="w-full">
                <DateHeader sidebar />
              </div>
            </div>
            
            {/* Logout button */}
            {onLogout && (
              <button 
                onClick={onLogout}
                className="mb-2 flex items-center justify-center p-1.5 rounded-md bg-red-50 hover:bg-red-100 transition-colors text-red-600 hover:text-red-700"
                aria-label="Logout"
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-xs font-medium">Logout</span>
              </button>
            )}
            
            {/* Refresh button */}
            <button 
              onClick={() => window.location.reload()}
              className="mb-2 flex items-center justify-center p-1.5 rounded-md bg-secondary-50 hover:bg-secondary-100 transition-colors text-secondary-500 hover:text-secondary-700"
              aria-label="Refresh page"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1.5" />
              <span className="text-xs font-medium">Refresh</span>
            </button>
            
            <p className="text-xs text-secondary-500">
              &copy; {new Date().getFullYear()} The Smith Agency
            </p>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 lg:w-72">
          <div className="flex-1 flex flex-col min-h-0 border-r border-secondary-100 bg-white shadow-sm">
            <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-5 mb-5">
                <h1 className="text-xl lg:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-500">
                  The Smith Agency
                </h1>
              </div>
              <nav className="mt-1 flex-1 px-3 space-y-1.5">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={classNames(
                      router.pathname === item.href
                        ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                        : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 border-l-4 border-transparent',
                      'group flex items-center px-3 py-2.5 text-sm font-medium rounded-r-md transition-all duration-150'
                    )}
                    aria-current={router.pathname === item.href ? 'page' : undefined}
                  >
                    <item.icon
                      className={classNames(
                        router.pathname === item.href
                          ? 'text-primary-600'
                          : 'text-secondary-400 group-hover:text-secondary-600',
                        'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
              {/* TSA Image - Desktop Sidebar */}
              <div className="flex flex-col items-center mt-0 mb-6 px-3">
                <a href="https://www.smithagency.app/" target="_blank" rel="noopener noreferrer">
                  <img
                    src="/tsa.jpeg"
                    alt="The Smith Agency Logo"
                    className="w-52 h-52 object-cover rounded-full shadow-lg border-4 border-pink-500 transition-transform duration-300 hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #e0e7ff 100%)' }}
                  />
                </a>
              </div>
              {/* DateHeader in Sidebar */}
              <div className="w-full px-3 mb-2 mt-4">
                <DateHeader sidebar />
              </div>
            </div>
            
            {/* Footer element on sidebar */}
            <div className="flex-shrink-0 flex flex-col border-t border-secondary-100 p-4">
              {/* Logout button */}
              {onLogout && (
                <button 
                  onClick={onLogout}
                  className="mb-2 flex items-center justify-center p-1.5 rounded-md bg-red-50 hover:bg-red-100 transition-colors text-red-600 hover:text-red-700"
                  aria-label="Logout"
                >
                  <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-xs font-medium">Logout</span>
                </button>
              )}
              
              {/* Refresh button */}
              <button 
                onClick={() => window.location.reload()}
                className="mb-2 flex items-center justify-center p-1.5 rounded-md bg-secondary-50 hover:bg-secondary-100 transition-colors text-secondary-500 hover:text-secondary-700"
                aria-label="Refresh page"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                <span className="text-xs font-medium">Refresh</span>
              </button>
              
              <p className="text-xs text-secondary-500">
                &copy; {new Date().getFullYear()} The Smith Agency
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="sticky top-0 z-50 flex-shrink-0 flex h-14 sm:h-16 bg-white bg-opacity-90 backdrop-filter backdrop-blur-sm shadow-sm">
          <button
            type="button"
            className="px-3 sm:px-4 border-r border-secondary-100 text-secondary-500 focus:outline-none md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 px-3 sm:px-4 flex justify-between items-center">
            <div className="text-lg sm:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-500 md:hidden">
              The Smith Agency
            </div>
            
            {/* Mobile navigation - optional bottom tabs for frequently used sections */}
            <div className="md:hidden flex">
              {/* Additional mobile actions could go here */}
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-4 sm:py-6">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>

      </div>
    </div>
  );
} 