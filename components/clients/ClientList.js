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
  
  // Get the total days booked (calculated in clients page)
  const totalDaysBooked = client.totalDaysBooked || 0;
  
  // Generate a unique gradient based on the first letter of the name
  const getGradient = (letter) => {
    const gradients = [
      'from-pink-500 to-purple-600',
      'from-blue-500 to-teal-400',
      'from-green-400 to-emerald-600',
      'from-orange-400 to-pink-500',
      'from-indigo-500 to-blue-400',
      'from-red-500 to-orange-400',
      'from-amber-400 to-yellow-300',
      'from-violet-500 to-purple-500',
      'from-teal-400 to-cyan-400',
      'from-fuchsia-500 to-pink-500',
    ];
    
    // Use character code to generate a consistent index
    const index = letter ? (letter.charCodeAt(0) % gradients.length) : 0;
    return gradients[index];
  };

  const gradient = getGradient(client.name?.charAt(0));

  return (
    <Link href={`/clients/${client.id}`} className="block transform transition-transform duration-300 hover:scale-[1.02]">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl relative transition-all duration-300 border-b-4 border-primary-500">
        {/* Floating edit button */}
        <div className="absolute top-3 right-3 z-10">
          <Link href={`/clients/${client.id}?edit=true`} onClick={(e) => e.stopPropagation()}>
            <button className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-secondary-600 hover:text-primary-600 hover:bg-white transition-colors shadow-sm">
              <PencilSquareIcon className="h-4 w-4" />
            </button>
          </Link>
        </div>
        
        {/* Badges - Shows and Days */}
        <div className="absolute top-3 left-3 z-10 flex space-x-2">
          {activeShowsCount > 0 && (
            <div className="bg-primary-100 text-primary-800 text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center">
              <UserGroupIcon className="h-3.5 w-3.5 mr-1" /> 
              {activeShowsCount}
            </div>
          )}
          
          {totalDaysBooked > 0 && (
            <div className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" /> 
              {totalDaysBooked}
            </div>
          )}
        </div>
        
        {/* Card header with gradient */}
        <div className={`bg-gradient-to-r ${gradient} pt-5 px-6 pb-16 relative`}>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/10 rounded-full -ml-6 -mb-6"></div>
        </div>
        
        <div className="px-6 pb-6 relative">
          {/* Logo/initials circle */}
          <div className="flex flex-col items-center -mt-10 mb-4">
            {clientLogo ? (
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-md border-4 border-white overflow-hidden">
                <img
                  src={clientLogo}
                  alt={client.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-2xl font-semibold shadow-md border-4 border-white">
                <span className={`text-transparent bg-clip-text bg-gradient-to-br ${gradient}`}>{initials}</span>
              </div>
            )}
          </div>
          
          {/* Name and industry */}
          <div className="text-center mb-5">
            <h3 className="text-xl font-bold text-secondary-900">
              {client.name}
            </h3>
            {client.industry && (
              <div className="mt-1 inline-flex items-center px-3 py-1 rounded-full bg-secondary-100 text-secondary-800 text-xs font-medium">
                <BuildingOfficeIcon className="h-3.5 w-3.5 mr-1" />
                {client.industry}
              </div>
            )}
          </div>
          
          {/* Location */}
          {client.location && (
            <div className="flex items-center justify-center text-sm text-secondary-700 mb-4">
              <div className="bg-secondary-50 p-1.5 rounded-full mr-2.5 text-secondary-500">
                <MapPinIcon className="h-4 w-4" />
              </div>
              <span>{client.location}</span>
            </div>
          )}
          
          {/* Contact buttons */}
          <div className="flex justify-center space-x-4 mt-4">
            {client.email && (
              <Link 
                href={`mailto:${client.email}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-primary-500 text-white p-3 rounded-full hover:bg-primary-600 transition-colors shadow-md"
                title={`Email ${client.name}`}
              >
                <EnvelopeIcon className="h-5 w-5" />
              </Link>
            )}
            
            {client.phone && (
              <Link 
                href={`tel:${client.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition-colors shadow-md"
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
    <div className="overflow-x-auto shadow-sm rounded-lg border border-secondary-200">
      <table className="min-w-full divide-y divide-secondary-200">
        <thead className="bg-secondary-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Location</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Contact</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Shows</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Days Booked</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-secondary-200">
          {clients.map((client) => (
            <tr key={client.id} className="hover:bg-secondary-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {client.logoUrl ? (
                    <img 
                      src={client.logoUrl} 
                      alt={client.name} 
                      className="h-10 w-10 rounded-full mr-3"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700 text-sm font-semibold mr-3">
                      {client.name?.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-secondary-900">{client.name}</div>
                    {client.industry && (
                      <div className="text-secondary-500 text-sm">{client.industry}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {client.location && (
                  <div className="flex items-center text-sm text-secondary-700">
                    <MapPinIcon className="h-4 w-4 text-secondary-400 mr-1" />
                    <span>{client.location}</span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm">
                  {client.email && (
                    <div className="flex items-center text-sm text-secondary-700">
                      <EnvelopeIcon className="h-4 w-4 text-secondary-400 mr-1" />
                      <a href={`mailto:${client.email}`} className="hover:text-primary-600">
                        {client.email}
                      </a>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center mt-1 text-sm text-secondary-700">
                      <PhoneIcon className="h-4 w-4 text-secondary-400 mr-1" />
                      <a href={`tel:${client.phone}`} className="hover:text-primary-600">
                        {client.phone}
                      </a>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-secondary-700">
                  <UserGroupIcon className="h-4 w-4 text-secondary-400 mr-1" />
                  <span>
                    {client.shows?.filter(s => s.status === 'active')?.length || 0} active
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-secondary-700">
                  <CalendarIcon className="h-4 w-4 text-secondary-400 mr-1" />
                  <span className="font-medium">
                    {client.totalDaysBooked || 0}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <Link href={`/clients/${client.id}`}>
                    <button className="inline-flex items-center px-2.5 py-1.5 border border-primary-300 shadow-sm text-xs font-medium rounded text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                      View
                    </button>
                  </Link>
                  <Link href={`/clients/${client.id}?edit=true`}>
                    <button className="inline-flex items-center px-2.5 py-1.5 border border-secondary-300 shadow-sm text-xs font-medium rounded text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500">
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