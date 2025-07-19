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
  const totalDatesBooked = client.totalDatesBooked || 0;
  const totalStaffDays = client.totalStaffDays || 0;

  return (
    <Link href={`/clients/${client.id}`} className="block">
      <div className="relative rounded-2xl shadow-xl bg-white overflow-hidden transition-all duration-300 group hover:scale-[1.03] hover:shadow-2xl hover:ring-2 hover:ring-pink-200">
        {/* Gradient Header */}
        <div className="relative h-16 bg-gradient-to-r from-pink-500 to-rose-400 flex items-center px-5">
          {/* Days badge in top left */}
          {totalStaffDays > 0 && (
            <div className="absolute top-2 left-2 z-20 bg-white text-pink-600 text-sm font-bold px-2.5 py-0.5 rounded-full shadow border border-pink-200 flex items-center gap-1.5 min-w-[44px] justify-center">
              <CalendarIcon className="h-5 w-5 text-pink-400" />
              <span>{totalStaffDays}</span>
            </div>
          )}
          {/* Company name in header, smaller and with left margin to avoid badge */}
          <h3 className="text-lg font-bold text-white text-center mx-auto w-full truncate drop-shadow-sm pl-12 pr-4">
            {client.name}
          </h3>
          {/* Edit icon (hover only) */}
          <div className="absolute top-3 right-3 z-30">
            <Link href={`/clients/${client.id}?edit=true`} onClick={e => e.stopPropagation()}>
              <button className="bg-white p-2 rounded-full text-gray-500 hover:text-pink-500 shadow border border-gray-200 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto">
                <PencilSquareIcon className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
        {/* No empty card body */}
        {/* Card Footer - Contact Buttons */}
        <div className="flex justify-center gap-6 py-7">
          {client.email && (
            <Link
              href={`mailto:${client.email}`}
              onClick={e => e.stopPropagation()}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-pink-500 text-white shadow-lg hover:bg-pink-600 transition-all text-xl border-2 border-white hover:scale-110"
              title={`Email ${client.name}`}
            >
              <EnvelopeIcon className="h-6 w-6" />
            </Link>
          )}
          {client.phone && (
            <Link
              href={`tel:${client.phone}`}
              onClick={e => e.stopPropagation()}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-500 text-white shadow-lg hover:bg-gray-700 transition-all text-xl border-2 border-white hover:scale-110"
              title={`Call ${client.name}`}
            >
              <PhoneIcon className="h-6 w-6" />
            </Link>
          )}
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
                    {client.totalStaffDays || 0}
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