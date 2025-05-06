import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/utils/dateUtils';
import useStore from '@/lib/hooks/useStore';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  AcademicCapIcon,
  IdentificationIcon,
  BriefcaseIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export default function StaffProfile() {
  const router = useRouter();
  const { id } = router.query;
  const { getStaffById, getBookingsForStaff, shows, getShowById, availability, clients } = useStore();
  const [staffMember, setStaffMember] = useState(null);
  const [bookings, setBookings] = useState([]);

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

  // Ensure we have a name to display
  const name = staffMember.name || 'Unnamed Staff';
  
  // Get initial for profile avatar
  const initial = name.charAt(0) || '?';
  
  // Check for profile image (from any of the possible fields)
  const profileImage = staffMember.image || staffMember.photoURL || staffMember.photoUrl || staffMember.profileImage || staffMember.picture;
  
  // Calculate total days worked across all bookings
  const totalDaysWorked = bookings.reduce((total, booking) => {
    if (Array.isArray(booking.datesNeeded)) {
      return total + booking.datesNeeded.filter(
        dn => Array.isArray(dn.staffIds) && dn.staffIds.includes(id)
      ).length;
    }
    return total;
  }, 0);
  
  // Determine experience level for badge color
  const getExperienceBadgeColor = (level) => {
    if (!level) return 'bg-secondary-100 text-secondary-800';
    
    const levelLower = level.toLowerCase();
    if (levelLower.includes('advanced')) return 'bg-purple-100 text-purple-800';
    if (levelLower.includes('intermediate')) return 'bg-blue-100 text-blue-800';
    if (levelLower.includes('beginner')) return 'bg-green-100 text-green-800';
    
    return 'bg-primary-100 text-primary-800';
  };
  
  const experienceBadgeColor = getExperienceBadgeColor(staffMember.experience);

  return (
    <>
      <Head>
        <title>{name} | The Smith Agency</title>
        <meta name="description" content={`Staff profile for ${name}`} />
      </Head>

      <DashboardLayout>
        <div className="max-w-7xl mx-auto py-3 sm:py-6 px-3 sm:px-4 space-y-4 sm:space-y-6">
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
              <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500">{name}</h1>
            </div>
            <div className="mt-2 sm:mt-0">
              <Link href={`/staff/${id}/edit`}>
                <Button variant="primary" size="sm" className="flex items-center w-full sm:w-auto justify-center">
                  <PencilSquareIcon className="h-4 w-4 mr-1" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Profile Section - Full Width at Top */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 via-blue-400 to-primary-500 h-28 sm:h-40 relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-white/10 rounded-full -mr-16 sm:-mr-20 -mt-16 sm:-mt-20"></div>
              <div className="absolute bottom-0 left-0 w-20 sm:w-24 h-20 sm:h-24 bg-white/10 rounded-full -ml-10 sm:-ml-12 -mb-10 sm:-mb-12"></div>
              <div className="absolute top-1/2 right-1/3 w-12 sm:w-16 h-12 sm:h-16 bg-white/5 rounded-full hidden sm:block"></div>
              <div className="absolute bottom-1/4 right-1/4 w-10 sm:w-12 h-10 sm:h-12 bg-white/5 rounded-full hidden sm:block"></div>
              
              {/* Curved wave decoration at bottom */}
              <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none">
                <path d="M0 100V0C240 53.3333 480 80 720 80C960 80 1200 53.3333 1440 0V100H0Z" fill="white"/>
              </svg>
            </div>
            
            <div className="px-4 sm:px-6 pb-5 sm:pb-6 relative">
              {/* Profile image and name section */}
              <div className="flex flex-col md:flex-row -mt-14 sm:-mt-24 gap-4 sm:gap-6">
                <div className="flex-shrink-0 relative mx-auto md:mx-0">
                  <div className="h-28 w-28 sm:h-40 sm:w-40 rounded-xl border-4 border-white bg-white shadow-xl overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt={`${name} profile`}
                        width={160}
                        height={160}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center text-3xl sm:text-5xl font-semibold">
                        {initial}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-1 sm:pt-4 text-center md:text-left flex-1 flex flex-col justify-center">
                  <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-secondary-900 bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-blue-600">
                    {name}
                  </h2>
                  
                  {staffMember.college && (
                    <div className="mt-0.5 sm:mt-1 flex items-center justify-center md:justify-start">
                      <AcademicCapIcon className="h-4 w-4 text-secondary-500 mr-1" />
                      <span className="text-xs sm:text-sm text-secondary-600">{staffMember.college}</span>
                    </div>
                  )}
                  
                  {/* Contact information - Redesigned as buttons */}
                  <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-start">
                    {staffMember.email && (
                        <a
                          href={`mailto:${staffMember.email}`}
                          className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm font-medium"
                        >
                          <EnvelopeIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">{staffMember.email}</span>
                          <span className="sm:hidden">Email</span>
                        </a>
                    )}
                    
                    {staffMember.phone && (
                        <a
                          href={`tel:${staffMember.phone}`}
                          className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm font-medium"
                        >
                          <PhoneIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">{staffMember.phone}</span>
                          <span className="sm:hidden">Call</span>
                        </a>
                    )}
                    
                    {staffMember.instagram && (
                        <a
                          href={`https://instagram.com/${staffMember.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm font-medium"
                        >
                          <svg className="h-3.5 sm:h-4 w-3.5 sm:w-4 mr-1 sm:mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                          <span className="hidden sm:inline">{staffMember.instagram}</span>
                          <span className="sm:hidden">Instagram</span>
                        </a>
                    )}
                  </div>
                </div>
                
                {/* Stats summary - Full width on mobile, on the right on larger screens */}
                <div className="md:ml-auto md:self-center mt-4 sm:mt-6 md:mt-0 w-full md:w-auto">
                  <div className="flex gap-4 sm:gap-6 justify-center md:justify-end">
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-3 sm:p-4 text-center shadow-md border border-blue-100 flex-1 md:flex-initial min-w-[90px] sm:min-w-[100px] transform hover:scale-105 transition-transform duration-300">
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600">{totalDaysWorked}</div>
                      <div className="text-2xs sm:text-xs text-blue-500 uppercase tracking-wider font-medium">Days</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg p-3 sm:p-4 text-center shadow-md border border-purple-100 flex-1 md:flex-initial min-w-[90px] sm:min-w-[100px] transform hover:scale-105 transition-transform duration-300">
                      <div className="text-2xl sm:text-3xl font-bold text-purple-600">{bookings.length}</div>
                      <div className="text-2xs sm:text-xs text-purple-500 uppercase tracking-wider font-medium">Shows</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bookings and Availability Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column: Booking History */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 py-3 sm:py-4 px-4 sm:px-6 flex justify-between items-center">
                <div className="flex items-center">
                  <BriefcaseIcon className="h-4 sm:h-5 w-4 sm:w-5 text-white mr-1.5 sm:mr-2" />
                  <h3 className="font-semibold text-white text-sm sm:text-base">Booking History</h3>
                </div>
                <Link href="/bookings">
                  <Button variant="white" size="xs" className="text-emerald-700 text-xs">
                    View All
                  </Button>
                </Link>
              </div>
              
              <div className="divide-y divide-secondary-100 overflow-y-auto" style={{ maxHeight: '320px' }}>
                {bookings.length > 0 ? (
                  bookings.map((booking) => {
                    const show = getShowById(booking.showId);
                    const client = clients.find(c => c.id === booking.clientId);
                    const daysWorked = Array.isArray(booking.datesNeeded)
                      ? booking.datesNeeded.filter(dn => Array.isArray(dn.staffIds) && dn.staffIds.includes(id)).length
                      : 0;
                    
                    // Simply use the show name if available, or a basic fallback if not
                    const showName = show?.name || "Unnamed Show";
                      
                    // Status styles
                    const getStatusColor = (status) => {
                      switch(status) {
                        case 'confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                        case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
                        case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
                        default: return 'bg-secondary-100 text-secondary-800 border-secondary-200';
                      }
                    };
                    
                    const statusColor = getStatusColor(booking.status);
                    
                    return (
                      <div key={booking.id} className="p-3 sm:p-4 hover:bg-secondary-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                              <BriefcaseIcon className="h-4 sm:h-5 w-4 sm:w-5" />
                            </div>
                            
                            <div>
                              {client && (
                                <Link
                                  href={`/bookings/${booking.id}`}
                                  className="text-sm sm:text-base font-semibold text-secondary-900 hover:text-primary-600 transition-colors"
                                >
                                  {client.name}
                                </Link>
                              )}
                              
                              <div className="text-xs sm:text-sm text-secondary-500 mt-0.5">
                                {showName}
                              </div>
                              
                              <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1.5 sm:gap-2 items-center">
                                <span className={`text-2xs sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>
                                
                                <span className="text-2xs sm:text-xs font-semibold text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <CalendarIcon className="h-3 sm:h-3.5 w-3 sm:w-3.5 mr-0.5 sm:mr-1" />
                                  {daysWorked} day{daysWorked !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <Link href={`/bookings/${booking.id}`} className="text-primary-600 hover:text-primary-700">
                            <svg className="h-4 sm:h-5 w-4 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 sm:p-6 text-center">
                    <BriefcaseIcon className="h-10 sm:h-12 w-10 sm:w-12 mx-auto text-secondary-300 mb-3" />
                    <p className="text-sm text-secondary-500 mb-4">No bookings found for this staff member</p>
                    <Link href="/bookings/new">
                      <Button variant="primary" size="sm">Create Booking</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column: Availability */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-400 py-3 sm:py-4 px-4 sm:px-6">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 sm:h-5 w-4 sm:w-5 text-white mr-1.5 sm:mr-2" />
                  <h3 className="font-semibold text-white text-sm sm:text-base">Availability</h3>
                </div>
              </div>
              
              <div className="p-3 sm:p-4 overflow-y-auto" style={{ maxHeight: '320px' }}>
                {(availability || []).filter(a => a.staffId === id).length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {(availability || [])
                      .filter(a => a.staffId === id)
                      .map(availability => {
                        const show = getShowById(availability.showId);
                        if (!show) return null;
                        
                        const availableDates = availability.availableDates || availability.dates || [];
                        
                        // Simply use the show name if available
                        const showName = show.name || "Unnamed Show";
                        
                        return (
                          <div key={availability.id} className="border border-secondary-200 rounded-lg overflow-hidden shadow-sm">
                            <div className="bg-purple-50 px-3 sm:px-4 py-2 sm:py-3 border-b border-secondary-200">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium text-secondary-900 text-sm sm:text-base">{showName}</h3>
                                <span className="text-2xs sm:text-xs bg-purple-100 text-purple-800 px-1.5 sm:px-2 py-0.5 rounded-full">
                                  {availableDates.length} day{availableDates.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <p className="text-2xs sm:text-xs text-secondary-500 mt-0.5 sm:mt-1 flex items-center">
                                <CalendarIcon className="h-3 sm:h-3.5 w-3 sm:w-3.5 mr-0.5 sm:mr-1" />
                                {formatDate(show.startDate)} - {formatDate(show.endDate)}
                              </p>
                            </div>
                            
                            <div className="p-2 sm:p-3">
                              {availableDates.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                  {availableDates.map(date => (
                                    <span 
                                      key={date} 
                                      className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-2xs sm:text-xs font-medium bg-green-100 text-green-800 border border-green-200 shadow-sm"
                                    >
                                      {formatDate(date, 'MMM d')}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-secondary-500 text-xs sm:text-sm text-center py-2">No specific dates available</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6">
                    <CalendarIcon className="h-10 sm:h-12 w-10 sm:w-12 mx-auto text-secondary-300 mb-3" />
                    <p className="text-sm text-secondary-500 mb-1">No availability submitted</p>
                    <p className="text-xs sm:text-sm text-secondary-400">This staff member has not submitted availability for any shows yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Physical Details at Bottom - Full Width */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 py-3 sm:py-4 px-4 sm:px-6">
              <div className="flex items-center">
                <IdentificationIcon className="h-4 sm:h-5 w-4 sm:w-5 text-white mr-1.5 sm:mr-2" />
                <h3 className="font-semibold text-white text-sm sm:text-base">Physical Details</h3>
              </div>
            </div>
            
            {staffMember.sizes && Object.keys(staffMember.sizes).some(k => staffMember.sizes[k]) ? (
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                  {staffMember.sizes?.height && (
                    <div className="bg-blue-50 rounded-lg p-2 sm:p-3 text-center">
                      <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Height</div>
                      <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.height}</div>
                    </div>
                  )}
                  
                  {staffMember.sizes?.waist && (
                    <div className="bg-blue-50 rounded-lg p-2 sm:p-3 text-center">
                      <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Waist</div>
                      <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.waist}</div>
                    </div>
                  )}
                  
                  {staffMember.sizes?.bust && (
                    <div className="bg-blue-50 rounded-lg p-2 sm:p-3 text-center">
                      <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Bust</div>
                      <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.bust}</div>
                    </div>
                  )}
                  
                  {staffMember.sizes?.chest && (
                    <div className="bg-blue-50 rounded-lg p-2 sm:p-3 text-center">
                      <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Chest</div>
                      <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.chest}</div>
                    </div>
                  )}
                  
                  {staffMember.sizes?.hips && (
                    <div className="bg-blue-50 rounded-lg p-2 sm:p-3 text-center">
                      <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Hips</div>
                      <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.hips}</div>
                    </div>
                  )}
                  
                  {staffMember.sizes?.inseam && (
                    <div className="bg-blue-50 rounded-lg p-2 sm:p-3 text-center">
                      <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Inseam</div>
                      <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.inseam}</div>
                    </div>
                  )}
                  
                  {staffMember.sizes?.dress && (
                    <div className="bg-blue-50 rounded-lg p-2 sm:p-3 text-center">
                      <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Dress</div>
                      <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.dress}</div>
                    </div>
                  )}
                  
                  {staffMember.sizes?.jacket && (
                    <div className="bg-blue-50 rounded-lg p-2 sm:p-3 text-center">
                      <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Jacket</div>
                      <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.jacket}</div>
                    </div>
                  )}
                  
                  {staffMember.sizes?.shoe && (
                    <div className="bg-blue-50 rounded-lg p-2 sm:p-3 text-center">
                      <div className="text-2xs sm:text-xs text-blue-500 uppercase font-medium mb-0.5 sm:mb-1">Shoe</div>
                      <div className="text-xs sm:text-sm md:text-base text-secondary-900 font-medium">{staffMember.sizes.shoe}</div>
                    </div>
                  )}
                </div>
                  </div>
                ) : (
              <div className="p-4 sm:p-6 text-center">
                <p className="text-xs sm:text-sm text-secondary-500">No physical details provided</p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 