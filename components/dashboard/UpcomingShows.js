import React from 'react';
import Link from 'next/link';
import { formatDate } from '@/utils/dateUtils';
import useStore from '@/lib/hooks/useStore';
import Card from '@/components/ui/Card';
import { ArrowRightIcon, CalendarIcon } from '@heroicons/react/24/outline';

export default function UpcomingShows() {
  const { shows, getClientById } = useStore();
  
  // Get shows that start from today onwards, sorted by start date
  const upcomingShows = [...shows]
    .filter(show => {
      const startDate = new Date(show.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return startDate >= today;
    })
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 5);

  return (
    <Card 
      title="Upcoming Shows" 
      className="h-full"
      actions={
        <Link href="/shows" className="text-sm text-primary-600 hover:text-primary-800 flex items-center">
          View all
          <ArrowRightIcon className="ml-1 h-4 w-4" />
        </Link>
      }
    >
      <div className="space-y-4">
        {upcomingShows.length > 0 ? (
          <div className="divide-y divide-secondary-200">
            {upcomingShows.map((show) => {
              const client = getClientById(show.client);
              return (
                <div key={show.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link 
                        href={`/shows/${show.id}`}
                        className="font-medium text-secondary-900 hover:text-primary-600"
                      >
                        {show.name}
                      </Link>
                      <div className="text-sm text-secondary-600">
                        {client?.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-secondary-500">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {formatDate(show.startDate, 'MMM d')}
                        {show.startDate !== show.endDate && (
                          <> - {formatDate(show.endDate, 'MMM d')}</>
                        )}
                      </div>
                      <div className="text-xs text-secondary-500">
                        {show.location}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-secondary-500 text-sm">No upcoming shows</p>
        )}
      </div>
    </Card>
  );
} 