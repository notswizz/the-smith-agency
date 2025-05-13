import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useStore from '@/lib/hooks/useStore';
import DashboardLayout from '@/components/ui/DashboardLayout';

// Import our components
import StaffProfileHeader from '@/components/staff/StaffProfileHeader';
import StaffSizes from '@/components/staff/StaffSizes';
import StaffBookingHistory from '@/components/staff/StaffBookingHistory';
import StaffAvailability from '@/components/staff/StaffAvailability';
import StaffTabToggle from '@/components/staff/StaffTabToggle';
import StaffNotes from '@/components/staff/StaffNotes';

export default function StaffProfile() {
  const router = useRouter();
  const { id } = router.query;
  const { getStaffById, getBookingsForStaff, shows, getShowById, availability, clients } = useStore();
  const [staffMember, setStaffMember] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [activeTabMobile, setActiveTabMobile] = useState('bookings'); // 'bookings', 'availability', or 'notes'
  const [isSizesOpen, setIsSizesOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const member = getStaffById(id);
      if (member) {
        // If there's no name field but there are firstName/lastName fields, create the name
        if (!member.name && (member.firstName || member.lastName)) {
          member.name = `${member.firstName || ''} ${member.lastName || ''}`.trim();
        }
        setStaffMember(member);
        setBookings(getBookingsForStaff(id));
      } else {
        router.push('/staff');
      }
    }
  }, [id, getStaffById, getBookingsForStaff, router]);

  if (!staffMember) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate total days worked across all bookings
  const totalDaysWorked = bookings.reduce((total, booking) => {
    if (Array.isArray(booking.datesNeeded)) {
      return total + booking.datesNeeded.filter(
        dn => Array.isArray(dn.staffIds) && dn.staffIds.includes(id)
      ).length;
    }
    return total;
  }, 0);
  
  // Toggle the sizes panel
  const toggleSizes = () => {
    setIsSizesOpen(!isSizesOpen);
  };

  return (
    <>
      <Head>
        <title>{staffMember.name || 'Staff Profile'} | The Smith Agency</title>
        <meta name="description" content={`Staff profile for ${staffMember.name || 'staff member'}`} />
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
          }
        `}</style>
      </Head>

      <DashboardLayout>
        <div className="max-w-7xl mx-auto py-3 sm:py-6 px-3 sm:px-4 space-y-4 sm:space-y-6">
          {/* Profile Header */}
          <StaffProfileHeader 
            staffMember={staffMember} 
            totalDaysWorked={totalDaysWorked} 
            bookingsCount={bookings.length}
            togglePhysicalDetails={toggleSizes}
            isPhysicalDetailsOpen={isSizesOpen}
          />
          
          {/* Sizes Panel - Shown when toggled */}
          {isSizesOpen && (
            <div className="animate-fadeIn">
              <StaffSizes staffMember={staffMember} />
            </div>
          )}
          
          {/* Mobile Tab Toggle */}
          <StaffTabToggle activeTab={activeTabMobile} setActiveTab={setActiveTabMobile} />
          
          {/* Content based on mobile tab selection */}
          <div className="space-y-4 sm:space-y-6">
            {/* Bookings and Availability Side by Side on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column: Booking History */}
              <div className={`${activeTabMobile === 'bookings' ? '' : 'lg:block hidden'}`}>
                <StaffBookingHistory 
                  bookings={bookings} 
                  staffId={id} 
                  getShowById={getShowById}
                  clients={clients} 
                />
              </div>
              
              {/* Right Column: Availability */}
              <div className={`${activeTabMobile === 'availability' ? '' : 'lg:block hidden'}`}>
                <StaffAvailability 
                  staffId={id} 
                  availability={availability} 
                  getShowById={getShowById}
                />
              </div>
            </div>
            
            {/* Staff Notes Section - Show on large screens or when notes tab is active */}
            <div className={activeTabMobile === 'notes' ? '' : 'lg:block hidden'}>
              <StaffNotes staffId={id} staffMember={staffMember} />
            </div>
          </div>
          
          {/* Bottom buffer to prevent content from being covered by the menu */}
          <div className="h-20 md:h-16"></div>
        </div>
      </DashboardLayout>
    </>
  );
} 