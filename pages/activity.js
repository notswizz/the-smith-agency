import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Card from '@/components/ui/Card';
import Board from '@/components/board/Board';
import useStore from '@/lib/hooks/useStore';
import { BookOpenIcon, UserPlusIcon, BuildingOffice2Icon, CalendarIcon } from '@heroicons/react/24/outline';

export default function ActivityPage() {
  const [tab, setTab] = useState('feed'); // 'board' | 'feed'
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'booking' | 'staff' | 'client' | 'availability'
  const { bookings, staff, clients, shows, availability } = useStore();

  const getShowName = (showId) => {
    if (!showId || !shows || !Array.isArray(shows)) return 'Unknown Show';
    const show = shows.find((s) => s.id === showId);
    return show ? show.name : 'Unknown Show';
  };

  const feedItems = useMemo(() => {
    const items = [];

    const bookingsArray = Array.isArray(bookings) ? bookings : bookings?.items || [];
    bookingsArray.forEach((b) => {
      if (!b || !b.createdAt) return;
      items.push({
        type: 'booking',
        id: b.id,
        createdAt: b.createdAt,
        title: 'New booking created',
        subtitle: `${getShowName(b.showId)}`,
        href: `/bookings/${b.id}`,
      });
    });

    (Array.isArray(staff) ? staff : []).forEach((s) => {
      if (!s || !s.createdAt) return;
      const displayName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Staff Member';
      items.push({
        type: 'staff',
        id: s.id,
        createdAt: s.createdAt,
        title: 'New staff signup',
        subtitle: displayName,
        href: `/staff/${s.id}`,
      });
    });

    (Array.isArray(clients) ? clients : []).forEach((c) => {
      if (!c || !c.createdAt) return;
      items.push({
        type: 'client',
        id: c.id,
        createdAt: c.createdAt,
        title: 'New client signup',
        subtitle: c.name || 'Client',
        href: `/clients/${c.id}`,
      });
    });

    // Staff availability events
    (Array.isArray(availability) ? availability : []).forEach((a) => {
      if (!a) return;
      const when = a.updatedAt || a.createdAt;
      if (!when) return;
      const datesCount = Array.isArray(a.availableDates) ? a.availableDates.length : 0;
      const show = getShowName(a.showId);
      const title = a.createdAt && a.updatedAt && a.createdAt !== a.updatedAt
        ? 'Availability updated'
        : (a.createdAt ? 'Availability added' : 'Availability updated');
      items.push({
        type: 'availability',
        id: a.id,
        createdAt: when,
        title,
        subtitle: `${a.staffName || 'Staff'} for ${show}${datesCount ? ` • ${datesCount} date${datesCount === 1 ? '' : 's'}` : ''}`,
        href: `/shows/${a.showId}`,
      });
    });

    const toTime = (val) => {
      if (!val) return 0;
      if (typeof val === 'string') return new Date(val).getTime();
      if (val?.seconds) return val.seconds * 1000;
      try { return new Date(val).getTime(); } catch { return 0; }
    };

    return items.sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt)).slice(0, 100);
  }, [bookings, staff, clients, shows, availability]);

  const formatTime = (val) => {
    try {
      if (!val) return '';
      if (typeof val === 'string') return new Date(val).toLocaleString();
      if (val?.toDate) return val.toDate().toLocaleString();
      if (val?.seconds) return new Date(val.seconds * 1000).toLocaleString();
      return new Date(val).toLocaleString();
    } catch {
      return '';
    }
  };

  const formatRelative = (val) => {
    try {
      let ms = 0;
      if (!val) return '';
      if (typeof val === 'string') ms = new Date(val).getTime();
      else if (val?.toDate) ms = val.toDate().getTime();
      else if (val?.seconds) ms = val.seconds * 1000;
      else ms = new Date(val).getTime();
      const diff = Math.max(0, Date.now() - ms);
      const s = Math.floor(diff / 1000);
      if (s < 60) return 'Just now';
      const m = Math.floor(s / 60);
      if (m < 60) return `${m}m ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h}h ago`;
      const d = Math.floor(h / 24);
      return `${d}d ago`;
    } catch {
      return '';
    }
  };

  const TypeIcon = ({ type }) => {
    switch (type) {
      case 'booking':
        return <BookOpenIcon className="h-5 w-5 text-primary-600" />;
      case 'staff':
        return <UserPlusIcon className="h-5 w-5 text-emerald-600" />;
      case 'client':
        return <BuildingOffice2Icon className="h-5 w-5 text-indigo-600" />;
      case 'availability':
        return <CalendarIcon className="h-5 w-5 text-violet-600" />;
      default:
        return <CalendarIcon className="h-5 w-5 text-secondary-600" />;
    }
  };

  const filteredFeedItems = useMemo(() => {
    if (feedFilter === 'all') return feedItems;
    return feedItems.filter((i) => i.type === feedFilter);
  }, [feedItems, feedFilter]);

  return (
    <>
      <Head>
        <title>Activity | The Smith Agency</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto px-3 sm:px-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Activity</h1>
            <div className="inline-flex rounded-lg border border-secondary-200 bg-white p-0.5">
              <button onClick={() => setTab('board')} className={`px-3 py-1.5 text-sm rounded-md ${tab === 'board' ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'}`}>Board</button>
              <button onClick={() => setTab('feed')} className={`px-3 py-1.5 text-sm rounded-md ${tab === 'feed' ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'}`}>Feed</button>
            </div>
          </div>

          {tab === 'board' ? (
            <Board />
          ) : (
            <Card noPadding>
              {feedItems.length === 0 ? (
                <div className="p-6 text-center text-secondary-600">No recent activity</div>
              ) : (
                <div className="max-h-[70vh] overflow-y-auto p-4">
                  <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-white/95 backdrop-blur border-b border-secondary-100">
                    <div className="inline-flex rounded-lg border border-secondary-200 bg-white p-0.5">
                      {[
                        { key: 'all', label: 'All' },
                        { key: 'booking', label: 'Bookings' },
                        { key: 'staff', label: 'Staff' },
                        { key: 'client', label: 'Clients' },
                        { key: 'availability', label: 'Availability' },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setFeedFilter(opt.key)}
                          className={`px-3 py-1.5 text-xs sm:text-sm rounded-md ${feedFilter === opt.key ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {filteredFeedItems.map((item) => (
                      <li key={`${item.type}-${item.id}`} className="">
                        <Link href={item.href} className="flex items-center gap-3 rounded-xl border border-secondary-100 bg-white px-4 py-3 hover:border-secondary-200 hover:shadow-sm transition-all group">
                          <div className="h-9 w-9 rounded-lg grid place-items-center bg-secondary-50 border border-secondary-200 group-hover:scale-105 transition-transform">
                            <TypeIcon type={item.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-secondary-900 group-hover:text-primary-700 transition-colors">{item.title}</p>
                            <p className="text-xs text-secondary-600 truncate">{item.subtitle}</p>
                          </div>
                          <div className="flex flex-col items-end ml-2">
                            <span className="text-xs font-medium text-secondary-600">{formatRelative(item.createdAt)}</span>
                            <span className="text-[10px] text-secondary-400" title={formatTime(item.createdAt)}>{formatTime(item.createdAt)}</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}


