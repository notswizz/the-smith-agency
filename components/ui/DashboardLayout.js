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
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Staff', href: '/staff', icon: UserGroupIcon },
  { name: 'Clients', href: '/clients', icon: BuildingOffice2Icon },
  { name: 'Shows', href: '/shows', icon: CalendarIcon },
  { name: 'Bookings', href: '/bookings', icon: ClipboardDocumentListIcon },
];

export default function DashboardLayout({ children, onLogout }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState('');
  
  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleDateString('en-US', { month: 'short' });
  const weekday = today.toLocaleDateString('en-US', { weekday: 'short' });
  
  useEffect(() => {
    const handleRouteChange = () => setSidebarOpen(false);
    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [router]);

  // Get admin name from session
  useEffect(() => {
    try {
      const session = localStorage.getItem('tsa_admin_session');
      if (session) {
        const data = JSON.parse(session);
        setAdminName(data.adminName || '');
      }
    } catch (e) {}
  }, []);

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 pb-4">
        <Link href="/" className="block">
          <p className="text-xs text-primary-500 font-semibold">The</p>
          <h1 className="text-xl font-black text-secondary-900 -mt-1">Smith Agency</h1>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href || 
              (item.href !== '/' && router.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={mobile ? () => setSidebarOpen(false) : undefined}
                className={classNames(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                    : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                )}
              >
                <item.icon className={classNames('w-5 h-5', isActive ? 'text-white' : 'text-secondary-400 group-hover:text-secondary-600')} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Logo */}
      <div className="flex-1 flex flex-col items-center justify-center px-3">
        <a href="https://www.smithagency.app/" target="_blank" rel="noopener noreferrer">
          <img
            src="/tsa.jpeg"
            alt="The Smith Agency"
            className="w-48 h-48 object-cover rounded-full border-4 border-primary-500 shadow-lg hover:scale-105 transition-transform"
          />
        </a>
      </div>
      
      {/* Date Card */}
      <div className="px-3 mb-2">
        <div className="bg-secondary-100 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-secondary-400" />
            <p className="text-sm text-secondary-600">
              <span className="font-semibold">{month} {day}</span>
              <span className="text-secondary-400"> · {weekday}</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Active User */}
      {adminName && (
        <div className="px-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span className="text-xs text-secondary-500">{adminName}</span>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="p-3 border-t border-secondary-100">
        <button 
          onClick={() => window.location.reload()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-secondary-50 hover:bg-secondary-100 text-secondary-500 hover:text-secondary-700 transition-colors text-sm"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Refresh
        </button>
        <p className="text-[10px] text-secondary-400 text-center mt-3">
          © {new Date().getFullYear()} The Smith Agency
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-secondary-50 to-white">
      {/* Mobile sidebar */}
      <div 
        className={classNames(
          "fixed inset-0 z-40 flex md:hidden transition-all duration-300",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )} 
      >
        <div 
          className="fixed inset-0 bg-secondary-900/60 backdrop-blur-sm" 
          onClick={() => setSidebarOpen(false)}
        />
        <div 
          className={classNames(
            "relative flex flex-col w-72 bg-white shadow-2xl transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary-100 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <XMarkIcon className="w-5 h-5 text-secondary-500" />
          </button>
          <SidebarContent mobile />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="w-64 bg-white border-r border-secondary-100">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex items-center h-14 bg-white/95 backdrop-blur-sm border-b border-secondary-100 px-4 md:hidden">
          <button
            className="p-2 -ml-2 rounded-lg hover:bg-secondary-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="w-5 h-5 text-secondary-600" />
          </button>
          <div className="ml-3">
            <span className="text-lg font-bold">
              <span className="text-primary-500">The</span>
              <span className="text-secondary-900"> Smith Agency</span>
            </span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
