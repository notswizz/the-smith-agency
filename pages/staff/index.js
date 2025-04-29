import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '@/components/ui/DashboardLayout';
import StaffList from '@/components/staff/StaffList';
import StaffFilters from '@/components/staff/StaffFilters';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { searchStaff, filterStaffByExperience, filterStaffByAvailability } from '@/utils/filterUtils';
import { PlusIcon, TableCellsIcon, ListBulletIcon } from '@heroicons/react/24/outline';

export default function StaffDirectory() {
  const { staff, availability } = useStore();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [filters, setFilters] = useState({
    search: '',
    experience: 'all',
    showId: '',
    availabilityDate: '',
  });

  // Apply filters to staff
  const filteredStaff = useMemo(() => {
    let result = staff;

    // Apply search filter
    if (filters.search) {
      result = searchStaff(result, filters.search);
    }

    // Apply experience filter
    if (filters.experience !== 'all') {
      result = filterStaffByExperience(result, filters.experience);
    }

    // Apply availability filter for show and date
    if (filters.showId && filters.availabilityDate) {
      result = filterStaffByAvailability(
        result,
        availability,
        filters.showId,
        filters.availabilityDate
      );
    }

    return result;
  }, [staff, availability, filters]);

  return (
    <>
      <Head>
        <title>Staff Directory | The Smith Agency</title>
        <meta name="description" content="Manage your staff at The Smith Agency" />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Header with title and actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-secondary-900">Staff Directory</h1>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
              <div className="flex space-x-3">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="flex items-center"
                >
                  <TableCellsIcon className="h-5 w-5 mr-1" />
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="flex items-center"
                >
                  <ListBulletIcon className="h-5 w-5 mr-1" />
                  Table
                </Button>
              </div>
              <Link href="/staff/new">
                <Button variant="primary" size="sm" className="flex items-center">
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Add Staff
                </Button>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <StaffFilters
            filters={filters}
            setFilters={setFilters}
            showCount={filteredStaff.length}
            totalCount={staff.length}
          />

          {/* Staff list */}
          {filteredStaff.length > 0 ? (
            <StaffList staff={filteredStaff} view={viewMode} />
          ) : (
            <div className="bg-white shadow-sm rounded-lg p-6 text-center">
              <p className="text-secondary-500">No staff members found matching your filters.</p>
              <p className="mt-2">
                <Button variant="outline" size="sm" onClick={() => setFilters({
                  search: '',
                  experience: 'all',
                  showId: '',
                  availabilityDate: '',
                })}>
                  Reset Filters
                </Button>
              </p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}

function StaffTable({ filteredStaff }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-secondary-200 bg-white shadow-sm rounded-lg">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Experience
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Height
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Sizes
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary-200">
          {filteredStaff.map((staff) => (
            <tr key={staff.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    {staff.profileImage ? (
                      <img
                        src={staff.profileImage}
                        alt={`${staff.name} profile`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                        {staff.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <Link 
                      href={`/staff/${staff.id}`}
                      className="text-sm font-medium text-secondary-900 hover:text-primary-600"
                    >
                      {staff.name}
                    </Link>
                    {staff.instagram && (
                      <div className="text-xs text-secondary-500">{staff.instagram}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-secondary-900">{staff.email}</div>
                <div className="text-sm text-secondary-500">{staff.phone}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-secondary-900">{staff.experience}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-secondary-900">{staff.sizes.height}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                {staff.sizes.bust && <span>Bust: {staff.sizes.bust} </span>}
                {staff.sizes.chest && <span>Chest: {staff.sizes.chest} </span>}
                {staff.sizes.waist && <span>Waist: {staff.sizes.waist} </span>}
                {staff.sizes.hips && <span>Hips: {staff.sizes.hips} </span>}
                {staff.sizes.dress && <span>Dress: {staff.sizes.dress} </span>}
                {staff.sizes.shoe && <span>Shoe: {staff.sizes.shoe}</span>}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Link href={`/staff/${staff.id}`}>
                  <Button size="sm" variant="ghost">
                    View
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 