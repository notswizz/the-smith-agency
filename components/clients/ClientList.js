import React from 'react';
import Link from 'next/link';
import {
  EnvelopeIcon,
  PhoneIcon,
  PencilSquareIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  UserGroupIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ClientList({ clients, view = 'grid' }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 snap-y snap-mandatory overflow-y-auto sm:overflow-visible">
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
  
  // Get the total days booked (calculated in clients page)
  const totalDaysBooked = client.totalDaysBooked || 0;
  
  // Standardized gradient for all client cards
  const standardGradient = 'from-gray-600 to-gray-700';

  return (
    <Link href={`/clients/${client.id}`} className="block snap-start snap-always">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md relative transition-all duration-300 border border-gray-200 h-full hover:translate-y-[-2px]">
        {/* Subtle top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary-500"></div>
        
        {/* Edit button */}
        <div className="absolute top-3 right-3 z-20">
          <Link href={`/clients/${client.id}?edit=true`} onClick={(e) => e.stopPropagation()}>
            <button className="bg-white p-2 rounded-full text-gray-500 hover:text-primary-600 transition-colors shadow-sm border border-gray-200">
              <PencilSquareIcon className="h-4 w-4" />
            </button>
          </Link>
        </div>
        
        {/* Days Booked Badge */}
        <div className="absolute top-3 left-3 z-20">
          {totalDaysBooked > 0 && (
            <div className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded-md flex items-center">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" /> 
              <span>{totalDaysBooked}</span>
            </div>
          )}
        </div>
        
        {/* Card header with standardized gray gradient */}
        <div className={`bg-gradient-to-r ${standardGradient} pt-5 px-6 pb-16 relative`}>
          {/* Subdued decorative elements */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/10 rounded-full -ml-6 -mb-6"></div>
        </div>
        
        <div className="px-6 pb-6 relative z-10">
          {/* Logo/initials circle */}
          <div className="flex flex-col items-center -mt-10 mb-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-2xl font-semibold shadow-md border-4 border-white overflow-hidden">
                {clientLogo ? (
                  <img
                    src={clientLogo}
                    alt={client.name}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-gray-700 to-gray-900">{initials}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Name only */}
          <div className="text-center mb-5">
            <h3 className="text-lg font-bold text-gray-800">
              {client.name}
            </h3>
          </div>
          
          {/* Contact buttons */}
          <div className="flex justify-center space-x-4 mt-4">
            {client.email && (
              <Link 
                href={`mailto:${client.email}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-primary-500 text-white p-3 rounded-full hover:bg-primary-600 transition-colors shadow-sm"
                title={`Email ${client.name}`}
              >
                <EnvelopeIcon className="h-5 w-5" />
              </Link>
            )}
            
            {client.phone && (
              <Link 
                href={`tel:${client.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-500 text-white p-3 rounded-full hover:bg-gray-600 transition-colors shadow-sm"
                title={`Call ${client.name}`}
              >
                <PhoneIcon className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Add ClientTable component
function ClientTable({ clients }) {
  return (
    <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shows</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Booked</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clients.map((client) => (
            <tr key={client.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {client.logoUrl ? (
                    <img 
                      src={client.logoUrl} 
                      alt={client.name} 
                      className="h-10 w-10 rounded-full mr-3"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-sm font-semibold mr-3">
                      {client.name?.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{client.name}</div>
                    {client.industry && (
                      <div className="text-gray-500 text-sm">{client.industry}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {client.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <span>{client.location}</span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm">
                  {client.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <a href={`mailto:${client.email}`} className="hover:text-primary-600">
                        {client.email}
                      </a>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center mt-1 text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <a href={`tel:${client.phone}`} className="hover:text-primary-600">
                        {client.phone}
                      </a>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-600">
                  <UserGroupIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span>
                    {client.shows?.filter(s => s.status === 'active')?.length || 0} active
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="font-medium">
                    {client.totalDaysBooked || 0}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <Link href={`/clients/${client.id}`}>
                    <button className="inline-flex items-center px-2.5 py-1.5 border border-primary-300 shadow-sm text-xs font-medium rounded text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-1 focus:ring-primary-500">
                      View
                    </button>
                  </Link>
                  <Link href={`/clients/${client.id}?edit=true`}>
                    <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500">
                      <PencilSquareIcon className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </button>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 