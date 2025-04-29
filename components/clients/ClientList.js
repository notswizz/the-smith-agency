import React from 'react';
import Link from 'next/link';
import {
  EnvelopeIcon,
  PhoneIcon,
  PencilSquareIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ClientList({ clients, view = 'grid' }) {
  return (
    <div className="space-y-6">
      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <ClientTable clients={clients} />
      )}
    </div>
  );
}

function ClientCard({ client }) {
  const router = useRouter();
  const clientLogo = client.logoUrl || null;
  const initials = client.name?.substring(0, 2).toUpperCase() || '??';
  
  // Get the count of active/completed shows for this client
  const activeShowsCount = client.shows?.filter(s => s.status === 'active')?.length || 0;
  
  return (
    <Card className="group transition-all duration-300 hover:shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-secondary-500 to-secondary-700 h-12"></div>
      <div className="px-5 pt-5 pb-5 space-y-5">
        <div className="flex items-start space-x-4">
          <div className="relative -mt-10">
            {clientLogo ? (
              <img
                src={clientLogo}
                alt={client.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-white bg-white p-1"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-secondary-100 flex items-center justify-center border-2 border-white text-secondary-700 text-xl font-semibold">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-secondary-600 transition-colors">
              {client.name}
            </h3>
            {client.industry && (
              <div className="flex items-center mt-1">
                <BuildingOfficeIcon className="h-4 w-4 text-secondary-400 mr-1" />
                <span className="text-sm text-secondary-500">{client.industry}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          {client.location && (
            <div className="flex items-center text-sm text-secondary-700">
              <div className="bg-secondary-50 p-1.5 rounded-full mr-2.5 text-secondary-500">
                <MapPinIcon className="h-4 w-4" />
              </div>
              <span>{client.location}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-secondary-700">
            <div className="bg-secondary-50 p-1.5 rounded-full mr-2.5 text-secondary-500">
              <EnvelopeIcon className="h-4 w-4" />
            </div>
            <a 
              href={`mailto:${client.email}`}
              className="truncate hover:text-secondary-600 transition-colors"
            >
              {client.email}
            </a>
          </div>
          
          {client.phone && (
            <div className="flex items-center text-sm text-secondary-700">
              <div className="bg-secondary-50 p-1.5 rounded-full mr-2.5 text-secondary-500">
                <PhoneIcon className="h-4 w-4" />
              </div>
              <a 
                href={`tel:${client.phone}`}
                className="hover:text-secondary-600 transition-colors"
              >
                {client.phone}
              </a>
            </div>
          )}
          
          <div className="flex items-center text-sm text-secondary-700">
            <div className="bg-secondary-50 p-1.5 rounded-full mr-2.5 text-secondary-500">
              <UserGroupIcon className="h-4 w-4" />
            </div>
            <span>
              {activeShowsCount} active {activeShowsCount === 1 ? 'show' : 'shows'}
            </span>
          </div>
        </div>

        <div className="border-t border-secondary-200 pt-4 flex justify-end">
          <Link href={`/clients/${client.id}/edit`}>
            <Button variant="outline" size="sm" className="flex items-center">
              <PencilSquareIcon className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
} 