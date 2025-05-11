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
      <div className="bg-gradient-to-br from-white to-pink-50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl relative transition-all duration-300 border-2 border-pink-200 h-full group hover:translate-y-[-4px]">
        {/* Decorative top accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-400 to-pink-600"></div>
        
        {/* Status indicator */}
        <div className="absolute top-3 right-3 z-20">
          <div className="flex items-center gap-1.5">
            {isActivelyWorking ? (
              <span className="flex items-center">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 ring-2 ring-white"></span>
                </span>
                <span className="ml-1.5 text-2xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">Working Today</span>
              </span>
            ) : (
              <Link href={`/staff/${staffMember.id}/edit`} onClick={(e) => e.stopPropagation()}>
                <button className="bg-white/80 backdrop-blur-sm p-2 rounded-full text-secondary-600 hover:text-pink-600 hover:shadow-md transition-all duration-200 shadow-sm border-2 border-secondary-200 hover:border-pink-300">
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
              </Link>
            )}
          </div>
        </div>
        
        {/* Booking stats - Stacked vertically - Icons only */}
        <div className="absolute top-3 left-3 z-20 flex flex-col space-y-1.5">
          {totalDaysWorked > 0 && (
            <div className="bg-pink-100 text-pink-800 text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-sm border border-pink-200">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" /> 
              <span>{totalDaysWorked}</span>
            </div>
          )}
          
          {staffBookings.length > 0 && (
            <div className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-sm border border-purple-200">
              <BriefcaseIcon className="h-3.5 w-3.5 mr-1" /> 
              <span>{staffBookings.length}</span>
            </div>
          )}
        </div>
        
        {/* Card content with profile picture highlight */}
        <div className="px-5 pt-12 pb-6 relative z-10">
          {/* Profile circle with image or initials */}
          <div className="flex flex-col items-center mb-5">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 blur-[3px] opacity-70 transform scale-[1.05] group-hover:blur-[5px] group-hover:opacity-80 transition-all duration-300"></div>
              <div className="h-36 w-36 sm:h-40 sm:w-40 rounded-full bg-white flex items-center justify-center text-2xl sm:text-3xl font-semibold overflow-hidden border-4 border-white shadow-lg relative group-hover:shadow-pink-300 transition-all duration-300">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = `<span class="bg-gradient-to-r from-pink-500 to-pink-600 text-transparent bg-clip-text">${initials}</span>`;
                    }}
                  />
                ) : (
                  <span className="bg-gradient-to-r from-pink-500 to-pink-600 text-transparent bg-clip-text">{initials}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Name and college */}
          <div className="text-center mb-5">
            <h3 className="text-lg sm:text-xl font-extrabold text-secondary-800 tracking-tight group-hover:text-pink-600 transition-colors duration-300">
              {name}
            </h3>
            {staffMember.college && (
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-secondary-100 text-secondary-700 text-xs font-medium border border-secondary-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-secondary-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
                {staffMember.college}
              </div>
            )}
          </div>
          
          {/* Contact buttons */}
          <div className="flex justify-center space-x-4">
            {staffMember.email && (
              <Link 
                href={`mailto:${staffMember.email}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-3 rounded-full hover:shadow-lg transition-all duration-300 shadow-md transform hover:-translate-y-1 hover:scale-110 border border-pink-400"
                title={`Email ${name}`}
              >
                <EnvelopeIcon className="h-5 w-5" />
              </Link>
            )}
            
            {staffMember.phone && (
              <Link 
                href={`tel:${staffMember.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-full hover:shadow-lg transition-all duration-300 shadow-md transform hover:-translate-y-1 hover:scale-110 border border-green-400"
                title={`Call ${name}`}
              >
                <PhoneIcon className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
} 