import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import useStore from '@/lib/hooks/useStore';
import { 
  ArrowLeftIcon, 
  CalendarDaysIcon,
  CreditCardIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  PencilSquareIcon,
  SparklesIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid, UserIcon } from '@heroicons/react/24/solid';
import StaffAvailabilityModal from '@/components/bookings/StaffAvailabilityModal';

export default function BookingDetail() {
  const router = useRouter();
  const { bookingId } = router.query;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const { staff = [], clients = [], shows = [], bookings = [], availability = [], fetchBookings } = useStore();

  // Payment state
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [chargeResponse, setChargeResponse] = useState(null);
  const [editedTotalCents, setEditedTotalCents] = useState(null);

  // Staff selection modal state
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null); // { date, slotIndex }
  const [isSavingStaff, setIsSavingStaff] = useState(false);

  // Remove staff confirmation modal state
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [staffToRemove, setStaffToRemove] = useState(null); // { date, slotIndex, staffId, staffName }

  // Staff availability overview modal
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);

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
        body: JSON.stringify({ bookingId, dryRun: true, debug: true }),
      });
      const json = await response.json();
      if (!response.ok) {
        if (json?.debug) console.error('charge-final preview debug:', json.debug);
        throw new Error(json?.error || 'Preview failed');
      }
      if (!json?.computed) {
        throw new Error('Invalid preview response from portal.');
      }
      setPreviewData(json);
      setEditedTotalCents(
        typeof json?.computed?.totalCents === 'number'
          ? json.computed.totalCents
          : (typeof json?.amountToChargeCents === 'number' ? json.amountToChargeCents : 0)
      );
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
        body: JSON.stringify({ bookingId, dryRun: false, debug: true, overrideAmountCents: editedTotalCents }),
      });
      const json = await response.json();
      if (!response.ok) {
        if (json?.debug) console.error('charge-final charge debug:', json.debug);
        throw new Error(json?.error || 'Charge failed');
      }
      if (json?.requiresAction && json?.url) {
        try {
          window.open(json.url, '_blank', 'noopener,noreferrer');
        } catch (_) {
          window.location.href = json.url;
        }
      }
      if (json?.success === true) {
        // Update Firestore directly from admin to ensure persistence
        // Note: paymentStatus tracks payment state, status tracks booking workflow state
        try {
          const docRef = doc(db, 'bookings', bookingId);
          await updateDoc(docRef, {
            paymentStatus: 'final_paid',
            finalChargeCents: editedTotalCents,
            finalChargePaymentIntentId: json.paymentIntentId || null,
            updatedAt: new Date().toISOString(),
          });
        } catch (updateErr) {
          console.error('Error updating payment status in Firestore:', updateErr);
        }
        setBooking(prev => (prev ? { ...prev, paymentStatus: 'final_paid' } : prev));
        setIsPreviewOpen(false);
        // Refresh bookings in store
        if (fetchBookings) fetchBookings();
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
    
    const datesWithStaff = booking.datesNeeded.filter(d => (d.staffCount || 0) > 0);
    const dates = datesWithStaff.length;
    const days = datesWithStaff.reduce((total, date) => total + (date.staffCount || 0), 0);
    const totalStaffNeeded = booking.datesNeeded.reduce((total, date) => total + (date.staffCount || 0), 0);
    const totalStaffAssigned = booking.datesNeeded.reduce((total, date) => total + (date.staffIds?.filter(Boolean).length || 0), 0);
      
    return {
      needed: totalStaffNeeded,
      assigned: totalStaffAssigned,
      complete: totalStaffNeeded > 0 && totalStaffAssigned >= totalStaffNeeded,
      progress: totalStaffNeeded > 0 ? Math.round((totalStaffAssigned / totalStaffNeeded) * 100) : 0,
      dates,
      days
    };
  }, [booking]);

  // Build a map of all booked staff by date (for all bookings including current)
  const bookedStaffByDate = useMemo(() => {
    const map = {};
    (bookings || [])
      .filter(b => b.showId === booking?.showId)
      .forEach(b => {
        if (Array.isArray(b.datesNeeded)) {
          b.datesNeeded.forEach(dn => {
            if (!map[dn.date]) map[dn.date] = [];
            if (Array.isArray(dn.staffIds)) {
              dn.staffIds.forEach(sid => {
                if (sid && !map[dn.date].includes(sid)) {
                  map[dn.date].push(sid);
                }
              });
            }
          });
        }
      });
    // Also include current booking's local state (in case store hasn't refreshed yet)
    if (booking?.datesNeeded) {
      booking.datesNeeded.forEach(dn => {
        if (!map[dn.date]) map[dn.date] = [];
        if (Array.isArray(dn.staffIds)) {
          dn.staffIds.forEach(sid => {
            if (sid && !map[dn.date].includes(sid)) {
              map[dn.date].push(sid);
            }
          });
        }
      });
    }
    return map;
  }, [bookings, booking]);

  // Get available staff for a specific date
  const getAvailableStaffForDate = (date, currentStaffIndex = null) => {
    if (!Array.isArray(staff) || staff.length === 0) return [];
    if (!Array.isArray(availability)) return [];
    
    const showAvail = availability.filter(a => a.showId === booking?.showId);
    
    // Get staff booked on this specific date (excluding current slot being filled)
    const bookedStaffIds = [
      ...(bookings || [])
        .filter(b => b.showId === booking?.showId && b.id !== booking?.id && Array.isArray(b.datesNeeded) && b.datesNeeded.some(dn => dn.date === date))
        .flatMap(b => (b.datesNeeded || []).filter(dn => dn.date === date).flatMap(dn => Array.isArray(dn.staffIds) ? dn.staffIds : [])),
      ...((booking?.datesNeeded?.find(d => d.date === date)?.staffIds || []).filter((_, i) => i !== currentStaffIndex)),
    ].filter(Boolean);
    
    return staff.filter(member => {
      const record = showAvail.find(a => a.staffId === member.id);
      const isAvailable = record && Array.isArray(record.availableDates) && record.availableDates.includes(date);
      const isBooked = bookedStaffIds.includes(member.id);
      return isAvailable && !isBooked;
    }).map(member => {
      // Get this staff member's available dates for this show
      const record = showAvail.find(a => a.staffId === member.id);
      const staffAvailableDates = record?.availableDates || [];
      
      // Compute unavailable dates (dates NOT marked available OR already booked)
      const unavailableDates = showDateRange.filter(d => {
        const notMarkedAvailable = !staffAvailableDates.includes(d);
        const isBookedOnDate = bookedStaffByDate[d]?.includes(member.id) || false;
        return notMarkedAvailable || isBookedOnDate;
      });
      
      // Count booked days separately for display
      const bookedDates = showDateRange.filter(d => 
        staffAvailableDates.includes(d) && bookedStaffByDate[d]?.includes(member.id)
      );
      
      const isAllDays = unavailableDates.length === 0;
      
      return {
        ...member,
        displayName: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || '[NO NAME]',
        availableDates: staffAvailableDates,
        unavailableDates,
        bookedDates,
        isAllDays
      };
    });
  };

  // Helper to check if booking is fully staffed
  const isBookingFullyStaffed = (datesNeeded) => {
    if (!Array.isArray(datesNeeded)) return false;
    const totalNeeded = datesNeeded.reduce((sum, d) => sum + (d.staffCount || 0), 0);
    const totalAssigned = datesNeeded.reduce((sum, d) => sum + (d.staffIds?.filter(Boolean).length || 0), 0);
    return totalNeeded > 0 && totalAssigned >= totalNeeded;
  };

  // Handle staff selection from modal
  const handleStaffSelect = async (staffId) => {
    if (!selectedSlot || !booking) return;
    
    setIsSavingStaff(true);
    try {
      const updatedDatesNeeded = [...booking.datesNeeded];
      const dateIndex = updatedDatesNeeded.findIndex(d => d.date === selectedSlot.date);
      
      if (dateIndex >= 0) {
        if (!updatedDatesNeeded[dateIndex].staffIds) {
          updatedDatesNeeded[dateIndex].staffIds = [];
        }
        // Remove this staff from other slots on same date if assigned
        updatedDatesNeeded[dateIndex].staffIds = updatedDatesNeeded[dateIndex].staffIds.map((sid, idx) =>
          idx !== selectedSlot.slotIndex && sid === staffId ? '' : sid
        );
        updatedDatesNeeded[dateIndex].staffIds[selectedSlot.slotIndex] = staffId;
      }

      // Check if booking is now fully staffed
      const isNowFullyStaffed = isBookingFullyStaffed(updatedDatesNeeded);
      const newStatus = isNowFullyStaffed ? 'booked' : booking.status;

      // Update Firestore
      const docRef = doc(db, 'bookings', bookingId);
      await updateDoc(docRef, { 
        datesNeeded: updatedDatesNeeded,
        ...(isNowFullyStaffed && booking.status === 'pending' ? { status: 'booked' } : {}),
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state
      setBooking(prev => ({ 
        ...prev, 
        datesNeeded: updatedDatesNeeded,
        ...(isNowFullyStaffed && prev.status === 'pending' ? { status: 'booked' } : {}),
      }));
      
      // Refresh bookings in store
      if (fetchBookings) fetchBookings();
      
      setStaffModalOpen(false);
      setSelectedSlot(null);
    } catch (err) {
      console.error('Failed to assign staff:', err);
      setErrorMessage('Failed to assign staff. Please try again.');
    } finally {
      setIsSavingStaff(false);
    }
  };

  // Handle staff removal
  const handleStaffRemove = async () => {
    if (!staffToRemove || !booking) return;
    
    setIsSavingStaff(true);
    try {
      const updatedDatesNeeded = [...booking.datesNeeded];
      const dateIndex = updatedDatesNeeded.findIndex(d => d.date === staffToRemove.date);
      
      if (dateIndex >= 0 && updatedDatesNeeded[dateIndex].staffIds) {
        // Set the slot to empty string to remove staff
        updatedDatesNeeded[dateIndex].staffIds[staffToRemove.slotIndex] = '';
      }

      // Check if booking is no longer fully staffed
      const isStillFullyStaffed = isBookingFullyStaffed(updatedDatesNeeded);
      const shouldRevertToPending = !isStillFullyStaffed && booking.status === 'booked';

      // Update Firestore
      const docRef = doc(db, 'bookings', bookingId);
      await updateDoc(docRef, { 
        datesNeeded: updatedDatesNeeded,
        ...(shouldRevertToPending ? { status: 'pending' } : {}),
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state
      setBooking(prev => ({ 
        ...prev, 
        datesNeeded: updatedDatesNeeded,
        ...(shouldRevertToPending ? { status: 'pending' } : {}),
      }));
      
      // Refresh bookings in store
      if (fetchBookings) fetchBookings();
      
      setRemoveModalOpen(false);
      setStaffToRemove(null);
    } catch (err) {
      console.error('Failed to remove staff:', err);
      setErrorMessage('Failed to remove staff. Please try again.');
    } finally {
      setIsSavingStaff(false);
    }
  };

  const getStaffMember = (id) => {
    return staff.find(s => s.id === id) || null;
  };

  const getStaffName = (id) => {
    const member = getStaffMember(id);
    if (!member) return 'Unknown';
    return member.firstName && member.lastName
      ? `${member.firstName} ${member.lastName}`
      : member.name || 'Unknown';
  };

  const getStaffInitials = (id) => {
    const member = getStaffMember(id);
    if (!member) return '?';
    if (member.firstName && member.lastName) {
      return `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();
    }
    return member.name ? member.name[0].toUpperCase() : '?';
  };
  
  const client = useMemo(() => {
    if (!booking) return null;
    return clients.find(c => c.id === booking.clientId) || null;
  }, [booking, clients]);
  
  const show = useMemo(() => {
    if (!booking) return null;
    return shows.find(s => s.id === booking.showId) || null;
  }, [booking, shows]);

  // Get show date range
  const showDateRange = useMemo(() => {
    if (!show?.startDate || !show?.endDate) return [];
    const start = new Date(show.startDate);
    const end = new Date(show.endDate);
    const range = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      range.push(d.toISOString().split('T')[0]);
    }
    return range;
  }, [show]);

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
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!booking) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto py-20 px-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-semibold text-secondary-900 mb-2">Booking Not Found</h1>
            <p className="text-secondary-500 mb-6">This booking doesn't exist or has been removed.</p>
            <Link href="/bookings">
              <Button variant="primary">Back to Bookings</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusConfig = {
    pending: { label: 'Pending', bg: 'bg-amber-500', text: 'text-white' },
    booked: { label: 'Booked', bg: 'bg-emerald-500', text: 'text-white' },
    confirmed: { label: 'Confirmed', bg: 'bg-violet-500', text: 'text-white' },
    cancelled: { label: 'Cancelled', bg: 'bg-red-500', text: 'text-white' },
  };

  // Booking status (workflow state)
  const currentStatus = statusConfig[booking.status] || { label: booking.status, bg: 'bg-secondary-500', text: 'text-white' };
  
  // Payment status config
  const paymentStatusConfig = {
    deposit_paid: { label: 'Deposit Paid', bg: 'bg-blue-500', text: 'text-white' },
    final_paid: { label: 'Paid in Full', bg: 'bg-emerald-500', text: 'text-white' },
  };
  const currentPaymentStatus = paymentStatusConfig[booking.paymentStatus] || null;

  const firstDate = sortedDatesNeeded.length > 0 ? new Date(sortedDatesNeeded[0].date) : null;
  const lastDate = sortedDatesNeeded.length > 0 ? new Date(sortedDatesNeeded[sortedDatesNeeded.length - 1].date) : null;
  
  const formatDateRange = () => {
    if (!firstDate || !lastDate) return 'No dates';
    const adjustFirst = new Date(firstDate.getTime() + firstDate.getTimezoneOffset() * 60000);
    const adjustLast = new Date(lastDate.getTime() + lastDate.getTimezoneOffset() * 60000);
    
    const options = { month: 'short', day: 'numeric' };
    if (adjustFirst.getTime() === adjustLast.getTime()) {
      return adjustFirst.toLocaleDateString('en-US', { ...options, year: 'numeric' });
    }
    return `${adjustFirst.toLocaleDateString('en-US', options)} - ${adjustLast.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
  };

  // Get available staff for modal
  const availableStaffForModal = selectedSlot 
    ? getAvailableStaffForDate(selectedSlot.date, selectedSlot.slotIndex)
    : [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-2 pb-6">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/bookings" className="p-1.5 rounded-lg hover:bg-secondary-100 transition-colors">
              <ArrowLeftIcon className="h-5 w-5 text-secondary-500" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-secondary-900">{client?.name || 'Unknown Client'}</h1>
                <span className={`${currentStatus.bg} ${currentStatus.text} text-xs font-semibold px-2 py-0.5 rounded-full`}>
                  {currentStatus.label}
                </span>
                {currentPaymentStatus && (
                  <span className={`${currentPaymentStatus.bg} ${currentPaymentStatus.text} text-xs font-semibold px-2 py-0.5 rounded-full`}>
                    {currentPaymentStatus.label}
                  </span>
                )}
              </div>
              <p className="text-sm text-secondary-500">{show?.name || 'Unknown Show'} • {formatDateRange()}</p>
            </div>
          </div>
          
          <div className="hidden sm:flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAvailabilityModalOpen(true)}
            >
              <CalendarDaysIcon className="h-4 w-4 mr-1.5" />
              Staff Availability
            </Button>
            {booking.paymentStatus !== 'final_paid' && (
              <Button
                variant="primary"
                size="sm"
                disabled={isPreviewing}
                onClick={previewFinalCharge}
              >
                <CreditCardIcon className="h-4 w-4 mr-1.5" />
                {isPreviewing ? 'Loading...' : 'Charge'}
              </Button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            {errorMessage}
            <button onClick={() => setErrorMessage('')} className="ml-auto">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats + Progress */}
        <div className="bg-white rounded-xl border border-secondary-200 shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-2xl font-bold text-secondary-900">{staffingSummary.dates}</span>
                <span className="text-sm text-secondary-500 ml-1.5">dates</span>
              </div>
              <div className="h-8 w-px bg-secondary-200"></div>
              <div>
                <span className="text-2xl font-bold text-secondary-900">{staffingSummary.needed}</span>
                <span className="text-sm text-secondary-500 ml-1.5">days needed</span>
              </div>
              <div className="h-8 w-px bg-secondary-200"></div>
              <div>
                <span className={`text-2xl font-bold ${staffingSummary.complete ? 'text-emerald-600' : 'text-secondary-900'}`}>{staffingSummary.assigned}</span>
                <span className="text-sm text-secondary-500 ml-1.5">filled</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {staffingSummary.complete ? (
                <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                  <CheckCircleSolid className="w-5 h-5" />
                  Complete
                </span>
              ) : (
                <span className="text-amber-600 text-sm font-medium">
                  {staffingSummary.needed - staffingSummary.assigned} open
                </span>
              )}
            </div>
          </div>
          <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                staffingSummary.complete ? 'bg-emerald-500' : 'bg-primary-500'
              }`}
              style={{ width: `${staffingSummary.progress}%` }}
            />
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-secondary-100 bg-secondary-50/50">
            <h2 className="font-semibold text-secondary-900">Schedule</h2>
          </div>
          
          {staffingSummary.dates > 0 ? (
            <div className="divide-y divide-secondary-100">
              {sortedDatesNeeded.filter(date => (date.staffCount || 0) > 0).map(({ date, staffCount, staffIds = [] }, i) => {
                const assignedStaffForDate = staffIds.filter(Boolean);
                const isDateFullyStaffed = assignedStaffForDate.length >= staffCount;
                const dateObj = new Date(date);
                const adjustedDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
                const dayName = adjustedDate.toLocaleDateString('en-US', { weekday: 'short' });
                const openSlots = staffCount - assignedStaffForDate.length;

                return (
                  <div key={i} className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Date */}
                      <div className="flex-shrink-0 w-12 text-center">
                        <div className="text-[10px] font-medium text-secondary-400 uppercase">{dayName}</div>
                        <div className="text-xl font-bold text-secondary-900">{adjustedDate.getDate()}</div>
                      </div>
                      
                      {/* Staff */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            isDateFullyStaffed 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {assignedStaffForDate.length}/{staffCount}
                          </span>
                          {!isDateFullyStaffed && (
                            <span className="text-xs text-secondary-400">{openSlots} open</span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {Array.from({ length: staffCount }).map((_, slotIndex) => {
                            const staffId = staffIds[slotIndex];
                            
                            return staffId ? (
                              <button 
                                key={slotIndex} 
                                onClick={() => {
                                  setStaffToRemove({ 
                                    date, 
                                    slotIndex, 
                                    staffId, 
                                    staffName: getStaffName(staffId) 
                                  });
                                  setRemoveModalOpen(true);
                                }}
                                className="group flex items-center gap-2 bg-secondary-50 hover:bg-red-50 rounded-lg px-3 py-2 transition-colors border border-secondary-200 hover:border-red-200"
                              >
                                {(() => {
                                  const member = getStaffMember(staffId);
                                  const image = member?.image || member?.photoURL || member?.photoUrl || member?.picture;
                                  return image ? (
                                    <img src={image} alt="" className="w-7 h-7 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 group-hover:from-red-500 group-hover:to-red-600 flex items-center justify-center text-white text-xs font-semibold transition-all">
                                      {getStaffInitials(staffId)}
                                    </div>
                                  );
                                })()}
                                <span className="text-sm font-medium text-secondary-700 group-hover:text-red-700 transition-colors">
                                  {getStaffName(staffId)}
                                </span>
                              </button>
                            ) : (
                              <button 
                                key={slotIndex}
                                onClick={() => {
                                  setSelectedSlot({ date, slotIndex });
                                  setStaffModalOpen(true);
                                }}
                                className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 rounded-lg px-3 py-2 border border-dashed border-amber-300 transition-colors cursor-pointer group"
                              >
                                <div className="w-7 h-7 rounded-full bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
                                  <PlusIcon className="w-4 h-4 text-amber-600" />
                                </div>
                                <span className="text-sm text-amber-700 font-medium">Add Staff</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <CalendarDaysIcon className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
              <p className="text-secondary-600 font-medium mb-1">No Schedule Set</p>
              <p className="text-secondary-400 text-sm mb-4">Add dates and staff requirements</p>
              <Link href={`/bookings/${bookingId}/edit`}>
                <Button variant="primary" size="sm">Add Requirements</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="bg-white rounded-xl border border-secondary-200 shadow-sm p-4 mb-4">
            <h3 className="font-semibold text-secondary-900 mb-2 text-sm">Notes</h3>
            <p className="text-secondary-600 text-sm whitespace-pre-wrap">{booking.notes}</p>
          </div>
        )}

        {/* Staff Selection Modal */}
        {staffModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-secondary-900/50 backdrop-blur-sm" onClick={() => !isSavingStaff && setStaffModalOpen(false)}></div>
            <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl z-10 max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-secondary-100 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-secondary-900">Select Staff</h3>
                  {selectedSlot && (
                    <p className="text-sm text-secondary-500">
                      {(() => {
                        const dateObj = new Date(selectedSlot.date);
                        const adjustedDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
                        return adjustedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                      })()}
                    </p>
                  )}
                </div>
                <button 
                  onClick={() => setStaffModalOpen(false)}
                  className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                  disabled={isSavingStaff}
                >
                  <XMarkIcon className="w-5 h-5 text-secondary-500" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                {availableStaffForModal.length > 0 ? (
                  <div className="space-y-1">
                    {availableStaffForModal.map(member => (
                      <button
                        key={member.id}
                        onClick={() => handleStaffSelect(member.id)}
                        disabled={isSavingStaff}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary-50 transition-colors text-left disabled:opacity-50"
                      >
                        {member.image || member.photoURL || member.photoUrl || member.picture ? (
                          <img 
                            src={member.image || member.photoURL || member.photoUrl || member.picture} 
                            alt="" 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                            {member.firstName && member.lastName 
                              ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
                              : member.name ? member.name[0].toUpperCase() : '?'
                            }
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-secondary-900">{member.displayName}</p>
                          {member.isAllDays ? (
                            <p className="text-xs text-emerald-600">Available all days</p>
                          ) : (
                            <p className="text-xs text-secondary-500">
                              Unavailable: {member.unavailableDates.map(d => {
                                const dateObj = new Date(d);
                                const adjusted = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
                                return `${adjusted.getMonth() + 1}/${adjusted.getDate()}`;
                              }).join(', ')}
                            </p>
                          )}
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 ${member.isAllDays ? 'border-emerald-400' : 'border-secondary-300'}`}></div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <UserGroupIcon className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                    <p className="text-secondary-600 font-medium">No Available Staff</p>
                    <p className="text-secondary-400 text-sm mt-1">No one has marked themselves available for this date</p>
                  </div>
                )}
              </div>
              
              {isSavingStaff && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Staff Availability Modal */}
        <StaffAvailabilityModal
          isOpen={availabilityModalOpen}
          onClose={() => setAvailabilityModalOpen(false)}
          showId={booking?.showId}
          showName={show?.name || 'Show'}
          availability={availability}
          staff={staff}
          bookings={bookings}
          currentBookingId={bookingId}
          showDateRange={showDateRange}
          clientId={booking?.clientId}
        />

        {/* Remove Staff Confirmation Modal */}
        {removeModalOpen && staffToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-secondary-900/50 backdrop-blur-sm" onClick={() => !isSavingStaff && setRemoveModalOpen(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden">
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">Remove Staff?</h3>
                <p className="text-secondary-500 text-sm mb-1">
                  Remove <span className="font-medium text-secondary-700">{staffToRemove.staffName}</span> from this date?
                </p>
                <p className="text-secondary-400 text-xs mb-6">
                  {(() => {
                    const dateObj = new Date(staffToRemove.date);
                    const adjustedDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
                    return adjustedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                  })()}
                </p>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => {
                      setRemoveModalOpen(false);
                      setStaffToRemove(null);
                    }}
                    disabled={isSavingStaff}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    className="flex-1 !bg-red-600 hover:!bg-red-700" 
                    onClick={handleStaffRemove}
                    disabled={isSavingStaff}
                  >
                    {isSavingStaff ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
              </div>
              {isSavingStaff && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Charge Preview Modal */}
        {isPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm" onClick={() => !isConfirming && setIsPreviewOpen(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
              <div className="p-5 border-b border-secondary-100">
                <h3 className="text-lg font-semibold text-secondary-900">Final Charge</h3>
                <p className="text-sm text-secondary-500">Review and confirm payment</p>
              </div>
              {previewData ? (
                <div className="p-5">
                  <div className="bg-secondary-50 rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xs text-secondary-500 mb-1">Rate</div>
                        <div className="text-sm font-semibold">{formatCurrency(previewData?.computed?.rateCents)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-secondary-500 mb-1">Days</div>
                        <div className="text-sm font-semibold">{previewData?.computed?.staffDays ?? '--'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-secondary-500 mb-1">Subtotal</div>
                        <div className="text-sm font-semibold">{formatCurrency(previewData?.computed?.totalCents ?? previewData?.amountToChargeCents)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Final Amount</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-secondary-400 font-medium">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={isConfirming}
                        className="pl-8 pr-4 py-3 w-full rounded-xl border border-secondary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-semibold"
                        value={typeof editedTotalCents === 'number' ? (editedTotalCents / 100).toFixed(2) : ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          const num = parseFloat(v);
                          if (Number.isFinite(num) && num >= 0) {
                            setEditedTotalCents(Math.round(num * 100));
                          } else if (v === '') {
                            setEditedTotalCents(0);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {chargeResponse && (
                    <pre className="text-xs bg-secondary-50 p-3 rounded-lg border max-h-32 overflow-auto mb-4 font-mono">
                      {JSON.stringify(chargeResponse, null, 2)}
                    </pre>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" disabled={isConfirming} onClick={() => setIsPreviewOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" className="flex-1" disabled={isConfirming} onClick={chargeFinalPayment}>
                      {isConfirming ? 'Processing...' : 'Charge Now'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-secondary-500">No preview data</div>
              )}
            </div>
          </div>
        )}
        
        {/* Mobile sticky bar */}
        <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-secondary-200 bg-white/95 backdrop-blur-lg">
          <div className="px-4 py-3 flex gap-3">
            <Button 
              variant="outline" 
              size="lg" 
              className="flex-1"
              onClick={() => setAvailabilityModalOpen(true)}
            >
              <CalendarDaysIcon className="h-5 w-5 mr-1.5" />
              Availability
            </Button>
            {booking.paymentStatus !== 'final_paid' && (
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                disabled={isPreviewing}
                onClick={previewFinalCharge}
              >
                <CreditCardIcon className="h-5 w-5 mr-1.5" />
                Charge
              </Button>
            )}
          </div>
        </div>

        <div className="h-20 sm:h-4"></div>
      </div>
    </DashboardLayout>
  );
}
