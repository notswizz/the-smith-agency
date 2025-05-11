import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '@/components/ui/DashboardLayout';
import StaffList from '@/components/staff/StaffList';
import StaffFilters from '@/components/staff/StaffFilters';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { searchStaff } from '@/utils/filterUtils';
import { PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function StaffDirectory() {
  const { staff, getBookingsForStaff } = useStore();
  const [filters, setFilters] = useState({
    search: ''
  });
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll event to add shadow to header
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

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
    if (filters.search) {
      result = searchStaff(result, filters.search);
    }

    // Sort by days worked (descending)
    result = [...result].sort((a, b) => b.totalDaysWorked - a.totalDaysWorked);

    return result;
  }, [staffWithDaysWorked, filters.search]);

  return (
    <>
      <Head>
        <title>Staff Directory | The Smith Agency</title>
        <meta name="description" content="Manage your staff at The Smith Agency" />
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
          }
          
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 15px 5px rgba(219, 39, 119, 0.1); }
            50% { box-shadow: 0 0 20px 8px rgba(219, 39, 119, 0.2); }
          }
          .pulse-glow {
            animation: pulse-glow 3s infinite ease-in-out;
          }
        `}</style>
      </Head>

      <DashboardLayout>
        <div className="flex flex-col h-full relative">
          {/* Sticky header section - increased z-index to prevent scroll issues */}
          <div className={`sticky top-0 z-30 bg-gradient-to-r from-secondary-50 to-pink-50 px-3 sm:px-4 py-3 sm:py-4 transition-all duration-300 ${scrolled ? 'shadow-md' : ''}`}>
            {/* Header with title and actions */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-pink-500">
                  Staff Directory
                </h1>
                <div className="ml-2 bg-pink-100 text-pink-600 text-xs font-medium px-2 py-1 rounded-full hidden sm:flex items-center">
                  <SparklesIcon className="h-3 w-3 mr-1" />
                  {staff.length} Members
                </div>
              </div>
              
              <Link href="/staff/new">
                <Button variant="primary" size="sm" className="flex items-center pulse-glow">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Staff
                </Button>
              </Link>
            </div>

            {/* Search only - removed filters */}
            <StaffFilters
              filters={filters}
              setFilters={setFilters}
              showCount={filteredStaff.length}
              totalCount={staff.length}
            />
          </div>

          {/* Scrollable content area with scroll snap behavior - lower z-index than header */}
          <div className="flex-1 overflow-auto pb-4 pt-3 px-3 sm:px-4 scroll-smooth md:scroll-auto relative z-10">
            {/* Staff list */}
            {filteredStaff.length > 0 ? (
              <StaffList staff={filteredStaff} />
            ) : (
              <div className="bg-white shadow-sm rounded-lg p-6 text-center border border-pink-100 mt-4">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-4">
                    <SparklesIcon className="h-8 w-8 text-pink-400" />
                  </div>
                  <p className="text-secondary-600 mb-3">No staff members found matching your search.</p>
                  {filters.search && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setFilters({
                        search: ''
                      })}>
                      Clear Search
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 