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
  CameraIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

export default function StaffProfileHeader({
  staffMember,
  totalDaysWorked,
  bookingsCount,
  togglePhysicalDetails: toggleSizes,
  isPhysicalDetailsOpen: isSizesOpen,
  onViewApplication,
  onApproveApplication,
  approvingApplication,
}) {
  const router = useRouter();

  // Ensure we have a name to display
  const name = staffMember.name || 'Unnamed Staff';
  
  // Get initial for profile avatar
  const initial = name.charAt(0) || '?';
  
  // Check for profile image (from any of the possible fields)
  const profileImage = staffMember.image || staffMember.photoURL || staffMember.photoUrl || staffMember.profileImage || staffMember.picture;
  
  // Check if the staff member has physical details
  const hasSizes = staffMember.sizes && Object.keys(staffMember.sizes).some(k => staffMember.sizes[k]);

  // Determine simple application status (no interview phase)
  const getApplicationStep = () => {
    const applicationCompleted =
      staffMember.applicationFormCompleted ||
      staffMember.applicationCompleted ||
      Boolean(staffMember.applicationFormData);
    const applicationApproved = staffMember.applicationFormApproved || false;

    if (!applicationCompleted && !applicationApproved) {
      return {
        step: 'Not started',
        color: 'bg-gray-50 text-gray-700 border-gray-200',
        emoji: '⏸️',
      };
    }

    if (applicationCompleted && !applicationApproved) {
      return {
        step: 'In review',
        color: 'bg-amber-50 text-amber-800 border-amber-200',
        emoji: '📋',
      };
    }

    if (applicationApproved) {
      return {
        step: 'Approved',
        color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        emoji: '✅',
      };
    }

    return {
      step: 'Unknown',
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      emoji: '❓',
    };
  };

  const applicationStep = getApplicationStep();
  
  return (
    <>
      {/* Header with Back Button and Edit Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/staff')}
            className="flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-3 py-2"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            <span>Back to Staff</span>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
        </div>
        
        {/* Desktop Edit button */}
        <div className="hidden sm:flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/staff/${staffMember.id}/edit`)}
            className="inline-flex items-center"
          >
            <PencilSquareIcon className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 relative">
          {/* Sizes Button - Bottom Right */}
          {hasSizes && (
            <button 
              onClick={toggleSizes}
              className="absolute right-6 bottom-6 bg-white hover:bg-gray-50 text-gray-700 transition-all duration-200 rounded-full px-4 py-2 text-sm flex items-center shadow-sm border border-gray-200 hover:shadow-md"
            >
              <IdentificationIcon className="h-4 w-4 mr-2" />
              <span>Sizes</span>
              <span className={`ml-2 h-2 w-2 rounded-full ${isSizesOpen ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
            </button>
          )}

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Profile Image */}
            <div className="relative flex-shrink-0">
              <div className="h-32 w-32 rounded-2xl bg-white shadow-lg overflow-hidden flex items-center justify-center ring-4 ring-white">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt={`${name} profile`}
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 text-gray-600 flex items-center justify-center text-4xl font-bold">
                    {initial}
                  </div>
                )}
              </div>
              {/* Inline edit button removed in favor of sticky mobile action */}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">{name}</h2>
              
              {/* Tags */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                {staffMember.college && (
                  <div className="flex items-center bg-white text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                    <AcademicCapIcon className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium">{staffMember.college}</span>
                  </div>
                )}
                {staffMember.location && (
                  <div className="flex items-center bg-white text-gray-700 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                    <MapPinIcon className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium">{staffMember.location}</span>
                  </div>
                )}
                {staffMember.payRate && (
                  <div className="flex items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200 shadow-sm">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="text-sm font-medium">${staffMember.payRate}/hr</span>
                  </div>
                )}
              </div>

              {/* Badges */}
              {staffMember.badges && staffMember.badges.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    {staffMember.badges.map((badge, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Buttons */}
              <div className="flex justify-center md:justify-start gap-3">
                {staffMember.email && (
                  <a
                    href={`mailto:${staffMember.email}`}
                    className="bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105"
                    title={`Email ${name}`}
                  >
                    <EnvelopeIcon className="h-5 w-5" />
                  </a>
                )}
                {staffMember.phone && (
                  <a
                    href={`tel:${staffMember.phone}`}
                    className="bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105"
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
                    className="bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105"
                    title={`Instagram ${name}`}
                  >
                    <CameraIcon className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Stats + application actions - right side */}
            <div className="flex flex-col items-stretch md:items-end gap-3">
              <div className="flex gap-3">
                {/* Application Status */}
                <div className={`rounded-lg px-3 py-2 text-center shadow-sm border ${applicationStep.color} min-w-[85px]`}>
                  <div className="text-lg font-bold flex items-center justify-center">
                    <span>{applicationStep.emoji}</span>
                  </div>
                  <div className="text-xs font-semibold">{applicationStep.step}</div>
                </div>
                
                {/* Days Worked */}
                <div className="bg-white rounded-lg px-3 py-2 text-center shadow-sm border border-gray-200 min-w-[70px]">
                  <div className="text-xl font-bold text-gray-900">{totalDaysWorked}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Days</div>
                </div>
                
                {/* Shows */}
                <div className="bg-white rounded-lg px-3 py-2 text-center shadow-sm border border-gray-200 min-w-[70px]">
                  <div className="text-xl font-bold text-gray-900">{bookingsCount}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Shows</div>
                </div>
              </div>

              {(staffMember.applicationFormCompleted ||
                staffMember.applicationFormApproved ||
                staffMember.applicationFormData) && (
                <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
                  {onViewApplication && (
                    <button
                      type="button"
                      onClick={onViewApplication}
                      className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-1.5 text-xs font-medium text-sky-700 shadow-sm hover:bg-sky-50 hover:border-sky-300 transition-colors"
                    >
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-[10px]">
                        👁
                      </span>
                      <span>View application</span>
                    </button>
                  )}
                  {onApproveApplication && !staffMember.applicationFormApproved && (
                    <button
                      type="button"
                      onClick={onApproveApplication}
                      disabled={approvingApplication || !staffMember.applicationFormCompleted}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/15">
                        ✓
                      </span>
                      <span>{approvingApplication ? 'Approving…' : 'Approve application'}</span>
                    </button>
                  )}
                  {staffMember.applicationFormApproved && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-800">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-[10px]">
                        ✓
                      </span>
                      <span>Application approved</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 