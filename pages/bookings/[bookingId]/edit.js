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
  XMarkIcon,
  PlusIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  InformationCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import StaffAvailabilityModal from '@/components/bookings/StaffAvailabilityModal';

export default function StaffAssignment() {
  const router = useRouter();
  const { bookingId } = router.query;
  const { bookings, clients, shows, updateBooking, staff, availability, getBookingsForStaff } = useStore();
  const [formData, setFormData] = useState(null);
  const [showDateRange, setShowDateRange] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
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
      // For backwards compatibility, ensure name exists
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
    } else {
      updatedDatesNeeded.push({ date, staffIds: [staffId], staffCount: 1, staffIndex });
    }
    setFormData({ ...formData, datesNeeded: updatedDatesNeeded });
  };

  const handleAddStaffSlot = (date) => {
    const updatedDatesNeeded = [...formData.datesNeeded];
    const dateIndex = updatedDatesNeeded.findIndex(d => d.date === date);
    if (dateIndex >= 0) {
      const currentCount = updatedDatesNeeded[dateIndex].staffCount || 1;
      updatedDatesNeeded[dateIndex].staffCount = currentCount + 1;
      if (!updatedDatesNeeded[dateIndex].staffIds) {
        updatedDatesNeeded[dateIndex].staffIds = [];
      }
    }
    setFormData({ ...formData, datesNeeded: updatedDatesNeeded });
  };

  const handleRemoveStaffSlot = (date) => {
    const updatedDatesNeeded = [...formData.datesNeeded];
    const dateIndex = updatedDatesNeeded.findIndex(d => d.date === date);
    if (dateIndex >= 0 && (updatedDatesNeeded[dateIndex].staffCount || 1) > 1) {
      const currentCount = updatedDatesNeeded[dateIndex].staffCount || 1;
      updatedDatesNeeded[dateIndex].staffCount = currentCount - 1;
      if (updatedDatesNeeded[dateIndex].staffIds && updatedDatesNeeded[dateIndex].staffIds.length >= currentCount) {
        updatedDatesNeeded[dateIndex].staffIds.pop();
      }
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

  // Calculate staff requirements summary
  const staffRequirementsSummary = useMemo(() => {
    if (!sortedDatesNeeded.length) return { total: 0, assigned: 0, complete: false };
    
    const total = sortedDatesNeeded.reduce((sum, date) => sum + (date.staffCount || 1), 0);
    const assigned = sortedDatesNeeded.reduce((sum, date) => {
      return sum + (date.staffIds?.filter(Boolean).length || 0);
    }, 0);
    
    return {
      total,
      assigned,
      complete: assigned >= total
    };
  }, [sortedDatesNeeded]);

  // Get staff member name from ID
  const getStaffName = (staffId) => {
    if (!staffId) return '';
    const member = staff.find(s => s.id === staffId);
    if (!member) return '';
    return member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim();
  };

  // Memoize form validation result to prevent infinite re-renders
  const isFormValid = useMemo(() => {
    if (!formData) return false;
    return true; // We're only managing staff assignments now, not validating other fields
  }, [formData]);

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
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
        {/* Mobile Header */}
        <div className="flex flex-col gap-3 mb-4 sm:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href={`/bookings/${bookingId}`} className="mr-2">
                <Button variant="ghost" size="sm" className="flex items-center text-secondary-600 p-1">
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span className="ml-1">Back</span>
                </Button>
              </Link>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-500">
                Staff Assignment
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/bookings/${bookingId}`}>
                <Button variant="white" size="sm">Cancel</Button>
              </Link>
            </div>
          </div>
          
          {/* Mobile stats summary */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm mb-4">
            {/* Status Toggle Mobile */}
            <div className="p-3 border-b border-secondary-100 flex justify-between items-center">
              <div className="flex items-center">
                <StatusIcon className="h-4 w-4 mr-2 text-secondary-600" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <button 
                onClick={handleStatusToggle}
                className="relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                type="button"
                aria-pressed={formData.status === 'confirmed'}
              >
                <span className="sr-only">Toggle status</span>
                <span 
                  className={`${formData.status === 'confirmed' ? 'bg-emerald-500' : 'bg-secondary-300'} inline-block h-6 w-11 rounded-full transition`}
                ></span>
                <span 
                  className={`${formData.status === 'confirmed' ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}
                ></span>
              </button>
            </div>
            <div className="grid grid-cols-3 divide-x divide-secondary-100">
              <div className="flex flex-col items-center py-3">
                <div className="flex items-center text-indigo-600 mb-1">
                  <CalendarIcon className="h-4 w-4 mr-1" /> 
                </div>
                <span className="text-lg font-bold">{formData.datesNeeded?.length || 0}</span>
                <span className="text-xs text-secondary-500">Days</span>
              </div>
              
              <div className="flex flex-col items-center py-3">
                <div className="flex items-center text-indigo-600 mb-1">
                  <UserGroupIcon className="h-4 w-4 mr-1" /> 
                </div>
                <span className="text-lg font-bold">{staffRequirementsSummary.total}</span>
                <span className="text-xs text-secondary-500">Needed</span>
              </div>
              
              <div className="flex flex-col items-center py-3">
                <div className="flex items-center text-indigo-600 mb-1">
                  <CheckCircleIcon className="h-4 w-4 mr-1" /> 
                </div>
                <span className="text-lg font-bold">{staffRequirementsSummary.assigned}</span>
                <span className="text-xs text-secondary-500">Assigned</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Desktop Header */}
        <div className="hidden sm:flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href={`/bookings/${bookingId}`} className="mr-4">
              <Button variant="ghost" size="sm" className="flex items-center text-secondary-600">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-500">
              Staff Assignment
            </h1>
          </div>
          
          <div className="flex space-x-3">
            <Link href={`/bookings/${bookingId}`}>
              <Button variant="white" size="sm">
                Cancel
              </Button>
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
              Save Assignments
            </Button>
          </div>
        </div>
        
        {/* Desktop Stats summary */}
        <div className="hidden sm:block bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-4 gap-4">
            {/* Status Toggle Desktop */}
            <div className="flex flex-col items-center">
              <div className="flex items-center text-indigo-600 mb-1">
                <StatusIcon className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-sm font-medium ${formData.status === 'confirmed' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {formData.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                </span>
                <button 
                  onClick={handleStatusToggle}
                  className="relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                  type="button"
                  aria-pressed={formData.status === 'confirmed'}
                >
                  <span className="sr-only">Toggle status</span>
                  <span 
                    className={`${formData.status === 'confirmed' ? 'bg-emerald-500' : 'bg-secondary-300'} inline-block h-6 w-11 rounded-full transition`}
                  ></span>
                  <span 
                    className={`${formData.status === 'confirmed' ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}
                  ></span>
                </button>
              </div>
            </div>
          
            <div className="flex flex-col items-center">
              <div className="flex items-center text-indigo-600 mb-1">
                <CalendarIcon className="h-5 w-5 mr-1" /> 
                <span className="text-sm font-medium">Dates</span>
              </div>
              <span className="text-2xl font-bold">{formData.datesNeeded?.length || 0}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center text-indigo-600 mb-1">
                <UserGroupIcon className="h-5 w-5 mr-1" /> 
                <span className="text-sm font-medium">Staff Needed</span>
              </div>
              <span className="text-2xl font-bold">{staffRequirementsSummary.total}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex items-center text-indigo-600 mb-1">
                <CheckCircleIcon className="h-5 w-5 mr-1" /> 
                <span className="text-sm font-medium">Staff Assigned</span>
              </div>
              <span className="text-2xl font-bold">{staffRequirementsSummary.assigned}</span>
            </div>
          </div>
        </div>
        
        {/* Booking Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-5 border border-secondary-200">
          <div className="flex items-center mb-3">
            <InformationCircleIcon className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="font-medium text-base text-secondary-900">Booking Information</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start">
              <BuildingOffice2Icon className="h-5 w-5 text-secondary-500 flex-shrink-0 mt-0.5 mr-2" />
              <div>
                <p className="text-xs text-secondary-500 mb-0.5">Client</p>
                <p className="text-sm font-medium">{selectedClient?.name || 'Unknown Client'}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <CalendarIcon className="h-5 w-5 text-secondary-500 flex-shrink-0 mt-0.5 mr-2" />
              <div>
                <p className="text-xs text-secondary-500 mb-0.5">Show</p>
                <p className="text-sm font-medium">{selectedShow?.name || 'Unknown Show'}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <StatusIcon className="h-5 w-5 text-secondary-500 flex-shrink-0 mt-0.5 mr-2" />
              <div>
                <p className="text-xs text-secondary-500 mb-0.5">Status</p>
                <div className="flex items-center space-x-2">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${currentStatusStyles.badge}`}>
                    {formData.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <form id="staff-form" onSubmit={(e) => {
          e.preventDefault();
          setSaving(true);
          updateBooking(bookingId, { ...formData })
            .then(() => router.push(`/bookings/${bookingId}`))
            .catch(err => {
              console.error('Failed to update staff assignments:', err);
              setSaving(false);
              alert('Failed to update staff assignments. Please try again.');
            });
        }} className="space-y-6">
        
        {/* Staff Availability Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setIsStaffModalOpen(true)}
            className="w-full flex items-center justify-center py-2 px-3 border border-primary-300 text-sm font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <EyeIcon className="h-4 w-4 mr-1.5" />
            Staff Availability Overview
          </button>
        </div>
        
        {/* Staff Assignment */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-secondary-200">
          <div className="p-4 border-b border-secondary-200 bg-secondary-50 flex items-center justify-between">
            <div className="flex items-center">
              <UserGroupIcon className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="font-medium text-secondary-900">Assign Staff to Dates</h3>
            </div>
            <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
              {sortedDatesNeeded.length} date{sortedDatesNeeded.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {sortedDatesNeeded.length > 0 ? (
            <div className="p-3 max-h-[800px] overflow-y-auto">
              <div className="space-y-3">
                {sortedDatesNeeded.map(({ date, staffCount = 1, staffIds = [] }) => {
                  const assignedCount = staffIds.filter(Boolean).length;
                  const isComplete = assignedCount >= staffCount;
                  
                  return (
                    <div key={date} className={`${isComplete ? 'bg-green-50 border-green-200' : 'bg-secondary-50 border-secondary-200'} rounded-lg p-3 border`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 text-primary-600 mr-1.5" />
                          <span className="text-xs sm:text-sm font-medium line-clamp-1">
                            {(() => {
                              const dateObj = new Date(date);
                              // Adjust for timezone offset to fix date being behind by 1 day
                              const adjustedDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);
                              return adjustedDate.toLocaleDateString('en-US', { 
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              });
                            })()}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex items-center
                          ${isComplete 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isComplete ? (
                            <>
                              <CheckIcon className="h-3 w-3 mr-1" />
                              <span>Filled</span>
                            </>
                          ) : (
                            <>
                              <span>{assignedCount}/{staffCount}</span>
                            </>
                          )}
                        </span>
                      </div>
                      
                      <div className="space-y-3 ml-6">
                        {/* Render a dropdown for each staff needed */}
                        {Array.from({ length: staffCount }).map((_, i) => {
                          const availableStaff = getAvailableStaffForDate(date, i);
                          const hasStaffAssigned = staffIds && staffIds[i];
                          const staffName = getStaffName(staffIds[i]);
                          
                          return (
                            <div key={i} className="flex items-center">
                              <div className="flex-grow relative">
                                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                  <UserGroupIcon className={`h-3.5 w-3.5 ${hasStaffAssigned ? 'text-green-500' : 'text-secondary-400'}`} />
                                </div>
                                <select
                                  className={`pl-7 block w-full text-sm rounded-md border shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors ${
                                    hasStaffAssigned 
                                      ? 'border-green-300 bg-green-50 text-green-900' 
                                      : 'border-secondary-300'
                                  }`}
                                  value={staffIds && staffIds[i] || ''}
                                  onChange={e => handleStaffSelectChange(date, e.target.value, i)}
                                >
                                  <option value="">Select staff</option>
                                  {availableStaff.map(member => (
                                    <option key={member.id} value={member.id}>
                                      {member.name || '[NO NAME]'}
                                    </option>
                                  ))}
                                </select>
                                {hasStaffAssigned && (
                                  <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
                                    <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                                  </div>
                                )}
                              </div>
                              {i > 0 && (
                                <button 
                                  type="button"
                                  className="ml-1 p-1 text-secondary-400 hover:text-red-500"
                                  onClick={() => handleRemoveStaffSlot(date)}
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Add staff button */}
                        <button
                          type="button"
                          className="text-sm flex items-center text-primary-600 hover:text-primary-800 bg-white px-3 py-1.5 rounded-md border border-primary-200 shadow-sm"
                          onClick={() => handleAddStaffSlot(date)}
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Add staff position
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <CalendarIcon className="w-12 h-12 mx-auto text-secondary-300 mb-3" />
              <p className="text-secondary-500">No dates available for this booking</p>
              <p className="text-secondary-400 text-sm">Please contact an administrator to add dates</p>
            </div>
          )}
        </div>
        
        {/* Render the Staff Availability Modal */}
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
        />
        
        {/* Fixed Save Button on Mobile */}
        <div className="fixed sm:hidden bottom-0 left-0 right-0 bg-white border-t-2 border-secondary-200 p-4 z-50 shadow-lg">
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="w-full flex items-center justify-center py-3.5 text-base font-medium rounded-lg"
          >
            {saving ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
            ) : (
              <CheckCircleIcon className="h-5 w-5 mr-2" />
            )}
            Save Assignments
          </Button>
        </div>
        
        {/* Bottom padding on mobile to account for fixed save button */}
        <div className="h-20 sm:hidden"></div>
        
      </form>
    </div>
  </DashboardLayout>
  );
}
