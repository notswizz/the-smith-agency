import React from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import {
  EnvelopeIcon,
  PhoneIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  AcademicCapIcon,
  IdentificationIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

export default function StaffProfileHeader({ staffMember, totalDaysWorked, bookingsCount, togglePhysicalDetails: toggleSizes, isPhysicalDetailsOpen: isSizesOpen }) {
  const router = useRouter();

  // Ensure we have a name to display
  const name = staffMember.name || 'Unnamed Staff';
  
  // Get initial for profile avatar
  const initial = name.charAt(0) || '?';
  
  // Check for profile image (from any of the possible fields)
  const profileImage = staffMember.image || staffMember.photoURL || staffMember.photoUrl || staffMember.profileImage || staffMember.picture;
  
  // Check if the staff member has physical details
  const hasSizes = staffMember.sizes && Object.keys(staffMember.sizes).some(k => staffMember.sizes[k]);
  
  return (
    <>
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1 sm:mb-2">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/staff')}
            className="flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Back to Staff</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{name}</h1>
        </div>
      </div>

      {/* Profile Section - Full Width at Top */}
      <div className="bg-gradient-to-r from-pink-100 to-blue-100 rounded-xl shadow-md overflow-hidden relative transition-shadow duration-300 pt-8 pb-6 min-h-[220px] flex flex-col justify-center">
        {/* Sizes Button - only show if has details */}
        {hasSizes && (
          <button 
            onClick={toggleSizes}
            className="absolute right-3 sm:right-6 top-3 sm:top-6 bg-white/90 hover:bg-white text-gray-700 transition-all duration-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm flex items-center shadow-sm z-20"
          >
            <IdentificationIcon className="h-4 w-4 mr-1" />
            <span>Sizes</span>
            <span className={`ml-1 h-1.5 w-1.5 rounded-full ${isSizesOpen ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
          </button>
        )}
        {/* Horizontal layout for profile section */}
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 mt-2">
          {/* Profile image */}
          <div className="relative flex-shrink-0">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-pink-200 bg-white shadow-md overflow-hidden flex items-center justify-center">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={`${name} profile`}
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 text-gray-600 flex items-center justify-center text-3xl sm:text-4xl font-semibold">
                  {initial}
                </div>
              )}
              {/* Edit icon on hover */}
              <Link href={`/staff/${staffMember.id}/edit`} className="absolute bottom-2 right-2 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity duration-200 z-20">
                <button className="bg-white p-2 rounded-full text-pink-500 hover:text-pink-700 shadow border border-pink-200 hover:border-pink-400">
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
          {/* Info and contact */}
          <div className="flex flex-col items-center md:items-start gap-2 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-0">{name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              {staffMember.college && (
                <div className="flex items-center text-gray-600 bg-pink-100 px-2 py-1 rounded-md">
                  <AcademicCapIcon className="h-4 w-4 text-pink-400 mr-1" />
                  <span className="text-xs font-medium">{staffMember.college}</span>
                </div>
              )}
              {staffMember.location && (
                <div className="flex items-center text-gray-600 bg-blue-100 px-2 py-1 rounded-md">
                  <MapPinIcon className="h-4 w-4 text-blue-400 mr-1" />
                  <span className="text-xs font-medium">{staffMember.location}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-2">
              {staffMember.email && (
                <a
                  href={`mailto:${staffMember.email}`}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-pink-100 text-pink-600 shadow hover:bg-pink-200 transition-all text-lg border border-pink-200 hover:scale-105"
                  title={`Email ${name}`}
                >
                  <EnvelopeIcon className="h-5 w-5" />
                </a>
              )}
              {staffMember.phone && (
                <a
                  href={`tel:${staffMember.phone}`}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow hover:bg-blue-200 transition-all text-lg border border-blue-200 hover:scale-105"
                  title={`Call ${name}`}
                >
                  <PhoneIcon className="h-5 w-5" />
                </a>
              )}
              {staffMember.instagram && (
                <a
                  href={`https://instagram.com/${staffMember.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-purple-100 text-pink-600 shadow hover:from-pink-200 hover:to-purple-200 transition-all text-lg border border-pink-200 hover:scale-105"
                  title={`Instagram ${name}`}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
          {/* Stats */}
          <div className="flex flex-col gap-2 items-center md:items-end justify-center min-w-[120px] mt-4 md:mt-0">
            <div className="bg-white rounded-lg px-4 py-2 text-center shadow border border-gray-200 min-w-[80px]">
              <div className="text-lg font-bold text-gray-800">{totalDaysWorked}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Days</div>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 text-center shadow border border-gray-200 min-w-[80px]">
              <div className="text-lg font-bold text-gray-800">{bookingsCount}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Shows</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 