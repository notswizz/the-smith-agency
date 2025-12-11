import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useStore from '@/lib/hooks/useStore';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';

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
  const {
    getStaffById,
    getBookingsForStaff,
    shows,
    getShowById,
    availability,
    clients,
    updateStaff,
  } = useStore();
  const [staffMember, setStaffMember] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [activeTabMobile, setActiveTabMobile] = useState('bookings'); // 'bookings', 'availability', or 'notes'
  const [isSizesOpen, setIsSizesOpen] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [approvingApplication, setApprovingApplication] = useState(false);
  const [applicationError, setApplicationError] = useState('');

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

  const handleApproveApplication = async () => {
    if (!id || !staffMember || staffMember.applicationFormApproved) return;
    setApprovingApplication(true);
    setApplicationError('');
    try {
      const payload = {
        ...staffMember,
        applicationFormApproved: true,
      };
      const updated = await updateStaff(id, payload);
      setStaffMember(updated);
    } catch (err) {
      console.error('Error approving application', err);
      setApplicationError('Failed to approve application. Please try again.');
    } finally {
      setApprovingApplication(false);
    }
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
            onViewApplication={() => setShowApplicationModal(true)}
            onApproveApplication={handleApproveApplication}
            approvingApplication={approvingApplication}
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

      {/* Application details modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-blue-600 px-5 py-3">
              <h3 className="text-sm font-semibold text-white">
                Staff application · {staffMember.name || 'Staff'}
              </h3>
              <button
                type="button"
                onClick={() => setShowApplicationModal(false)}
                className="rounded-full bg-white/10 p-1 text-white hover:bg-white/20"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] space-y-4 overflow-auto px-5 py-4 text-sm text-secondary-800">
              {staffMember.applicationFormData ? (
                <>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-500">
                      Phone
                    </p>
                    <p className="mt-1 rounded-md bg-secondary-50 px-3 py-2">
                      {staffMember.applicationFormData.phone || staffMember.phone || 'Not provided'}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-500">
                        Location
                      </p>
                      <p className="mt-1 rounded-md bg-secondary-50 px-3 py-2">
                        {staffMember.applicationFormData.location || staffMember.location || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-500">
                        College
                      </p>
                      <p className="mt-1 rounded-md bg-secondary-50 px-3 py-2">
                        {staffMember.applicationFormData.college || staffMember.college || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-500">
                        Dress size
                      </p>
                      <p className="mt-1 rounded-md bg-secondary-50 px-3 py-2">
                        {staffMember.applicationFormData.dressSize ||
                          staffMember.applicationFormData.size ||
                          staffMember.dressSize ||
                          'Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-500">
                        Shoe size
                      </p>
                      <p className="mt-1 rounded-md bg-secondary-50 px-3 py-2">
                        {staffMember.applicationFormData.shoeSize ||
                          staffMember.shoeSize ||
                          'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-500">
                      Instagram
                    </p>
                    <p className="mt-1 rounded-md bg-secondary-50 px-3 py-2">
                      {staffMember.applicationFormData.instagram || staffMember.instagram || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-500">
                      Retail / wholesale experience
                    </p>
                    <p className="mt-1 whitespace-pre-wrap rounded-md bg-secondary-50 px-3 py-2">
                      {staffMember.applicationFormData.retailWholesaleExperience ||
                        staffMember.retailWholesaleExperience ||
                        'Not provided'}
                    </p>
                  </div>
                  {staffMember.applicationFormData.referral && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-500">
                        How they heard about TSA
                      </p>
                      <p className="mt-1 whitespace-pre-wrap rounded-md bg-secondary-50 px-3 py-2">
                        {staffMember.applicationFormData.referral}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="py-6 text-center text-secondary-500">
                  No structured application data has been saved for this staff member yet.
                </p>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-secondary-100 px-5 py-3">
              {applicationError && (
                <p className="text-xs text-red-600">{applicationError}</p>
              )}
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setShowApplicationModal(false)}
                >
                  Close
                </Button>
                {!staffMember.applicationFormApproved && (
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    onClick={async () => {
                      await handleApproveApplication();
                    }}
                    disabled={approvingApplication || !staffMember.applicationFormCompleted}
                  >
                    {approvingApplication ? 'Approving…' : 'Approve & close'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sticky action: Edit Staff */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-black/20 bg-pink-600">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Button
            variant="white"
            size="lg"
            className="w-full text-black border border-black/80"
            onClick={() => router.push(`/staff/${id}/edit`)}
            aria-label="Edit staff"
          >
            Edit
          </Button>
        </div>
      </div>
    </>
  );
} 