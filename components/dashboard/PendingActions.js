import React from 'react';
import Link from 'next/link';
import { formatDate } from '@/utils/dateUtils';
import useStore from '@/lib/hooks/useStore';
import Card from '@/components/ui/Card';
import { ArrowRightIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function PendingActions() {
  const { getPendingBookings, getClientById, getShowById } = useStore();
  const pendingBookings = getPendingBookings();

  return (
    <Card 
      title="Pending Actions" 
      className="h-full"
      actions={
        <Link href="/bookings?status=pending_assignment" className="text-sm text-primary-600 hover:text-primary-800 flex items-center">
          View all
          <ArrowRightIcon className="ml-1 h-4 w-4" />
        </Link>
      }
    >
      <div className="space-y-4">
        {pendingBookings.length > 0 ? (
          <div className="divide-y divide-secondary-200">
            {pendingBookings.map((booking) => {
              const client = getClientById(booking.client);
              const show = getShowById(booking.show);
              
              // Calculate how many staff members still need to be assigned
              const staffNeeded = {};
              let totalNeeded = 0;
              
              for (const date in booking.staffRequirements) {
                const required = booking.staffRequirements[date].count;
                const assigned = booking.assignedStaff[date]?.length || 0;
                const needed = required - assigned;
                
                if (needed > 0) {
                  staffNeeded[date] = needed;
                  totalNeeded += needed;
                }
              }
              
              return (
                <div key={booking.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      <ExclamationCircleIcon 
                        className={`h-5 w-5 ${
                          booking.status === 'pending_assignment' 
                            ? 'text-warning-500' 
                            : 'text-primary-500'
                        }`} 
                      />
                    </div>
                    <div className="ml-3 w-full">
                      <div className="flex justify-between">
                        <Link 
                          href={`/bookings/${booking.id}`}
                          className="text-sm font-medium text-secondary-900 hover:text-primary-600"
                        >
                          {show?.name} - {client?.name}
                        </Link>
                        <span className="text-xs text-secondary-500">
                          {formatDate(
                            Array.isArray(booking.dates) && booking.dates.length > 0
                              ? booking.dates[0]
                              : Array.isArray(booking.datesNeeded) && booking.datesNeeded.length > 0
                                ? booking.datesNeeded[0].date
                                : ''
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-secondary-600">
                        Need {totalNeeded} more staff member{totalNeeded !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-secondary-500 text-sm">No pending actions</p>
        )}
      </div>
    </Card>
  );
} 