import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import StaffAvailabilityModal from '@/components/bookings/StaffAvailabilityModal';
import { useAdminLogger } from '@/components/LoggingWrapper';

export default function StaffAssignment() {
  const router = useRouter();
  const { bookingId } = router.query;
  const { bookings, clients, shows, updateBooking, staff, availability, getBookingsForStaff, deleteBooking } = useStore();
  const { logUpdate, logDelete } = useAdminLogger();
  const [formData, setFormData] = useState(null);
  const [showDateRange, setShowDateRange] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setFormData({ ...booking });
      const show = shows.find(s => s.id === booking.showId);
      if (show && show.startDate && show.endDate) {
        const start = new Date(show.startDate);
        const end = new Date(show.endDate);
        const range = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          range.push(d.toISOString().split('T')[0]);
        }
        setShowDateRange(range);
      }
    }
    setLoading(false);
  }, [bookingId, bookings, shows]);

  const getAvailableStaffForDate = (date, currentStaffIndex = null) => {
    if (!Array.isArray(staff) || staff.length === 0) return [];
    if (!Array.isArray(availability)) return [];
    const showAvail = availability.filter(a => a.showId === formData.showId);
    const bookedStaffIds = [
      ...(bookings || [])
        .filter(b => b.showId === formData.showId && b.id !== formData.id && Array.isArray(b.datesNeeded) && b.datesNeeded.some(dn => dn.date === date))
        .flatMap(b => (b.datesNeeded || []).filter(dn => dn.date === date).flatMap(dn => Array.isArray(dn.staffIds) ? dn.staffIds : [])),
      ...((formData.datesNeeded.find(d => d.date === date)?.staffIds || []).filter((_, i) => i !== currentStaffIndex)),
    ].filter(Boolean);
    
    return staff.filter(member => {
      const record = showAvail.find(a => a.staffId === member.id);
      const isAvailable = record && Array.isArray(record.availableDates) && record.availableDates.includes(date);
      const isBooked = bookedStaffIds.includes(member.id);
      return isAvailable && !isBooked;
    }).map(member => ({
      ...member,
      name: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || '[NO NAME]'
    }));
  };

  const handleStaffSelectChange = (date, staffId, staffIndex) => {
    const updatedDatesNeeded = [...formData.datesNeeded];
    const dateIndex = updatedDatesNeeded.findIndex(d => d.date === date);
    if (dateIndex >= 0) {
      if (!updatedDatesNeeded[dateIndex].staffIds) {
        updatedDatesNeeded[dateIndex].staffIds = [];
      }
      updatedDatesNeeded[dateIndex].staffIds = updatedDatesNeeded[dateIndex].staffIds.map((sid, idx) =>
        idx !== staffIndex && sid === staffId ? '' : sid
      );
      updatedDatesNeeded[dateIndex].staffIds[staffIndex] = staffId;
    }
    setFormData({ ...formData, datesNeeded: updatedDatesNeeded });
  };

  // Always show dates in true chronological order based on show date range, not selection order
  const sortedDatesNeeded = useMemo(() => {
    if (!formData || !Array.isArray(formData.datesNeeded)) return [];
    // Create a lookup for selected dates
    const selectedMap = {};
    (formData.datesNeeded || []).forEach(d => {
      if (d && d.date) selectedMap[d.date] = d;
    });
    // Sort dates according to showDateRange order
    return (showDateRange || [])
      .filter(date => selectedMap[date])
      .map(date => selectedMap[date]);
  }, [formData?.datesNeeded, showDateRange]);

  // Calculate staff requirements summary - FIXED: Only count dates that need staff
  const staffRequirementsSummary = useMemo(() => {
    if (!sortedDatesNeeded.length) return { total: 0, assigned: 0, complete: false, dates: 0 };
    
    // Only count dates where staffCount > 0
    const datesWithStaff = sortedDatesNeeded.filter(date => (date.staffCount || 0) > 0);
    const dates = datesWithStaff.length;
    
    const total = datesWithStaff.reduce((sum, date) => sum + (date.staffCount || 0), 0);
    const assigned = datesWithStaff.reduce((sum, date) => {
      return sum + (date.staffIds?.filter(Boolean).length || 0);
    }, 0);
    
    return {
      total,
      assigned,
      complete: assigned >= total,
      dates
    };
  }, [sortedDatesNeeded]);

  // Get staff member name from ID
  const getStaffName = (staffId) => {
    if (!staffId) return '';
    const member = staff.find(s => s.id === staffId);
    if (!member) return '';
    return member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim();
  };

  const handleStatusToggle = () => {
    const newStatus = formData.status === 'pending' ? 'confirmed' : 'pending';
    setFormData({ ...formData, status: newStatus });
  };

  const getStatusStyles = (status) => {
    switch(status) {
      case 'confirmed': return { 
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
        icon: CheckCircleIcon,
        toggle: 'bg-emerald-500'
      };
      case 'pending': default: return { 
        badge: 'bg-amber-100 text-amber-700 border-amber-200', 
        icon: ClockIcon,
        toggle: 'bg-secondary-300'
      };
    }
  };

  if (loading || !formData) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Get the selected client and show for display
  const selectedClient = clients.find(c => c.id === formData.clientId);
  const selectedShow = shows.find(s => s.id === formData.showId);
  const currentStatusStyles = getStatusStyles(formData.status);
  const StatusIcon = currentStatusStyles.icon;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href={`/bookings/${bookingId}`} className="mr-3">
              <Button variant="ghost" size="sm" className="p-2 text-secondary-600 hover:text-primary-600">
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-secondary-900">Staff Assignment</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center"
              onClick={() => setIsStaffModalOpen(true)}
            >
              <EyeIcon className="h-4 w-4 mr-1.5" />
              Staff Availability
            </Button>
            <Button
              type="submit"
              form="staff-form"
              variant="primary"
              size="sm"
              disabled={saving}
              className="hidden sm:inline-flex items-center"
            >
              {saving ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1.5" />
              ) : (
                <CheckCircleIcon className="h-4 w-4 mr-1.5" />
              )}
              Save
            </Button>
          </div>
        </div>


        <form id="staff-form" onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          try {
            await updateBooking(bookingId, { ...formData });
            
            // Log the booking update
            await logUpdate('booking', bookingId, {
              clientName: clients.find(c => c.id === formData?.clientId)?.name || 'Unknown',
              showName: shows.find(s => s.id === formData?.showId)?.name || 'Unknown',
              changes: 'Staff assignments updated'
            });
            
            router.push(`/bookings/${bookingId}`);
          } catch (err) {
            console.error('Failed to update staff assignments:', err);
            setSaving(false);
            alert('Failed to update staff assignments. Please try again.');
          }
        }}>
        
        {/* Staff Assignment */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-secondary-200 mb-6">
          {/* Make panel taller and scroll inside */}
          <style jsx>{`
            @media (max-width: 639px) {
              .assign-staff-panel { height: calc(100vh - 260px); }
            }
          `}</style>
          <div className="assign-staff-panel h-[calc(100vh-260px)] flex flex-col">
            <div className="p-4 border-b border-secondary-200 bg-secondary-50 flex items-center justify-between">
              <div className="flex items-center">
                <UserGroupIcon className="h-5 w-5 text-primary-600 mr-3" />
                <h3 className="font-semibold text-secondary-900">Assign Staff</h3>
              </div>
              <span className="text-sm bg-primary-100 text-primary-800 px-3 py-1 rounded-full">
                {staffRequirementsSummary.dates} date{staffRequirementsSummary.dates !== 1 ? 's' : ''}
              </span>
            </div>
            
            {sortedDatesNeeded.filter(date => (date.staffCount || 0) > 0).length > 0 ? (
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="space-y-4">
                  {sortedDatesNeeded.filter(date => (date.staffCount || 0) > 0).map(({ date, staffCount = 1, staffIds = [] }) => {
                    const assignedCount = staffIds.filter(Boolean).length;
                    const isComplete = assignedCount >= staffCount;
                    
                    return (
                      <div key={date} className={`${isComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-secondary-50 border-secondary-200'} rounded-lg p-4 border`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 text-primary-600 mr-2 flex-shrink-0" />
                            <span className="text-sm font-medium">
                              {(() => {
                                const dateObj = new Date(date);
                                const adjustedDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
                                return adjustedDate.toLocaleDateString('en-US', { 
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                });
                              })()}
                            </span>
                          </div>
                          <span className={`text-sm px-3 py-1 rounded-full flex items-center
                            ${isComplete 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isComplete ? (
                              <>
                                <CheckIcon className="h-4 w-4 mr-1" />
                                Complete
                              </>
                            ) : (
                              <>
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {assignedCount}/{staffCount}
                              </>
                            )}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {Array.from({ length: staffCount }).map((_, i) => {
                            const availableStaff = getAvailableStaffForDate(date, i);
                            const hasStaffAssigned = staffIds && staffIds[i];
                            const staffName = getStaffName(staffIds[i]);
                            
                            return (
                              <div key={i} className="flex items-center">
                                <div className="flex-grow relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserGroupIcon className={`h-4 w-4 ${hasStaffAssigned ? 'text-emerald-500' : 'text-secondary-400'}`} />
                                  </div>
                                  <select
                                    className={`pl-10 pr-10 block w-full text-base h-12 rounded-lg border shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors appearance-none ${
                                      hasStaffAssigned 
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900' 
                                        : 'border-secondary-300'
                                    }`}
                                    value={staffIds && staffIds[i] || ''}
                                    onChange={e => handleStaffSelectChange(date, e.target.value, i)}
                                  >
                                    <option value="">Select staff member</option>
                                    {availableStaff.map(member => (
                                      <option key={member.id} value={member.id}>
                                        {member.name}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-secondary-400"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                                  </div>
                                  {hasStaffAssigned && (
                                    <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
                                      <CheckIcon className="h-4 w-4 text-emerald-500" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <CalendarIcon className="w-12 h-12 mx-auto text-secondary-300 mb-3" />
                <p className="text-secondary-500 text-base">No dates require staff</p>
                <p className="text-secondary-400 text-sm">All dates are fully staffed or don't need staff</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile sticky actions */}
        <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-secondary-200 bg-white/95 backdrop-blur">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <Link href={`/bookings/${bookingId}`}>
                <Button variant="white" size="lg" className="w-full">Cancel</Button>
              </Link>
              <Button
                type="submit"
                form="staff-form"
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>

        {/* Staff Availability Modal */}
        <StaffAvailabilityModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          showId={formData.showId}
          showName={selectedShow?.name || 'Show'}
          availability={availability}
          staff={staff}
          bookings={bookings}
          currentBookingId={bookingId}
          showDateRange={showDateRange}
          clientId={formData.clientId}
        />
        
        {/* Subtle delete action moved away from Save */}
        <div className="mt-8">
          <Button
            onClick={async () => {
              if (!confirm('Delete this booking? This cannot be undone.')) return;
              setIsDeleting(true);
              try {
                await deleteBooking(bookingId);
                await logDelete('booking', bookingId, { reason: 'Deleted from edit view' });
                router.push('/bookings');
              } catch (err) {
                console.error('Failed to delete booking:', err);
                alert('Failed to delete booking. Please try again.');
                setIsDeleting(false);
              }
            }}
            variant="text"
            size="sm"
            disabled={isDeleting}
            className="flex items-center text-red-600 hover:text-red-700"
          >
            {isDeleting ? (
              <span className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full mr-1.5" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 mr-1.5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673A2.25 2.25 0 0 1 15.917 21.75H8.083A2.25 2.25 0 0 1 5.84 19.673L4.772 5.79m14.456 0a48.11 48.11 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201V6.75m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            )}
            Delete booking
          </Button>
        </div>
        
        <div className="h-24 sm:h-0"></div>
      </form>
    </div>
  </DashboardLayout>
  );
}
