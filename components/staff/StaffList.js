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
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import useStore from '@/lib/hooks/useStore';

export default function StaffList({ staff = [] }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
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
  
  // Generate a unique gradient based on the first letter of the name
  const getGradient = (letter) => {
    const gradients = [
      'from-pink-500 to-purple-600',
      'from-blue-500 to-teal-400',
      'from-green-400 to-emerald-600',
      'from-orange-400 to-pink-500',
      'from-indigo-500 to-blue-400',
      'from-red-500 to-orange-400',
      'from-amber-400 to-yellow-300',
      'from-violet-500 to-purple-500',
      'from-teal-400 to-cyan-400',
      'from-fuchsia-500 to-pink-500',
    ];
    
    // Use character code to generate a consistent index
    const index = letter ? (letter.charCodeAt(0) % gradients.length) : 0;
    return gradients[index];
  };

  const gradient = getGradient(name.charAt(0));

  return (
    <Link href={`/staff/${staffMember.id}`} className="block transform transition-transform duration-300 hover:scale-[1.02]">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl relative transition-all duration-300 border-b-4 border-primary-500 h-full">
        {/* Floating edit button */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10">
          <Link href={`/staff/${staffMember.id}/edit`} onClick={(e) => e.stopPropagation()}>
            <button className="bg-white/90 backdrop-blur-sm p-1.5 sm:p-2 rounded-full text-secondary-600 hover:text-primary-600 hover:bg-white transition-colors shadow-sm">
              <PencilSquareIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </Link>
        </div>
        
        {/* Days Worked Badge - Show only if days worked > 0 */}
        {totalDaysWorked > 0 && (
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
            <div className="bg-primary-100 text-primary-800 text-2xs sm:text-xs font-bold px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full flex items-center">
              <CalendarIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" /> 
              {totalDaysWorked}
            </div>
          </div>
        )}
        
        {/* Card header with gradient */}
        <div className={`bg-gradient-to-r ${gradient} pt-4 sm:pt-5 px-4 sm:px-6 pb-20 sm:pb-24 relative`}>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-white/10 rounded-full -mr-6 sm:-mr-8 -mt-6 sm:-mt-8"></div>
          <div className="absolute bottom-0 left-0 w-10 sm:w-12 h-10 sm:h-12 bg-white/10 rounded-full -ml-5 sm:-ml-6 -mb-5 sm:-mb-6"></div>
        </div>
        
        <div className="px-4 sm:px-6 pb-5 sm:pb-6 relative">
          {/* Profile circle with image or initials */}
          <div className="flex flex-col items-center -mt-14 sm:-mt-16 mb-3 sm:mb-4">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-white flex items-center justify-center text-2xl sm:text-3xl font-semibold shadow-md border-4 border-white overflow-hidden">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = `<span class="text-transparent bg-clip-text bg-gradient-to-br ${gradient}">${initials}</span>`;
                  }}
                />
              ) : (
                <span className={`text-transparent bg-clip-text bg-gradient-to-br ${gradient}`}>{initials}</span>
              )}
            </div>
          </div>
          
          {/* Name and college */}
          <div className="text-center mb-4 sm:mb-5">
            <h3 className="text-lg sm:text-xl font-bold text-secondary-900">
              {name}
            </h3>
            {staffMember.college && (
              <div className="mt-1 inline-flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-secondary-100 text-secondary-800 text-2xs sm:text-xs font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
                {staffMember.college}
              </div>
            )}
          </div>
          
          {/* Contact buttons */}
          <div className="flex justify-center space-x-3 sm:space-x-4">
            {staffMember.email && (
              <Link 
                href={`mailto:${staffMember.email}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-primary-500 text-white p-2.5 sm:p-3 rounded-full hover:bg-primary-600 transition-colors shadow-md"
                title={`Email ${name}`}
              >
                <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            )}
            
            {staffMember.phone && (
              <Link 
                href={`tel:${staffMember.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-green-500 text-white p-2.5 sm:p-3 rounded-full hover:bg-green-600 transition-colors shadow-md"
                title={`Call ${name}`}
              >
                <PhoneIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
} 