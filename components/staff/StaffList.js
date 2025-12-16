import React from 'react';
import Link from 'next/link';
import {
  CalendarDaysIcon,
  BriefcaseIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon as CheckBadgeSolid } from '@heroicons/react/24/solid';
import useStore from '@/lib/hooks/useStore';

export default function StaffList({ staff = [], variant = 'grid', cardWidthClass }) {
  if (variant === 'chat') {
    return (
      <div className="overflow-x-auto overflow-y-hidden px-1" style={{ overscrollBehaviorX: 'contain', touchAction: 'pan-x' }}>
        <div className="flex gap-3 snap-x snap-mandatory pb-1">
          {staff && staff.map((staffMember) => (
            <StaffCard key={staffMember.id} staffMember={staffMember} widthClass={`${cardWidthClass || 'min-w-[280px]'} snap-start`} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {staff && staff.map((staffMember) => (
        <StaffCard key={staffMember.id} staffMember={staffMember} />
      ))}
    </div>
  );
}

function StaffCard({ staffMember, widthClass }) {
  const { getBookingsForStaff } = useStore();
  
  const name = staffMember.name || `${staffMember.firstName || ''} ${staffMember.lastName || ''}`.trim() || 'Unknown';
  
  // Application status
  const isApproved = staffMember.applicationFormApproved || false;
  const isPending = (staffMember.applicationFormCompleted || staffMember.applicationCompleted || staffMember.applicationFormData) && !isApproved;

  // Get initials
  const initials = name.split(' ')
    .map(part => part.charAt(0))
    .filter(char => char)
    .join('')
    .toUpperCase()
    .substring(0, 2) || '??';
  
  // Profile image
  const profileImage = staffMember.image || staffMember.photoURL || staffMember.photoUrl || staffMember.picture;
  
  // Stats
  const staffBookings = getBookingsForStaff(staffMember.id);
  const totalDaysWorked = staffBookings.reduce((total, booking) => {
    if (Array.isArray(booking.datesNeeded)) {
      return total + booking.datesNeeded.filter(
        dn => Array.isArray(dn.staffIds) && dn.staffIds.includes(staffMember.id)
      ).length;
    }
    return total;
  }, 0);

  // Hourly rate
  const hourlyRate = (() => {
    const pay = typeof staffMember.payRate === 'number' ? staffMember.payRate : parseFloat(staffMember.payRate);
    if (!Number.isNaN(pay) && pay > 0) return Math.round(pay);
    const day = typeof staffMember.dayRate === 'number' ? staffMember.dayRate : parseFloat(staffMember.dayRate);
    if (!Number.isNaN(day) && day > 0) return Math.round(day / 8);
    return null;
  })();

  return (
    <Link href={`/staff/${staffMember.id}`} className={`block ${widthClass || ''}`}>
      <div className="bg-white rounded-xl border border-secondary-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200 overflow-hidden group">
        {/* Image Section */}
        <div className="relative aspect-square bg-secondary-100">
          {profileImage ? (
            <img 
              src={profileImage} 
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
              <span className="text-3xl font-bold text-primary-600">{initials}</span>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            {isApproved ? (
              <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-500 text-white rounded-full shadow-sm">
                <CheckBadgeSolid className="w-4 h-4" />
              </span>
            ) : isPending ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500 text-white px-2 py-1 rounded-full shadow-sm">
                <ClockIcon className="w-3 h-3" />
                Pending
              </span>
            ) : null}
          </div>

          {/* Rate Badge */}
          {hourlyRate && (
            <div className="absolute top-2 left-2">
              <span className="text-[10px] font-semibold bg-white/90 backdrop-blur text-secondary-700 px-2 py-1 rounded-full shadow-sm">
                ${hourlyRate}/hr
              </span>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-3">
          <h3 className="font-semibold text-secondary-900 text-sm truncate group-hover:text-primary-600 transition-colors">
            {name}
          </h3>
          
          {(staffMember.college || staffMember.city || staffMember.location) && (
            <p className="text-xs text-secondary-500 truncate mt-0.5">
              {staffMember.college}
              {staffMember.college && (staffMember.city || staffMember.location) && ' • '}
              {staffMember.city || staffMember.location}
            </p>
          )}

          {/* Stats Row */}
          {(totalDaysWorked > 0 || staffBookings.length > 0) && (
            <div className="flex items-center gap-3 mt-2 text-xs text-secondary-500">
              {totalDaysWorked > 0 && (
                <span className="flex items-center gap-1">
                  <CalendarDaysIcon className="w-3.5 h-3.5" />
                  {totalDaysWorked} days
                </span>
              )}
              {staffBookings.length > 0 && (
                <span className="flex items-center gap-1">
                  <BriefcaseIcon className="w-3.5 h-3.5" />
                  {staffBookings.length} shows
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
