import React, { useState, useMemo, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/ui/DashboardLayout';
import useStore from '@/lib/hooks/useStore';
import dynamic from 'next/dynamic';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ChevronRightIcon,
  SparklesIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const ChatInterface = dynamic(() => import('@/components/chat/ChatInterface'), { ssr: false });

export default function Dashboard() {
  const router = useRouter();
  const [showChat, setShowChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');
  const [readItems, setReadItems] = useState(new Set());
  const searchRef = useRef(null);
  const { staff, clients, bookings, shows } = useStore();

  // Load read items from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('tsa-read-activity');
    if (stored) {
      try {
        setReadItems(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error('Error loading read items:', e);
      }
    }
  }, []);

  // Save read items to localStorage when they change
  useEffect(() => {
    if (readItems.size > 0) {
      localStorage.setItem('tsa-read-activity', JSON.stringify([...readItems]));
    }
  }, [readItems]);

  const markAsRead = (itemKey) => {
    setReadItems(prev => new Set([...prev, itemKey]));
  };

  const markAllAsRead = () => {
    const allKeys = filteredActivity.map(item => `${item.type}-${item.id}`);
    setReadItems(prev => new Set([...prev, ...allKeys]));
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleDateString('en-US', { month: 'short' });
  const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });

  // Calculate stats
  const bookingsArray = Array.isArray(bookings) ? bookings : [];
  const totalStaffDays = bookingsArray.reduce((total, booking) => {
    if (booking.status !== 'cancelled' && Array.isArray(booking.datesNeeded)) {
      return total + booking.datesNeeded.reduce((sum, d) => sum + (d.staffCount || 0), 0);
    }
    return total;
  }, 0);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    const results = [];

    // Search staff
    staff?.forEach(s => {
      const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim();
      if (name.toLowerCase().includes(query) || s.email?.toLowerCase().includes(query)) {
        results.push({
          type: 'staff',
          id: s.id,
          title: name,
          subtitle: s.email || s.location || '',
          href: `/staff/${s.id}`,
        });
      }
    });

    // Search clients
    clients?.forEach(c => {
      if (c.name?.toLowerCase().includes(query) || c.email?.toLowerCase().includes(query)) {
        results.push({
          type: 'client',
          id: c.id,
          title: c.name,
          subtitle: c.location || c.email || '',
          href: `/clients/${c.id}`,
        });
      }
    });

    // Search bookings
    bookingsArray.forEach(b => {
      const show = shows?.find(s => s.id === b.showId);
      const client = clients?.find(c => c.id === b.clientId);
      if (show?.name?.toLowerCase().includes(query) || client?.name?.toLowerCase().includes(query)) {
        results.push({
          type: 'booking',
          id: b.id,
          title: client?.name || 'Unknown Client',
          subtitle: show?.name || 'Unknown Show',
          href: `/bookings/${b.id}`,
        });
      }
    });

    return results.slice(0, 8);
  }, [searchQuery, staff, clients, bookingsArray, shows]);

  // Upcoming shows (next 30 days)
  const upcomingShows = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return shows
      ?.filter(show => {
        if (!show.startDate) return false;
        const startDate = new Date(show.startDate);
        return startDate >= now && startDate <= thirtyDaysFromNow;
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 5) || [];
  }, [shows]);

  // Recent activity
  const recentActivity = useMemo(() => {
    const items = [];
    
    bookingsArray.forEach(b => {
      if (b?.createdAt) {
        const show = shows?.find(s => s.id === b.showId);
        const client = clients?.find(c => c.id === b.clientId);
        items.push({
          type: 'booking',
          id: b.id,
          title: show?.name || 'Unknown Show',
          subtitle: client?.name || 'Unknown Client',
          time: b.createdAt,
          href: `/bookings/${b.id}`,
        });
      }
    });

    staff?.forEach(s => {
      if (s?.createdAt) {
        const location = s.city || s.location || '';
        const college = s.college || '';
        const subtext = [college, location].filter(Boolean).join(' · ') || 'New staff';
        items.push({
          type: 'staff',
          id: s.id,
          title: subtext,
          subtitle: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
          image: s.image || s.photoURL || s.photoUrl || s.picture || null,
          time: s.createdAt,
          href: `/staff/${s.id}`,
        });
      }
    });

    const toTime = val => {
      if (!val) return 0;
      if (typeof val === 'string') return new Date(val).getTime();
      if (val?.seconds) return val.seconds * 1000;
      return 0;
    };

    return items.sort((a, b) => toTime(b.time) - toTime(a.time)).slice(0, 50);
  }, [bookingsArray, staff, shows, clients]);

  const filteredActivity = useMemo(() => {
    if (activityFilter === 'all') return recentActivity;
    return recentActivity.filter(item => item.type === activityFilter);
  }, [recentActivity, activityFilter]);

  const formatRelative = val => {
    try {
      let ms = 0;
      if (!val) return '';
      if (typeof val === 'string') ms = new Date(val).getTime();
      else if (val?.seconds) ms = val.seconds * 1000;
      else return '';
      const diff = Math.max(0, Date.now() - ms);
      const m = Math.floor(diff / 60000);
      if (m < 60) return `${m}m`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h`;
      const d = Math.floor(h / 24);
      return `${d}d`;
    } catch {
      return '';
    }
  };

  const stats = [
    { label: 'Staff', value: staff?.length || 0, icon: UserGroupIcon, href: '/staff' },
    { label: 'Clients', value: clients?.length || 0, icon: BuildingOffice2Icon, href: '/clients' },
    { label: 'Bookings', value: bookingsArray.length, icon: ClipboardDocumentListIcon, href: '/bookings' },
    { label: 'Days', value: totalStaffDays, icon: CalendarDaysIcon, href: '/bookings' },
  ];

  return (
    <>
      <Head>
        <title>Dashboard | The Smith Agency</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-pink-50">
          <div className="max-w-5xl mx-auto px-4 py-6">
            {/* Hero Header */}
            <div className="relative mb-8">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
                    <span className="text-primary-500">The</span>
                    <span className="text-secondary-900"> Smith Agency</span>
                  </h1>
                  <p className="text-secondary-500 mt-1 font-medium">Premier Boutique Staffing</p>
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-5xl font-black text-primary-500">{day}</div>
                  <div className="text-sm font-semibold text-secondary-600">{month} · {weekday}</div>
                </div>
              </div>
              <div className="h-1 w-24 bg-gradient-to-r from-primary-500 to-pink-400 rounded-full mt-4"></div>
            </div>

            {/* Search */}
            <div className="relative mb-8" ref={searchRef}>
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 z-10" />
              <input
                type="text"
                placeholder="Search staff, clients, bookings..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="w-full pl-12 pr-10 py-4 bg-white border-2 border-secondary-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 shadow-sm hover:shadow-md transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-secondary-200 rounded-xl shadow-xl overflow-hidden z-50">
                  {searchResults.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.map(result => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => {
                            router.push(result.href);
                            setSearchQuery('');
                            setShowSearchResults(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 transition-colors text-left border-b border-secondary-100 last:border-b-0"
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            result.type === 'staff' ? 'bg-primary-100' :
                            result.type === 'client' ? 'bg-blue-100' :
                            'bg-violet-100'
                          }`}>
                            {result.type === 'staff' && <UserGroupIcon className="w-4 h-4 text-primary-600" />}
                            {result.type === 'client' && <BuildingOffice2Icon className="w-4 h-4 text-blue-600" />}
                            {result.type === 'booking' && <ClipboardDocumentListIcon className="w-4 h-4 text-violet-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-secondary-900 truncate">{result.title}</p>
                            <p className="text-xs text-secondary-500 truncate">{result.subtitle}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            result.type === 'staff' ? 'bg-primary-100 text-primary-600' :
                            result.type === 'client' ? 'bg-blue-100 text-blue-600' :
                            'bg-violet-100 text-violet-600'
                          }`}>
                            {result.type === 'staff' ? 'Staff' : result.type === 'client' ? 'Client' : 'Booking'}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-secondary-500">No results for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              {stats.map((stat, i) => (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className={`relative overflow-hidden rounded-2xl p-4 transition-all hover:scale-105 hover:shadow-xl group ${
                    i === 0 ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white' :
                    i === 1 ? 'bg-gradient-to-br from-secondary-800 to-secondary-900 text-white' :
                    i === 2 ? 'bg-gradient-to-br from-pink-400 to-primary-500 text-white' :
                    'bg-white border-2 border-secondary-200 text-secondary-900'
                  }`}
                >
                  <stat.icon className={`w-6 h-6 mb-2 ${i === 3 ? 'text-primary-500' : 'text-white/80'}`} />
                  <div className="text-3xl font-black">{stat.value}</div>
                  <div className={`text-xs font-semibold ${i === 3 ? 'text-secondary-500' : 'text-white/70'}`}>{stat.label}</div>
                  <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-500"></div>
                </Link>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Upcoming Shows - Wider */}
              <div className="lg:col-span-3 bg-white rounded-2xl border-2 border-secondary-200 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-secondary-100 bg-gradient-to-r from-primary-500 to-pink-500">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <CalendarDaysIcon className="w-5 h-5" />
                      Upcoming Shows
                    </h2>
                    <Link href="/shows" className="text-xs text-white/80 hover:text-white font-medium">View all →</Link>
                  </div>
                </div>
                {upcomingShows.length > 0 ? (
                  <div className="divide-y divide-secondary-100">
                    {upcomingShows.map(show => {
                      const startDate = new Date(show.startDate);
                      const endDate = show.endDate ? new Date(show.endDate) : null;
                      const daysUntil = Math.ceil((startDate - new Date()) / (1000 * 60 * 60 * 24));
                      return (
                        <Link
                          key={show.id}
                          href={`/shows/${show.id}`}
                          className="flex items-center justify-between px-5 py-4 hover:bg-primary-50/50 transition-colors group"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-secondary-900 truncate group-hover:text-primary-600 transition-colors">{show.name}</p>
                            <p className="text-xs text-secondary-500 font-medium">
                              {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {endDate && ` – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                              daysUntil <= 7 ? 'bg-primary-500 text-white' : 'bg-secondary-100 text-secondary-600'
                            }`}>
                              {daysUntil}d
                            </span>
                            <ChevronRightIcon className="w-4 h-4 text-secondary-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-3">
                      <CalendarDaysIcon className="w-8 h-8 text-primary-400" />
                    </div>
                    <p className="text-sm font-medium text-secondary-500">No upcoming shows</p>
                  </div>
                )}
              </div>

              {/* Recent Activity - Narrower */}
              <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-secondary-200 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-secondary-100 bg-secondary-900">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <ClockIcon className="w-5 h-5" />
                      Activity
                      {filteredActivity.filter(i => !readItems.has(`${i.type}-${i.id}`)).length > 0 && (
                        <span className="bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {filteredActivity.filter(i => !readItems.has(`${i.type}-${i.id}`)).length}
                        </span>
                      )}
                    </h2>
                    {filteredActivity.some(i => !readItems.has(`${i.type}-${i.id}`)) && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] font-semibold text-white/70 hover:text-white transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>
                {/* Filters */}
                <div className="px-3 py-2 border-b border-secondary-100 bg-secondary-50 flex gap-1 overflow-x-auto">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'booking', label: 'Bookings' },
                    { key: 'staff', label: 'Staff' },
                    { key: 'client', label: 'Clients' },
                  ].map(filter => (
                    <button
                      key={filter.key}
                      onClick={() => setActivityFilter(filter.key)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors whitespace-nowrap ${
                        activityFilter === filter.key
                          ? 'bg-primary-500 text-white'
                          : 'bg-white text-secondary-600 hover:bg-secondary-100 border border-secondary-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                {filteredActivity.length > 0 ? (
                  <div className="divide-y divide-secondary-100 max-h-[400px] overflow-y-auto">
                    {filteredActivity.map(item => {
                      const itemKey = `${item.type}-${item.id}`;
                      const isUnread = !readItems.has(itemKey);
                      return (
                        <div
                          key={itemKey}
                          className={`flex items-center gap-3 px-5 py-3 hover:bg-secondary-50 transition-colors group ${isUnread ? 'bg-primary-50/30' : ''}`}
                        >
                          {/* Unread indicator */}
                          <div className="w-2 flex-shrink-0">
                            {isUnread && (
                              <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                            )}
                          </div>
                          <Link href={item.href} className="flex items-center gap-3 flex-1 min-w-0">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.subtitle}
                                className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                item.type === 'booking' ? 'bg-gradient-to-br from-pink-400 to-primary-500' : 
                                item.type === 'staff' ? 'bg-gradient-to-br from-primary-500 to-primary-600' : 
                                'bg-gradient-to-br from-secondary-700 to-secondary-800'
                              }`}>
                                {item.type === 'booking' && <ClipboardDocumentListIcon className="w-4 h-4 text-white" />}
                                {item.type === 'staff' && <UserGroupIcon className="w-4 h-4 text-white" />}
                                {item.type === 'client' && <BuildingOffice2Icon className="w-4 h-4 text-white" />}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-secondary-900 truncate">{item.subtitle}</p>
                              <p className="text-[10px] text-secondary-400 font-medium truncate">{item.title}</p>
                            </div>
                          </Link>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-bold text-secondary-400">{formatRelative(item.time)}</span>
                            {isUnread && (
                              <button
                                onClick={() => markAsRead(itemKey)}
                                className="text-[10px] text-secondary-400 hover:text-primary-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ✓
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <ClockIcon className="w-8 h-8 text-secondary-300 mx-auto mb-2" />
                    <p className="text-sm text-secondary-500">No {activityFilter === 'all' ? 'activity' : activityFilter} activity</p>
                  </div>
                )}
              </div>
            </div>

            <div className="h-20"></div>
          </div>
        </div>
      </DashboardLayout>

      {/* Chat FAB */}
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white rounded-full shadow-lg shadow-primary-500/30 flex items-center justify-center transition-all hover:scale-110"
      >
        <SparklesIcon className="w-6 h-6" />
      </button>

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowChat(false)} />
          <div className="absolute bottom-20 right-6">
            <div className="relative">
              <button
                onClick={() => setShowChat(false)}
                className="absolute -top-3 -right-3 w-8 h-8 bg-secondary-900 text-white rounded-full text-sm shadow-lg flex items-center justify-center hover:bg-secondary-800"
              >
                ×
              </button>
              <ChatInterface />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
