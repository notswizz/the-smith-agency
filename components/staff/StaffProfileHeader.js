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
      return { step: 'Not Started', color: 'bg-gray-100 text-gray-600 border-gray-200', emoji: '⏸️' };
    }
    
    // Application submitted but not approved
    if (applicationCompleted && !applicationApproved) {
      return { step: 'App Review', color: 'bg-yellow-100 text-yellow-600 border-yellow-200', emoji: '📋' };
    }
    
    // Application approved but interview not completed
    if (applicationApproved && !interviewCompleted) {
      return { step: 'Interview', color: 'bg-blue-100 text-blue-600 border-blue-200', emoji: '🎤' };
    }
    
    // Interview completed but not approved
    if (interviewCompleted && !interviewApproved) {
      return { step: 'Final Review', color: 'bg-orange-100 text-orange-600 border-orange-200', emoji: '⏳' };
    }
    
    // Fully onboarded
    if (interviewApproved) {
      return { step: 'Active', color: 'bg-green-100 text-green-600 border-green-200', emoji: '✅' };
    }
    
    // Default fallback
    return { step: 'Unknown', color: 'bg-gray-100 text-gray-600 border-gray-200', emoji: '❓' };
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
        
        {/* Edit Button removed in favor of sticky mobile action */}
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

            {/* Stats Cards - Compact Horizontal Layout */}
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
          </div>
        </div>
      </div>
    </>
  );
} 