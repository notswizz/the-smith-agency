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
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, shortName: 'Home' },
  { name: 'Staff', href: '/staff', icon: UserGroupIcon, shortName: 'Staff' },
  { name: 'Clients', href: '/clients', icon: BuildingOffice2Icon, shortName: 'Clients' },
  { name: 'Shows', href: '/shows', icon: CalendarIcon, shortName: 'Shows' },
  { name: 'Bookings', href: '/bookings', icon: ClipboardDocumentListIcon, shortName: 'Bookings' },
];

export default function DashboardLayout({ children }) {
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
            </div>
            
            {/* Footer element on sidebar */}
            <div className="flex-shrink-0 flex flex-col border-t border-secondary-100 p-4">
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
        
        {/* Bottom mobile navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-secondary-100 shadow-lg">
          <div className="grid grid-cols-4 h-16">
            {/* Include Home, Staff, Clients, Bookings */}
            {navigation
              .filter(item => 
                item.href === '/' || 
                item.href === '/staff' || 
                item.href === '/clients' || 
                item.href === '/bookings'
              )
              .map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    'flex flex-col items-center justify-center py-1',
                    router.pathname === item.href
                      ? 'text-primary-600'
                      : 'text-secondary-500 hover:text-secondary-900'
                  )}
                >
                  <item.icon
                    className={classNames(
                      'h-5 w-5 mb-1',
                      router.pathname === item.href
                        ? 'text-primary-600'
                        : 'text-secondary-400'
                    )}
                  />
                  <span className="text-xs font-medium">{item.shortName}</span>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
} 