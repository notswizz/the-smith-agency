import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/ui/DashboardLayout';
import StaffList from '@/components/staff/StaffList';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { searchStaff } from '@/utils/filterUtils';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function StaffDirectory() {
  const { staff, getBookingsForStaff, fetchStaff } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Load staff data on component mount
  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

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

  // Apply search filter to staff
  const filteredStaff = useMemo(() => {
    let result = staffWithDaysWorked;

    // Apply search filter
    if (searchQuery) {
      result = searchStaff(result, searchQuery);
    }

    // Sort by days worked (descending)
    result = [...result].sort((a, b) => b.totalDaysWorked - a.totalDaysWorked);

    return result;
  }, [staffWithDaysWorked, searchQuery]);

  return (
    <>
      <Head>
        <title>Staff Directory | The Smith Agency</title>
        <meta name="description" content="Manage your staff at The Smith Agency" />
      </Head>

      <DashboardLayout>
        <div className="flex flex-col h-full">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-b from-secondary-50 to-secondary-50/80 backdrop-blur-sm px-4 sm:px-6 py-4 border-b border-secondary-200">
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-xl font-bold text-secondary-900">Staff</h1>
              <p className="text-xs text-secondary-500">{filteredStaff.length} members</p>
            </div>
            
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-auto p-4 sm:p-6">
            {filteredStaff.length > 0 ? (
              <StaffList staff={filteredStaff} />
            ) : (
              <div className="bg-white shadow-sm rounded-lg p-6 text-center">
                <p className="text-secondary-500">No staff members found matching your search.</p>
                {searchQuery && (
                  <p className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 