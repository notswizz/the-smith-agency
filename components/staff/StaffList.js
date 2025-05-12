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

  return (
    <Link href={`/staff/${staffMember.id}`} className="block snap-start snap-always">
      <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg relative transition-all duration-300 border border-gray-200 h-full group hover:translate-y-[-2px] border-t-2 border-t-pink-400">
        {/* Status indicator */}
        <div className="absolute top-3 right-3 z-20">
          <div className="flex items-center gap-1.5">
            {isActivelyWorking ? (
              <span className="flex items-center">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 ring-2 ring-white"></span>
                </span>
                <span className="ml-1.5 text-2xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">Working Today</span>
              </span>
            ) : (
              <Link href={`/staff/${staffMember.id}/edit`} onClick={(e) => e.stopPropagation()}>
                <button className="bg-white p-2 rounded-full text-gray-500 hover:text-gray-700 transition-all duration-200 shadow-sm border border-gray-200 hover:border-pink-300">
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
              </Link>
            )}
          </div>
        </div>
        
        {/* Booking stats - Stacked vertically - Icons only */}
        <div className="absolute top-3 left-3 z-20 flex flex-col space-y-1.5">
          {totalDaysWorked > 0 && (
            <div className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-md flex items-center shadow-sm border border-gray-200 border-l-2 border-l-pink-400">
              <CalendarIcon className="h-3.5 w-3.5 mr-1 text-gray-600" /> 
              <span>{totalDaysWorked}</span>
            </div>
          )}
          
          {staffBookings.length > 0 && (
            <div className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-md flex items-center shadow-sm border border-gray-200 border-l-2 border-l-pink-400">
              <BriefcaseIcon className="h-3.5 w-3.5 mr-1 text-gray-600" /> 
              <span>{staffBookings.length}</span>
            </div>
          )}
        </div>
        
        {/* Card content with profile picture */}
        <div className="px-5 pt-12 pb-6 relative z-10">
          {/* Profile circle with image or initials */}
          <div className="flex flex-col items-center mb-5">
            <div className="relative">
              <div className="h-32 w-32 sm:h-36 sm:w-36 rounded-lg bg-white flex items-center justify-center text-2xl sm:text-3xl font-semibold overflow-hidden border-4 border-white shadow-md relative transition-all duration-300">
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
          </div>
          
          {/* Name and college */}
          <div className="text-center mb-5">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 tracking-tight group-hover:text-pink-600 transition-colors duration-300">
              {name}
            </h3>
            {staffMember.college && (
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
                {staffMember.college}
              </div>
            )}
          </div>
          
          {/* Contact buttons */}
          <div className="flex justify-center space-x-3">
            {staffMember.email && (
              <Link 
                href={`mailto:${staffMember.email}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 p-2.5 rounded-md flex items-center justify-center transition-all duration-200 border border-gray-200 w-10 h-10 hover:border-pink-200"
                title={`Email ${name}`}
              >
                <EnvelopeIcon className="h-5 w-5 text-gray-500" />
              </Link>
            )}
            
            {staffMember.phone && (
              <Link 
                href={`tel:${staffMember.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 p-2.5 rounded-md flex items-center justify-center transition-all duration-200 border border-gray-200 w-10 h-10 hover:border-pink-200"
                title={`Call ${name}`}
              >
                <PhoneIcon className="h-5 w-5 text-gray-500" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
} 