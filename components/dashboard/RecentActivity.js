import React from 'react';
import Link from 'next/link';
import { formatDate } from '@/utils/dateUtils';
import useStore from '@/lib/hooks/useStore';
import Card from '@/components/ui/Card';
import { ClockIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function RecentActivity() {
  const { getRecentActivity, getClientById, getShowById } = useStore();
  const recentActivity = getRecentActivity();

  const getActivityText = (activity) => {
    const client = getClientById(activity.client);
    const show = getShowById(activity.show);
    
    return {
      title: `New booking for ${client?.name || 'Unknown Client'}`,
      description: `${show?.name || 'Unknown Show'} - ${Array.isArray(activity.dates) ? activity.dates.length : Array.isArray(activity.datesNeeded) ? activity.datesNeeded.filter(d => (d.staffCount || 0) > 0).length : 0} day(s)`,
      date: formatDate(activity.createdAt),
      href: `/bookings/${activity.id}`
    };
  };

  return (
    <Card 
      title="Recent Activity" 
      className="h-full"
      actions={null}
    >
      <div className="space-y-4">
        {recentActivity.length > 0 ? (
          recentActivity.map((activity) => {
            const details = getActivityText(activity);
            return (
              <div key={activity.id} className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <ClockIcon className="h-5 w-5 text-secondary-500" />
                </div>
                <div className="ml-3 w-full">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-secondary-900">
                      {details.title}
                    </p>
                    <span className="text-xs text-secondary-500">{details.date}</span>
                  </div>
                  <Link href={details.href} className="block text-sm text-secondary-600 hover:text-primary-600">
                    {details.description}
                  </Link>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-secondary-500 text-sm">No recent activity</p>
        )}
      </div>
    </Card>
  );
} 