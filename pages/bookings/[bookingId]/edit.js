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
  BuildingOffice2Icon,
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
  const { bookings, clients, shows, updateBooking, staff, availability, getBookingsForStaff } = useStore();
  const { logUpdate } = useAdminLogger();
  const [formData, setFormData] = useState(null);
  const [showDateRange, setShowDateRange] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

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
            <Link href={`/bookings/${bookingId}`}>
              <Button variant="outline" size="sm">Cancel</Button>
            </Link>
            <Button
              type="submit"
              form="staff-form"
              variant="primary"
              size="sm"
              disabled={saving}
              className="flex items-center"
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

        {/* Key Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-secondary-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-500">
                <BuildingOffice2Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-500 mb-1">Client</p>
                <p className="font-semibold text-secondary-900">{selectedClient?.name || 'Unknown'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-500 mb-1">Show</p>
                <p className="font-semibold text-secondary-900">{selectedShow?.name || 'Unknown'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <StatusIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-500 mb-1">Status</p>
                <div className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${currentStatusStyles.badge}`}>
                  {formData.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                </div>
              </div>
            </div>
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
            <div className="p-4 max-h-[calc(100vh-500px)] overflow-y-auto">
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
                                  className={`pl-10 block w-full text-sm h-10 rounded-lg border shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors ${
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
                                {hasStaffAssigned && (
                                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
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

        {/* Staff Availability Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setIsStaffModalOpen(true)}
            className="w-full flex items-center justify-center py-3 px-4 border border-primary-300 text-sm font-medium rounded-lg text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            View Staff Availability Overview
          </button>
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
        
      </form>
    </div>
  </DashboardLayout>
  );
}
