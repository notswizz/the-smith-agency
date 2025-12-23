import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import useStore from '@/lib/hooks/useStore';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import StaffNotes from '@/components/staff/StaffNotes';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  MapPinIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckBadgeIcon,
  ChevronRightIcon,
  XMarkIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon as CheckBadgeSolid } from '@heroicons/react/24/solid';

export default function StaffProfile() {
  const router = useRouter();
  const { id } = router.query;
  const {
    getStaffById,
    getBookingsForStaff,
    shows,
    getShowById,
    availability,
    clients,
    updateStaff,
  } = useStore();
  const [staffMember, setStaffMember] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [approvingApplication, setApprovingApplication] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings');

  useEffect(() => {
    if (id) {
      const member = getStaffById(id);
      if (member) {
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
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  const name = staffMember.name || 'Unknown';
  const profileImage = staffMember.image || staffMember.photoURL || staffMember.photoUrl || staffMember.picture;
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  
  const totalDaysWorked = bookings.reduce((total, booking) => {
    if (Array.isArray(booking.datesNeeded)) {
      return total + booking.datesNeeded.filter(
        dn => Array.isArray(dn.staffIds) && dn.staffIds.includes(id)
      ).length;
    }
    return total;
  }, 0);

  const isApproved = staffMember.applicationFormApproved || false;
  const hasApplication = staffMember.applicationFormCompleted || staffMember.applicationFormData;

  const handleApprove = async () => {
    setApprovingApplication(true);
    try {
      const updated = await updateStaff(id, { ...staffMember, applicationFormApproved: true });
      setStaffMember(updated);
    } catch (err) {
      console.error('Error approving:', err);
    } finally {
      setApprovingApplication(false);
    }
  };

  // Get availability for this staff member
  const staffAvailability = availability?.filter(a => a.staffId === id) || [];

  return (
    <>
      <Head>
        <title>{name} | The Smith Agency</title>
      </Head>

      <DashboardLayout>
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <Link href="/staff" className="flex items-center gap-1.5 text-secondary-500 hover:text-secondary-700 transition-colors">
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Staff</span>
            </Link>
            <Link href={`/staff/${id}/edit`}>
              <Button variant="outline" size="sm" className="p-1.5">
                <PencilSquareIcon className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-secondary-200 shadow-sm p-4 mb-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-xl overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      <span className="text-xl font-bold text-primary-600">{initials}</span>
                    </div>
                  )}
                </div>
                {isApproved && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                    <CheckBadgeSolid className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-secondary-900 truncate">{name}</h1>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-secondary-500 mb-2">
                  {staffMember.college && (
                    <span className="flex items-center gap-0.5">
                      <AcademicCapIcon className="w-3 h-3" />
                      {staffMember.college}
                    </span>
                  )}
                  {(staffMember.city || staffMember.location) && (
                    <span className="flex items-center gap-0.5">
                      <MapPinIcon className="w-3 h-3" />
                      {staffMember.city || staffMember.location}
                    </span>
                  )}
                  {staffMember.payRate && (
                    <span className="text-emerald-600 font-medium">${staffMember.payRate}/hr</span>
                  )}
                </div>
                {/* Actions */}
                <div className="flex flex-wrap gap-1.5">
                  {staffMember.email && (
                    <a href={`mailto:${staffMember.email}`} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary-100 hover:bg-secondary-200 rounded text-xs text-secondary-600 transition-colors">
                      <EnvelopeIcon className="w-3 h-3" />
                      Email
                    </a>
                  )}
                  {staffMember.phone && (
                    <a href={`tel:${staffMember.phone}`} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary-100 hover:bg-secondary-200 rounded text-xs text-secondary-600 transition-colors">
                      <PhoneIcon className="w-3 h-3" />
                      Call
                    </a>
                  )}
                  {staffMember.resumeURL && (
                    <a 
                      href={staffMember.resumeURL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 bg-violet-50 hover:bg-violet-100 rounded text-xs text-violet-600 transition-colors"
                    >
                      <DocumentTextIcon className="w-3 h-3" />
                      Resume
                    </a>
                  )}
                  {hasApplication && (
                    <button onClick={() => setShowApplicationModal(true)} className="inline-flex items-center px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded text-xs text-blue-600 transition-colors">
                      Application
                    </button>
                  )}
                  {hasApplication && !isApproved && (
                    <button 
                      onClick={handleApprove}
                      disabled={approvingApplication}
                      className="inline-flex items-center px-2 py-1 bg-emerald-500 hover:bg-emerald-600 rounded text-xs text-white transition-colors disabled:opacity-50"
                    >
                      {approvingApplication ? '...' : 'Approve'}
                    </button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3 flex-shrink-0">
                <div className="text-center">
                  <div className="text-lg font-bold text-secondary-900">{totalDaysWorked}</div>
                  <div className="text-[10px] text-secondary-400 uppercase">Days</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-secondary-900">{bookings.length}</div>
                  <div className="text-[10px] text-secondary-400 uppercase">Shows</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sizes */}
          {staffMember.sizes && Object.values(staffMember.sizes).some(v => v) && (
            <div className="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden mb-3">
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-secondary-900">Sizes</span>
                <div className="flex gap-3 text-xs">
                  {staffMember.sizes.dress && <span className="text-secondary-500">Dress: <span className="text-secondary-900 font-medium">{staffMember.sizes.dress}</span></span>}
                  {staffMember.sizes.shirt && <span className="text-secondary-500">Shirt: <span className="text-secondary-900 font-medium">{staffMember.sizes.shirt}</span></span>}
                  {staffMember.sizes.pants && <span className="text-secondary-500">Pants: <span className="text-secondary-900 font-medium">{staffMember.sizes.pants}</span></span>}
                  {staffMember.sizes.shoe && <span className="text-secondary-500">Shoe: <span className="text-secondary-900 font-medium">{staffMember.sizes.shoe}</span></span>}
                </div>
              </div>
            </div>
          )}

          {/* Tab Toggle */}
          <div className="flex gap-1 p-1 bg-secondary-100 rounded-lg mb-3">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'bookings' ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-500 hover:text-secondary-700'
              }`}
            >
              <BriefcaseIcon className="w-3.5 h-3.5" />
              Bookings
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'availability' ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-500 hover:text-secondary-700'
              }`}
            >
              <CalendarDaysIcon className="w-3.5 h-3.5" />
              Availability
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'notes' ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-500 hover:text-secondary-700'
              }`}
            >
              <DocumentTextIcon className="w-3.5 h-3.5" />
              Notes
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'bookings' && (
            <div className="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden mb-3">
              {bookings.length > 0 ? (
                <div className="divide-y divide-secondary-100">
                  {bookings.map(booking => {
                    const show = getShowById(booking.showId);
                    const client = clients?.find(c => c.id === booking.clientId);
                    const daysForStaff = booking.datesNeeded?.filter(
                      dn => Array.isArray(dn.staffIds) && dn.staffIds.includes(id)
                    ).length || 0;
                    
                    return (
                      <Link key={booking.id} href={`/bookings/${booking.id}`} className="flex items-center justify-between px-3 py-2.5 hover:bg-secondary-50 transition-colors">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-secondary-900 truncate">{client?.name || 'Unknown'}</p>
                          <p className="text-xs text-secondary-500 truncate">{show?.name || 'Unknown Show'}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-secondary-400">{daysForStaff}d</span>
                          <ChevronRightIcon className="w-3.5 h-3.5 text-secondary-300" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <BriefcaseIcon className="w-8 h-8 text-secondary-300 mx-auto mb-2" />
                  <p className="text-xs text-secondary-400">No bookings yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden mb-3">
              {staffAvailability.length > 0 ? (
                <div className="divide-y divide-secondary-100">
                  {staffAvailability.map(avail => {
                    const show = getShowById(avail.showId);
                    const daysCount = avail.availableDates?.length || 0;
                    
                    return (
                      <div key={avail.id || avail.showId} className="px-3 py-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-medium text-secondary-900">{show?.name || 'Unknown Show'}</p>
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">{daysCount}d</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {avail.availableDates?.slice(0, 8).map(date => {
                            const d = new Date(date);
                            const adjusted = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
                            return (
                              <span key={date} className="text-[10px] bg-secondary-100 text-secondary-500 px-1.5 py-0.5 rounded">
                                {adjusted.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            );
                          })}
                          {avail.availableDates?.length > 8 && (
                            <span className="text-[10px] text-secondary-400">+{avail.availableDates.length - 8}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <CalendarDaysIcon className="w-8 h-8 text-secondary-300 mx-auto mb-2" />
                  <p className="text-xs text-secondary-400">No availability submitted</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <StaffNotes staffId={id} staffMember={staffMember} />
          )}

          <div className="h-16"></div>
        </div>
      </DashboardLayout>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm" onClick={() => setShowApplicationModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden z-10">
            <div className="px-5 py-4 border-b border-secondary-100 flex items-center justify-between">
              <h3 className="font-semibold text-secondary-900">Application Details</h3>
              <button onClick={() => setShowApplicationModal(false)} className="p-1 hover:bg-secondary-100 rounded-lg">
                <XMarkIcon className="w-5 h-5 text-secondary-500" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
              {staffMember.applicationFormData ? (
                <>
                  {staffMember.applicationFormData.phone && (
                    <div>
                      <p className="text-xs text-secondary-500 mb-1">Phone</p>
                      <p className="text-secondary-900">{staffMember.applicationFormData.phone}</p>
                    </div>
                  )}
                  {staffMember.applicationFormData.location && (
                    <div>
                      <p className="text-xs text-secondary-500 mb-1">Location</p>
                      <p className="text-secondary-900">{staffMember.applicationFormData.location}</p>
                    </div>
                  )}
                  {staffMember.applicationFormData.college && (
                    <div>
                      <p className="text-xs text-secondary-500 mb-1">College</p>
                      <p className="text-secondary-900">{staffMember.applicationFormData.college}</p>
                    </div>
                  )}
                  {staffMember.applicationFormData.instagram && (
                    <div>
                      <p className="text-xs text-secondary-500 mb-1">Instagram</p>
                      <p className="text-secondary-900">{staffMember.applicationFormData.instagram}</p>
                    </div>
                  )}
                  {staffMember.applicationFormData.retailWholesaleExperience && (
                    <div>
                      <p className="text-xs text-secondary-500 mb-1">Experience</p>
                      <p className="text-secondary-900 whitespace-pre-wrap">{staffMember.applicationFormData.retailWholesaleExperience}</p>
                    </div>
                  )}
                  {(staffMember.resumeURL || staffMember.applicationFormData.resumeURL) && (
                    <div>
                      <p className="text-xs text-secondary-500 mb-1">Resume</p>
                      <a 
                        href={staffMember.resumeURL || staffMember.applicationFormData.resumeURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 rounded-lg text-sm font-medium text-violet-700 transition-colors ring-1 ring-violet-100"
                      >
                        <DocumentTextIcon className="w-4 h-4" />
                        View Resume
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-secondary-500 py-8">No application data available</p>
              )}
            </div>
            <div className="px-5 py-4 border-t border-secondary-100 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApplicationModal(false)}>Close</Button>
              {!isApproved && (
                <Button variant="primary" onClick={handleApprove} disabled={approvingApplication}>
                  {approvingApplication ? 'Approving...' : 'Approve'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Edit Button */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-secondary-200 bg-white/95 backdrop-blur-lg">
        <div className="px-4 py-3">
          <Link href={`/staff/${id}/edit`}>
            <Button variant="primary" size="lg" className="w-full">
              <PencilSquareIcon className="w-5 h-5 mr-1.5" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
