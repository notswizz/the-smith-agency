import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  EnvelopeIcon,
  PhoneIcon,
  PencilSquareIcon,
  UserCircleIcon,
  BriefcaseIcon,
  IdentificationIcon,
  CalendarIcon,
  StatusOnlineIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import useStore from '@/lib/hooks/useStore';

export default function StaffList({ staff = [] }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 snap-y snap-mandatory overflow-y-auto sm:overflow-visible">
        {staff && staff.map((staffMember) => (
          <StaffCard key={staffMember.id} staffMember={staffMember} />
        ))}
      </div>
    </div>
  );
}

function StaffCard({ staffMember }) {
  const { getBookingsForStaff, bookings } = useStore();
  
  // Ensure we have a name
  const name = staffMember.name || `${staffMember.firstName || ''} ${staffMember.lastName || ''}`.trim() || 'Unknown';

  // Determine application process step
  const getApplicationStep = () => {
    // Try to use completedForms array first (matches portal logic), fallback to individual fields
    let applicationCompleted = false;
    let applicationApproved = false;
    let interviewCompleted = false;
    let interviewApproved = false;
    
    if (staffMember.completedForms && Array.isArray(staffMember.completedForms)) {
      const appForm = staffMember.completedForms.find(f => f.formType === 'application');
      const intForm = staffMember.completedForms.find(f => f.formType === 'interview');
      
      applicationCompleted = appForm?.completed || false;
      interviewCompleted = intForm?.completed || false;
    } else {
      // Fallback to individual fields
      applicationCompleted = staffMember.applicationFormCompleted || false;
      interviewCompleted = staffMember.interviewFormCompleted || false;
    }
    
    // Always use individual approval fields since these are admin-controlled
    applicationApproved = staffMember.applicationFormApproved || false;
    interviewApproved = staffMember.interviewFormApproved || false;
    
    // Check if staff member has not started application
    if (!applicationCompleted && !applicationApproved) {
      return { step: 'Not Started', color: 'bg-gray-100 text-gray-700 border-gray-200', emoji: '⏸️' };
    }
    
    // Application submitted but not approved
    if (applicationCompleted && !applicationApproved) {
      return { step: 'Application Review', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', emoji: '📋' };
    }
    
    // Application approved but interview not completed
    if (applicationApproved && !interviewCompleted) {
      return { step: 'Interview Pending', color: 'bg-blue-100 text-blue-700 border-blue-200', emoji: '🎤' };
    }
    
    // Interview completed but not approved
    if (interviewCompleted && !interviewApproved) {
      return { step: 'Interview Review', color: 'bg-orange-100 text-orange-700 border-orange-200', emoji: '⏳' };
    }
    
    // Fully onboarded
    if (interviewApproved) {
      return { step: 'Active', color: 'bg-green-100 text-green-700 border-green-200', emoji: '✅' };
    }
    
    // Default fallback
    return { step: 'Unknown', color: 'bg-gray-100 text-gray-700 border-gray-200', emoji: '❓' };
  };

  const applicationStep = getApplicationStep();
  
  // Get initials from name
  const initials = name.split(' ')
    .map(part => part.charAt(0))
    .filter(char => char)
    .join('')
    .toUpperCase()
    .substring(0, 2) || '??';
  
  // Check for profile image (could be photoURL, photoUrl, or image from Google)
  const profileImage = staffMember.image || staffMember.photoURL || staffMember.photoUrl || staffMember.picture;
  
  // Calculate total days worked for this staff member
  const staffBookings = getBookingsForStaff(staffMember.id);
  const totalDaysWorked = staffBookings.reduce((total, booking) => {
    if (Array.isArray(booking.datesNeeded)) {
      return total + booking.datesNeeded.filter(
        dn => Array.isArray(dn.staffIds) && dn.staffIds.includes(staffMember.id)
      ).length;
    }
    return total;
  }, 0);

  // Calculate availability status
  const isActivelyWorking = staffBookings.some(booking => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    return booking.datesNeeded?.some(date => 
      date.date === todayStr && 
      Array.isArray(date.staffIds) && 
      date.staffIds.includes(staffMember.id)
    );
  });

  // Compute hourly rate for display
  const computedHourlyRate = (() => {
    const pay = typeof staffMember.payRate === 'number' ? staffMember.payRate : parseFloat(staffMember.payRate);
    if (!Number.isNaN(pay) && pay > 0) return Math.round(pay);
    const day = typeof staffMember.dayRate === 'number' ? staffMember.dayRate : parseFloat(staffMember.dayRate);
    if (!Number.isNaN(day) && day > 0) return Math.round(day / 8);
    return null;
  })();

  // Badge count for compact display
  const badgeCount = Array.isArray(staffMember.badges) ? staffMember.badges.length : 0;

  return (
    <Link href={`/staff/${staffMember.id}`} className="block snap-start snap-always">
      <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl relative transition-all duration-300 border border-gray-100 h-full group hover:scale-[1.02] hover:border-gray-200 hover:shadow-2xl">
        {/* Application Status - Top Right */}
        <div className="absolute top-4 right-4 z-20">
          <div className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center shadow-sm border ${applicationStep.color}`}>
            <span className="mr-1.5">{applicationStep.emoji}</span>
            <span>{applicationStep.step}</span>
          </div>
        </div>

        {/* Booking Stats - Top Left */}
        <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2">
          {totalDaysWorked > 0 && (
            <div className="bg-pink-50 text-pink-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center shadow-sm border border-pink-200">
              <CalendarIcon className="h-3.5 w-3.5 mr-1 text-pink-500" />
              <span>{totalDaysWorked}</span>
            </div>
          )}
          {staffBookings.length > 0 && (
            <div className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center shadow-sm border border-blue-200">
              <BriefcaseIcon className="h-3.5 w-3.5 mr-1 text-blue-500" />
              <span>{staffBookings.length}</span>
            </div>
          )}
        </div>

        {/* Working Today Indicator - placed under rate to avoid overlap */}
        {isActivelyWorking && (
          <div className="absolute top-32 right-4 z-30">
            <div className="flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-200 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Working</span>
            </div>
          </div>
        )}

        {/* Edit Button - Bottom Right, show on hover */}
        <div className="absolute bottom-4 right-4 z-25 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Link href={`/staff/${staffMember.id}/edit`} onClick={(e) => e.stopPropagation()}>
            <button className="bg-white hover:bg-gray-50 p-2.5 rounded-full text-gray-500 hover:text-gray-700 transition-all duration-200 shadow-lg border border-gray-200 hover:shadow-xl hover:scale-105">
              <PencilSquareIcon className="h-4 w-4" />
            </button>
          </Link>
        </div>

        {/* Badge count - below rate in top-right */}
        {badgeCount > 0 && (
          <div className="absolute top-24 right-4 z-20">
            <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200 shadow-sm">
              <span className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-purple-600 ring-1 ring-purple-200">
                <SparklesIcon className="h-3 w-3" />
              </span>
              <span>{badgeCount}</span>
            </div>
          </div>
        )}

        {/* Hourly Rate - below status in top-right */}
        {computedHourlyRate && (
          <div className="absolute top-14 right-4 z-20">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200 shadow-sm">
              <span>${computedHourlyRate}/hr</span>
            </div>
          </div>
        )}

        {/* Card Content */}
        <div className="px-5 pt-12 pb-14 text-center">
          {/* Profile, name, college - centered */}
          <div className="flex flex-col items-center mb-3">
            <div className="relative mb-1.5">
              <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold overflow-hidden border-3 border-white shadow-lg ring-4 ring-gray-50 group-hover:ring-gray-100 transition-all duration-300">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = `<span className="text-gray-600">${initials}</span>`;
                    }}
                  />
                ) : (
                  <span className="text-gray-600">{initials}</span>
                )}
              </div>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1.5 group-hover:text-gray-700 transition-colors duration-300">{name}</h3>
            {staffMember.college && (
              <div className="mb-0.5">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-600 text-xs font-medium border border-gray-100">
                  <svg className="h-4 w-4 mr-1.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                  {staffMember.college}
                </div>
              </div>
            )}
          </div>

          {/* Contact Buttons */}
          <div className="flex justify-center space-x-3">
            {staffMember.email && (
              <Link 
                href={`mailto:${staffMember.email}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-100 text-gray-700 hover:bg-pink-100 p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 border border-gray-200 w-10 h-10 hover:border-pink-300 shadow-sm hover:scale-110"
                title={`Email ${name}`}
              >
                <EnvelopeIcon className="h-4 w-4 text-pink-500" />
              </Link>
            )}
            {staffMember.phone && (
              <Link 
                href={`tel:${staffMember.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-100 text-gray-700 hover:bg-blue-100 p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 border border-gray-200 w-10 h-10 hover:border-blue-300 shadow-sm hover:scale-110"
                title={`Call ${name}`}
              >
                <PhoneIcon className="h-4 w-4 text-blue-500" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}