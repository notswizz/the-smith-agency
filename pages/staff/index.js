import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '@/components/ui/DashboardLayout';
import StaffList from '@/components/staff/StaffList';
import StaffFilters from '@/components/staff/StaffFilters';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { searchStaff, filterStaffByExperience, filterStaffByAvailability } from '@/utils/filterUtils';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function StaffDirectory() {
  const { staff, availability, getBookingsForStaff } = useStore();
  const [filters, setFilters] = useState({
    search: '',
    experience: 'all',
    showId: '',
    availabilityDate: '',
  });

  // Calculate days worked for each staff member
  const staffWithDaysWorked = useMemo(() => {
    return staff.map(staffMember => {
      const staffBookings = getBookingsForStaff(staffMember.id);
      const totalDaysWorked = staffBookings.reduce((total, booking) => {
        if (Array.isArray(booking.datesNeeded)) {
          return total + booking.datesNeeded.filter(
            dn => Array.isArray(dn.staffIds) && dn.staffIds.includes(staffMember.id)
          ).length;
        }
        return total;
      }, 0);

      return {
        ...staffMember,
        totalDaysWorked
      };
    });
  }, [staff, getBookingsForStaff]);

  // Apply filters to staff
  const filteredStaff = useMemo(() => {
    let result = staffWithDaysWorked;

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

    // Sort by days worked (descending)
    result = [...result].sort((a, b) => b.totalDaysWorked - a.totalDaysWorked);

    return result;
  }, [staffWithDaysWorked, availability, filters]);

  return (
    <>
      <Head>
        <title>Staff Directory | The Smith Agency</title>
        <meta name="description" content="Manage your staff at The Smith Agency" />
      </Head>

      <DashboardLayout>
        <div className="flex flex-col h-full">
          {/* Sticky header section */}
          <div className="sticky top-0 z-10 bg-secondary-50 px-3 sm:px-4 py-3 sm:py-4 border-b border-secondary-200">
            {/* Header with title and actions - more compact layout */}
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl sm:text-2xl font-bold text-secondary-900">Staff Directory</h1>
              <Link href="/staff/new">
                <Button variant="primary" size="sm" className="flex items-center">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Staff
                </Button>
              </Link>
            </div>

            {/* Filters */}
            <StaffFilters
              filters={filters}
              setFilters={setFilters}
              showCount={filteredStaff.length}
              totalCount={staff.length}
            />
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-auto pb-4 pt-3 px-3 sm:px-4">
            {/* Staff list */}
            {filteredStaff.length > 0 ? (
              <StaffList staff={filteredStaff} />
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
        </div>
      </DashboardLayout>
    </>
  );
} 