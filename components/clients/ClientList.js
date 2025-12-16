import React from 'react';
import Link from 'next/link';
import {
  CalendarDaysIcon,
  MapPinIcon,
  BuildingOffice2Icon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

export default function ClientList({ clients, view = 'grid' }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
  const totalStaffDays = client.totalStaffDays || 0;
  const showsCount = client.bookingsCount || 0;

  return (
    <Link href={`/clients/${client.id}`} className="block group">
      <div className="bg-white rounded-xl border border-secondary-200 p-4 hover:shadow-lg hover:border-primary-200 transition-all">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-secondary-900 text-sm leading-tight group-hover:text-primary-600 transition-colors">
            {client.name}
          </h3>
          <ChevronRightIcon className="w-4 h-4 text-secondary-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
        
        {/* Location */}
        {client.location && (
          <p className="text-xs text-secondary-500 flex items-center gap-1 mb-2">
            <MapPinIcon className="w-3 h-3 flex-shrink-0" />
            <span>{client.location}</span>
          </p>
        )}
        
        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <CalendarDaysIcon className="w-3.5 h-3.5 text-primary-500" />
            <span className="font-semibold text-secondary-900">{totalStaffDays}</span>
            <span className="text-secondary-400">days</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <BuildingOffice2Icon className="w-3.5 h-3.5 text-secondary-400" />
            <span className="font-semibold text-secondary-900">{showsCount}</span>
            <span className="text-secondary-400">shows</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clients.map((client) => (
            <tr key={client.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900">{client.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {client.location || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm">
                  {client.email && (
                    <a href={`mailto:${client.email}`} className="text-gray-600 hover:text-primary-600">
                      {client.email}
                    </a>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {client.bookingsCount || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {client.totalStaffDays || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <Link href={`/clients/${client.id}`} className="text-primary-600 hover:text-primary-700 font-medium">
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
