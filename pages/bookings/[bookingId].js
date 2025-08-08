import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import useStore from '@/lib/hooks/useStore';
import { 
  ArrowLeftIcon, 
  CalendarIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

export default function BookingDetail() {
  const router = useRouter();
  const { bookingId } = router.query;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const { staff = [], clients = [], shows = [] } = useStore();

  // Payment state (moved above early returns)
  const [isCharging, setIsCharging] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [chargeResponse, setChargeResponse] = useState(null);

  const formatCurrency = (cents) => {
    if (typeof cents !== 'number') return '--';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  const previewFinalCharge = async () => {
    setErrorMessage('');
    setPreviewData(null);
    setChargeResponse(null);
    setIsPreviewing(true);
    try {
      const response = await fetch('/api/charge-final-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, dryRun: true }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || 'Preview failed');
      }
      if (!json?.computed) {
        throw new Error('Invalid preview response from portal. Please verify COMPANION_BASE_URL, PORTAL_ORIGIN, and INTERNAL_ADMIN_API_KEY.');
      }
      setPreviewData(json);
      setIsPreviewOpen(true);
    } catch (err) {
      setErrorMessage(err.message || 'Request failed');
    } finally {
      setIsPreviewing(false);
    }
  };

  const chargeFinalPayment = async () => {
    setErrorMessage('');
    setIsConfirming(true);
    setChargeResponse(null);
    try {
      const response = await fetch('/api/charge-final-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, dryRun: false }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || 'Charge failed');
      }
      if (json?.requiresAction && json?.url) {
        try {
          window.open(json.url, '_blank', 'noopener,noreferrer');
        } catch (_) {
          // Fallback: assign if popup blocked
          window.location.href = json.url;
        }
      }
      setChargeResponse(json);
    } catch (err) {
      setErrorMessage(err.message || 'Request failed');
    } finally {
      setIsConfirming(false);
    }
  };

  const sortedDatesNeeded = useMemo(() => {
    if (!booking?.datesNeeded) return [];
    return [...booking.datesNeeded].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [booking]);

  const staffingSummary = useMemo(() => {
    if (!booking?.datesNeeded) return { needed: 0, assigned: 0, complete: false, progress: 0, dates: 0, days: 0 };
    
    // Only count dates where staffCount > 0
    const datesWithStaff = booking.datesNeeded.filter(d => (d.staffCount || 0) > 0);
    const dates = datesWithStaff.length;
    
    // Calculate total days (staff assignments)
    const days = datesWithStaff.reduce((total, date) => total + (date.staffCount || 0), 0);
    
    const totalStaffNeeded = booking.datesNeeded.reduce((total, date) => 
      total + (date.staffCount || 0), 0);
    
    const totalStaffAssigned = booking.datesNeeded.reduce((total, date) => 
      total + (date.staffIds?.filter(Boolean).length || 0), 0);
      
    return {
      needed: totalStaffNeeded,
      assigned: totalStaffAssigned,
      complete: totalStaffNeeded > 0 && totalStaffAssigned >= totalStaffNeeded,
      progress: totalStaffNeeded > 0 ? Math.round((totalStaffAssigned / totalStaffNeeded) * 100) : 0,
      dates,
      days
    };
  }, [booking]);

  const getStaffName = (id) => {
    const member = staff.find(s => s.id === id);
    if (!member) return '[Unknown Staff]';
    return member.firstName && member.lastName
      ? `${member.firstName} ${member.lastName}`
      : member.name || '[Unknown Staff]';
  };
  
  const client = useMemo(() => {
    if (!booking) return null;
    return clients.find(c => c.id === booking.clientId) || null;
  }, [booking, clients]);
  
  const show = useMemo(() => {
    if (!booking) return null;
    return shows.find(s => s.id === booking.showId) || null;
  }, [booking, shows]);

  useEffect(() => {
    if (!bookingId) return;
    async function fetchBooking() {
      const docRef = doc(db, 'bookings', bookingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBooking({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    }
    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!booking) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
            <ExclamationTriangleIcon className="w-20 h-20 mx-auto text-red-400 mb-6" />
            <h1 className="text-3xl font-bold text-secondary-900 mb-3">Booking Not Found</h1>
            <p className="text-secondary-600 text-lg mb-8">The booking you're looking for doesn't exist or has been removed.</p>
            <Link href="/bookings">
              <Button variant="primary" size="lg">Return to Bookings List</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusLabels = { 'confirmed': 'Confirmed', 'pending': 'Pending', 'cancelled': 'Cancelled' };
  const firstDate = sortedDatesNeeded.length > 0 ? new Date(sortedDatesNeeded[0].date) : null;
  const lastDate = sortedDatesNeeded.length > 0 ? new Date(sortedDatesNeeded[sortedDatesNeeded.length - 1].date) : null;
  
  const formatShortDate = (date) => {
    if (!date) return '--';
    const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return adjustedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusStyles = (status) => {
    switch(status) {
      case 'confirmed': return { badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircleIcon };
      case 'pending': return { badge: 'bg-amber-100 text-amber-700', icon: ClockIcon };
      case 'cancelled': return { badge: 'bg-red-100 text-red-700', icon: XMarkIcon };
      default: return { badge: 'bg-secondary-100 text-secondary-700', icon: ExclamationTriangleIcon };
    }
  };
  const currentStatusStyles = getStatusStyles(booking.status);
  const StatusIcon = currentStatusStyles.icon;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/bookings" className="mr-3">
              <Button variant="ghost" size="sm" className="p-2 text-secondary-600 hover:text-primary-600">
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-secondary-900">Booking Overview</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${currentStatusStyles.badge}`}>
              <StatusIcon className="w-4 h-4" />
              {statusLabels[booking.status] || booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </div>
            <Link href={`/bookings/${bookingId}/edit`}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <UserGroupIcon className="h-4 w-4" />
                Manage Staff
              </Button>
            </Link>
            {/* Final Payment Actions */}
            <Button
              variant="white"
              size="sm"
              disabled={isPreviewing}
              onClick={previewFinalCharge}
            >
              {isPreviewing ? 'Previewing…' : 'Preview Final Charge'}
            </Button>
          </div>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{errorMessage}</div>
        )}

        {/* Preview Modal */}
        {isPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => !isConfirming && setIsPreviewOpen(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 z-10">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Final Payment</h3>
              {previewData ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-600">Rate</span>
                    <span className="font-medium">{formatCurrency(previewData?.computed?.rateCents)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-600">Staff-days</span>
                    <span className="font-medium">{previewData?.computed?.staffDays ?? '--'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary-600">Total</span>
                    <span className="font-semibold text-secondary-900">{formatCurrency(previewData?.computed?.totalCents ?? previewData?.amountToChargeCents)}</span>
                  </div>
                  {chargeResponse && (
                    <pre className="text-[11px] bg-secondary-50 p-2 rounded border border-secondary-200 max-h-40 overflow-auto">{JSON.stringify(chargeResponse, null, 2)}</pre>
                  )}
                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="white" size="sm" disabled={isConfirming} onClick={() => setIsPreviewOpen(false)}>Cancel</Button>
                    <Button variant="gradient" size="sm" disabled={isConfirming} onClick={chargeFinalPayment}>
                      {isConfirming ? 'Charging…' : 'Charge Final Payment'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-secondary-600">No preview data available.</div>
              )}
            </div>
          </div>
        )}

        {/* Key Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-secondary-200">
          {/* Display results/errors if any */}
          {(chargeResponse || errorMessage) && (
            <div className="mb-4">
              {errorMessage && (
                <div className="mb-2 text-sm text-red-600">{errorMessage}</div>
              )}
              {chargeResponse && (
                <pre className="text-xs bg-secondary-50 p-3 rounded border border-secondary-200 overflow-auto max-h-48">
{JSON.stringify(chargeResponse, null, 2)}
                </pre>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-500">
                <BuildingOffice2Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-500 mb-1">Client</p>
                <p className="font-semibold text-secondary-900">{client?.name || 'Unknown'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-500 mb-1">Show</p>
                <p className="font-semibold text-secondary-900">{show?.name || 'Unknown'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-500 mb-1">Dates</p>
                <p className="font-semibold text-secondary-900">
                  {firstDate && lastDate ? 
                    (firstDate.getTime() === lastDate.getTime() ? 
                      formatShortDate(firstDate) : 
                      `${formatShortDate(firstDate)} - ${formatShortDate(lastDate)}`
                    ) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout with Fixed Heights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Overview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-secondary-200 h-[500px] flex flex-col">
              <div className="flex items-center mb-4 flex-shrink-0">
                <UserGroupIcon className="h-5 w-5 text-primary-500 mr-3" />
                <h3 className="text-lg font-semibold text-secondary-900">Staffing Summary</h3>
              </div>
              
              {/* Stacked Numbers */}
              <div className="space-y-3 mb-4 flex-grow">
                <div className="bg-primary-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-primary-600">{staffingSummary.dates}</p>
                  <p className="text-sm text-primary-500">Dates</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{staffingSummary.days}</p>
                  <p className="text-sm text-blue-500">Days</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">{staffingSummary.assigned}</p>
                  <p className="text-sm text-emerald-500">Assigned</p>
                </div>
              </div>
              
              <div className="mb-3 flex-shrink-0">
                <div className="flex justify-between text-sm font-medium text-secondary-700 mb-1">
                  <span>Overall Progress</span>
                  <span>{staffingSummary.progress}% ({staffingSummary.assigned}/{staffingSummary.needed})</span>
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${staffingSummary.complete ? 'bg-emerald-500' : 'bg-primary-500'}`}
                    style={{ width: `${staffingSummary.progress}%` }}
                  ></div>
                </div>
              </div>
              
              {staffingSummary.needed > 0 && !staffingSummary.complete && staffingSummary.assigned < staffingSummary.needed && (
                <p className="text-sm text-amber-600 flex items-center flex-shrink-0">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  Need {staffingSummary.needed - staffingSummary.assigned} more staff
                </p>
              )}
              {staffingSummary.needed > 0 && staffingSummary.complete && (
                <p className="text-sm text-emerald-600 flex items-center flex-shrink-0">
                  <CheckCircleIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  All positions filled
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Daily Schedule */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-secondary-200 h-[500px] flex flex-col">
              <div className="p-5 border-b border-secondary-200 bg-secondary-50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-primary-500 mr-3" />
                  <h3 className="text-lg font-semibold text-secondary-900">Daily Schedule</h3>
                </div>
                <span className="text-sm bg-primary-100 text-primary-700 font-medium px-3 py-1 rounded-full">
                  {staffingSummary.dates} Date{staffingSummary.dates !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex-1 overflow-hidden">
                {staffingSummary.dates > 0 ? (
                  <div className="divide-y divide-secondary-200 h-full overflow-y-auto">
                    {sortedDatesNeeded.filter(date => (date.staffCount || 0) > 0).map(({ date, staffCount, staffIds = [] }, i) => {
                      const assignedStaffForDate = staffIds.filter(Boolean);
                      const isDateFullyStaffed = assignedStaffForDate.length >= staffCount;
                      const dateObj = new Date(date);
                      const adjustedDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
                      const formattedDate = adjustedDate.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      });

                      return (
                        <div key={i} className="p-5 hover:bg-secondary-50 transition-colors duration-150">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-lg font-semibold text-primary-600">{formattedDate}</p>
                              <p className="text-sm text-secondary-500">
                                {staffCount} Staff Needed
                              </p>
                            </div>
                            <span className={`text-sm font-medium px-3 py-1 rounded-full flex items-center
                              ${isDateFullyStaffed
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {isDateFullyStaffed ? 
                                <CheckCircleIcon className="w-4 h-4 mr-1" /> : 
                                <ClockIcon className="w-4 h-4 mr-1" />
                              }
                              {assignedStaffForDate.length}/{staffCount}
                            </span>
                          </div>
                          
                          {staffCount > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {Array.from({ length: staffCount }).map((_, slotIndex) => {
                                const staffId = staffIds[slotIndex];
                                return (
                                  <div key={slotIndex} 
                                       className={`p-3 rounded-lg border
                                                  ${staffId ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                                    <div className="flex items-center">
                                      <UserGroupIcon className={`w-4 h-4 mr-2 flex-shrink-0 ${staffId ? 'text-emerald-600' : 'text-amber-600'}`} />
                                      {staffId ? (
                                        <span className="font-medium text-secondary-800 truncate">{getStaffName(staffId)}</span>
                                      ) : (
                                        <span className="text-amber-700 italic">Open</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-10 text-center flex-1 flex flex-col items-center justify-center">
                    <CalendarIcon className="w-16 h-16 text-secondary-300 mb-4" />
                    <p className="text-xl font-semibold text-secondary-700 mb-2">No Staffing Dates</p>
                    <p className="text-sm text-secondary-500 mb-6">There are no dates that require staff yet.</p>
                    <Link href={`/bookings/${bookingId}/edit`}>
                      <Button variant="primary" size="sm">
                          <UserGroupIcon className="h-4 w-4 mr-1.5" /> Add Staff
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section - Full Width */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-secondary-200">
          <div className="flex items-center mb-4">
            <PencilSquareIcon className="h-5 w-5 text-primary-500 mr-3" />
            <h3 className="text-lg font-semibold text-secondary-900">Notes</h3>
          </div>
          <div className="bg-secondary-50 p-4 rounded-lg min-h-[80px]">
            {booking.notes ? (
              <p className="text-secondary-700 whitespace-pre-wrap text-sm leading-relaxed">{booking.notes}</p>
            ) : (
              <p className="text-secondary-500 italic text-sm">No notes have been added for this booking.</p>
            )}
          </div>
        </div>
        
        <div className="h-16"></div>
      </div>
    </DashboardLayout>
  );
}
