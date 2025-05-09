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
          <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-pink-500">{name}</h1>
        </div>
      </div>

      {/* Profile Section - Full Width at Top */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-[0_8px_30px_rgb(219,39,119,0.2)] transition-shadow duration-300">
        <div className="bg-pink-500 h-32 sm:h-48 relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-white/10 rounded-full -mr-16 sm:-mr-20 -mt-16 sm:-mt-20"></div>
          <div className="absolute bottom-0 left-0 w-20 sm:w-24 h-20 sm:h-24 bg-white/10 rounded-full -ml-10 sm:-ml-12 -mb-10 sm:-mb-12"></div>
          <div className="absolute top-1/2 right-1/3 w-12 sm:w-16 h-12 sm:h-16 bg-white/5 rounded-full hidden sm:block"></div>
          <div className="absolute bottom-1/4 right-1/4 w-10 sm:w-12 h-10 sm:h-12 bg-white/5 rounded-full hidden sm:block"></div>
          
          {/* Sizes Button - only show if has details */}
          {hasSizes && (
            <button 
              onClick={toggleSizes}
              className="absolute right-3 sm:right-6 top-3 sm:top-6 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-all duration-300 rounded-full px-3 py-1.5 text-xs sm:text-sm flex items-center"
            >
              <IdentificationIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span>Sizes</span>
              <span className={`ml-1 h-1.5 w-1.5 rounded-full ${isSizesOpen ? 'bg-green-300' : 'bg-white'}`}></span>
            </button>
          )}
          
          {/* Curved wave decoration at bottom */}
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none">
            <path d="M0 100V0C240 53.3333 480 80 720 80C960 80 1200 53.3333 1440 0V100H0Z" fill="white"/>
          </svg>
        </div>
        
        <div className="px-4 sm:px-6 pb-5 sm:pb-6 relative">
          {/* Profile image and name section */}
          <div className="flex flex-col md:flex-row -mt-16 sm:-mt-24 gap-4 sm:gap-6">
            <div className="flex-shrink-0 relative mx-auto md:mx-0">
              <div className="h-32 w-32 sm:h-48 sm:w-48 rounded-xl border-4 border-pink-500 bg-white shadow-xl overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-300">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt={`${name} profile`}
                    width={192}
                    height={192}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-pink-500 text-white flex items-center justify-center text-4xl sm:text-6xl font-semibold">
                    {initial}
                  </div>
                )}
              </div>
              
              {/* Float edit button in a subtle way over the image */}
              <Link href={`/staff/${staffMember.id}/edit`} className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4">
                <button className="bg-white/90 backdrop-blur-sm p-1.5 sm:p-2 rounded-full text-gray-500 hover:text-pink-600 hover:bg-white transition-colors shadow-sm border border-gray-100 hover:border-pink-200">
                  <PencilSquareIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </Link>
            </div>
            
            <div className="pt-1 sm:pt-4 text-center md:text-left flex-1 flex flex-col justify-center">
              <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-secondary-900 bg-clip-text text-transparent bg-gradient-to-r from-pink-700 to-pink-500">
                {name}
              </h2>
              
              <div className="mt-1 sm:mt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
                {staffMember.college && (
                  <div className="flex items-center text-secondary-600 bg-secondary-50 px-2 py-1 rounded-md">
                    <AcademicCapIcon className="h-3.5 w-3.5 text-secondary-500 mr-1" />
                    <span className="text-xs">{staffMember.college}</span>
                  </div>
                )}
                
                {staffMember.location && (
                  <div className="flex items-center text-secondary-600 bg-secondary-50 px-2 py-1 rounded-md">
                    <MapPinIcon className="h-3.5 w-3.5 text-secondary-500 mr-1" />
                    <span className="text-xs">{staffMember.location}</span>
                  </div>
                )}
              </div>
              
              {/* Contact information - Enhanced design */}
              <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                {staffMember.email && (
                  <a
                    href={`mailto:${staffMember.email}`}
                    className="group relative flex items-center px-3.5 py-2 rounded-full bg-gradient-to-r from-blue-500/90 to-indigo-600/90 text-white hover:from-blue-500 hover:to-indigo-600 transition-all shadow-sm hover:shadow-md text-sm font-medium overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="relative flex items-center">
                      <span className="flex items-center justify-center bg-white/20 rounded-full w-6 h-6 mr-2">
                        <EnvelopeIcon className="h-3.5 w-3.5" />
                      </span>
                      <span className="hidden sm:inline max-w-[180px] truncate">{staffMember.email}</span>
                      <span className="sm:hidden">Email</span>
                    </span>
                  </a>
                )}
                
                {staffMember.phone && (
                  <a
                    href={`tel:${staffMember.phone}`}
                    className="group relative flex items-center px-3.5 py-2 rounded-full bg-gradient-to-r from-green-500/90 to-teal-500/90 text-white hover:from-green-500 hover:to-teal-500 transition-all shadow-sm hover:shadow-md text-sm font-medium overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="relative flex items-center">
                      <span className="flex items-center justify-center bg-white/20 rounded-full w-6 h-6 mr-2">
                        <PhoneIcon className="h-3.5 w-3.5" />
                      </span>
                      <span className="hidden sm:inline">{staffMember.phone}</span>
                      <span className="sm:hidden">Call</span>
                    </span>
                  </a>
                )}
                
                {staffMember.instagram && (
                  <a
                    href={`https://instagram.com/${staffMember.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center px-3.5 py-2 rounded-full bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white hover:from-purple-500 hover:to-pink-500 transition-all shadow-sm hover:shadow-md text-sm font-medium overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="relative flex items-center">
                      <span className="flex items-center justify-center bg-white/20 rounded-full w-6 h-6 mr-2">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </span>
                      <span className="hidden sm:inline">{staffMember.instagram}</span>
                      <span className="sm:hidden">Instagram</span>
                    </span>
                  </a>
                )}
              </div>
            </div>
            
            {/* Stats summary - Full width on mobile, on the right on larger screens */}
            <div className="md:ml-auto md:self-center mt-4 sm:mt-6 md:mt-0 w-full md:w-auto">
              <div className="flex gap-4 sm:gap-6 justify-center md:justify-end">
                <div className="bg-gradient-to-br from-pink-50 to-white rounded-lg p-3 sm:p-4 text-center shadow-md border border-pink-100 flex-1 md:flex-initial min-w-[90px] sm:min-w-[100px] transform hover:scale-105 transition-transform duration-300">
                  <div className="text-2xl sm:text-3xl font-bold text-pink-600">{totalDaysWorked}</div>
                  <div className="text-2xs sm:text-xs text-pink-500 uppercase tracking-wider font-medium">Days</div>
                </div>
                
                <div className="bg-gradient-to-br from-pink-50 to-white rounded-lg p-3 sm:p-4 text-center shadow-md border border-pink-100 flex-1 md:flex-initial min-w-[90px] sm:min-w-[100px] transform hover:scale-105 transition-transform duration-300">
                  <div className="text-2xl sm:text-3xl font-bold text-pink-600">{bookingsCount}</div>
                  <div className="text-2xs sm:text-xs text-pink-500 uppercase tracking-wider font-medium">Shows</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 