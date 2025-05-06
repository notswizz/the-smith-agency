import React from 'react';
import Link from 'next/link';
import { formatDate } from '@/utils/dateUtils';
import { 
  CalendarIcon, 
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  ChevronRightIcon,
  TagIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import useStore from '@/lib/hooks/useStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ShowList({ shows }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shows.map((show) => (
          <ShowCard key={show.id} show={show} />
        ))}
      </div>
    </div>
  );
}

function ShowCard({ show }) {
  const { getClientById } = useStore();
  const client = getClientById(show.client);
  const dateRange = `${formatDate(show.startDate)} - ${formatDate(show.endDate)}`;

  return (
    <Card className="group transition-all duration-300 hover:shadow-md relative overflow-hidden">
      {/* Header accent */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 h-2 w-full"></div>
      
      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
            {show.name}
          </h3>
          {client && (
            <div className="flex items-center text-sm text-secondary-500 mt-1">
              <BuildingOffice2Icon className="h-4 w-4 mr-1 text-secondary-400" />
              <span>{client.name}</span>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center text-sm text-secondary-700">
            <div className="bg-primary-50 p-1.5 rounded-full mr-3 text-primary-500">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <span>{dateRange}</span>
          </div>
          
          {show.location && (
            <div className="flex items-center text-sm text-secondary-700">
              <div className="bg-primary-50 p-1.5 rounded-full mr-3 text-primary-500">
                <MapPinIcon className="h-4 w-4" />
              </div>
              <span>{show.location}</span>
            </div>
          )}
          
          {show.type && (
            <div className="flex items-center text-sm text-secondary-700">
              <div className="bg-primary-50 p-1.5 rounded-full mr-3 text-primary-500">
                <TagIcon className="h-4 w-4" />
              </div>
              <span>{show.type}</span>
            </div>
          )}
        </div>

        <div className="border-t border-secondary-200 pt-4 flex justify-between items-center">
          <Link 
            href={`/shows/${show.id}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center transition-colors"
          >
            View Details
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Link>
          <Link href={`/bookings/new?show=${show.id}`}>
            <Button variant="outline" size="sm" className="flex items-center">
              <ClipboardDocumentListIcon className="h-4 w-4 mr-1" />
              Bookings
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
} 