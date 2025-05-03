import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { formatDate } from '@/utils/dateUtils';
import StaffDatePicker from '@/components/StaffDatePicker';
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  BriefcaseIcon, 
  DocumentTextIcon,
  BuildingOffice2Icon,
  XMarkIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function EditBooking() {
  const router = useRouter();
  const { bookingId } = router.query;
  const { bookings, clients, shows, updateBooking, staff, availability, getBookingsForStaff } = useStore();
  const [formData, setFormData] = useState(null);
  const [showDateRange, setShowDateRange] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [activeSection, setActiveSection] = useState('details');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setFormData({ ...booking });
      setStatus(booking.status || 'pending');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

  // Memoize form validation result to prevent infinite re-renders
  const isFormValid = useMemo(() => {
    if (!formData) return false;
    return formData.clientId && formData.showId && (formData.datesNeeded?.length > 0);
  }, [formData?.clientId, formData?.showId, formData?.datesNeeded?.length]);

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

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href={`/bookings/${bookingId}`} className="mr-4">
              <Button variant="ghost" size="sm" className="flex items-center text-secondary-600">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-500">
              Edit Booking
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
              form="booking-form"
              variant="gradient"
              size="sm"
              disabled={!isFormValid || saving}
            >
              {saving ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
              ) : (
                <CheckCircleIcon className="h-4 w-4 mr-1.5" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
        
        {/* Stats summary */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center text-indigo-600 mb-1">
                <CalendarIcon className="h-5 w-5 mr-1" /> 
                <span className="text-sm font-medium">Dates Selected</span>
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
        
        <form id="booking-form" onSubmit={(e) => {
          e.preventDefault();
          // Run validation check on submit (not during render)
          const errors = {};
          if (!formData.clientId) errors.clientId = 'Please select a client';
          if (!formData.showId) errors.showId = 'Please select a show';
          if (!formData.datesNeeded || formData.datesNeeded.length === 0) {
            errors.dates = 'Please select at least one date';
          }
          
          setFormErrors(errors);
          
          if (Object.keys(errors).length === 0) {
            setSaving(true);
            updateBooking(bookingId, { ...formData, status })
              .then(() => router.push(`/bookings/${bookingId}`))
              .catch(err => {
                console.error('Failed to update booking:', err);
                setSaving(false);
                alert('Failed to update booking. Please try again.');
              });
          }
        }} className="space-y-6">
        
        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Booking details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client selection */}
                <div>
                  <label htmlFor="clientId" className="block text-sm font-medium text-secondary-700 mb-1">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BuildingOffice2Icon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                    </div>
                    <select 
                      id="clientId" 
                      name="clientId" 
                      value={formData.clientId || ''} 
                      onChange={handleInputChange}
                      className={`pl-10 block w-full rounded-md shadow-sm sm:text-sm ${
                        formErrors.clientId 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500'
                      }`}
                    >
                      <option value="">Select a client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                    {formErrors.clientId && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.clientId}</p>
                    )}
                  </div>
                </div>
                
                {/* Show selection */}
                <div>
                  <label htmlFor="showId" className="block text-sm font-medium text-secondary-700 mb-1">
                    Show <span className="text-red-500">*</span>
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                    </div>
                    <select 
                      id="showId" 
                      name="showId" 
                      value={formData.showId || ''} 
                      onChange={handleInputChange}
                      className={`pl-10 block w-full rounded-md shadow-sm sm:text-sm ${
                        formErrors.showId 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500'
                      }`}
                    >
                      <option value="">Select a show</option>
                      {shows.map(show => (
                        <option key={show.id} value={show.id}>
                          {show.name} ({formatDate(show.startDate)} - {formatDate(show.endDate)})
                        </option>
                      ))}
                    </select>
                    {formErrors.showId && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.showId}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-3">
                  {['pending', 'confirmed', 'cancelled'].map(statusValue => (
                    <label key={statusValue} className={`
                      flex items-center px-4 py-2 rounded-full border transition-all cursor-pointer
                      ${status === statusValue ? 
                        (statusValue === 'pending' ? 'bg-amber-50 border-amber-300 text-amber-700' : 
                         statusValue === 'confirmed' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 
                         'bg-red-50 border-red-300 text-red-700') : 
                        'bg-white border-secondary-200 text-secondary-700 hover:bg-secondary-50'}
                    `}>
                      <input
                        type="radio"
                        name="status"
                        value={statusValue}
                        checked={status === statusValue}
                        onChange={() => setStatus(statusValue)}
                        className="sr-only"
                      />
                      <span className="capitalize">{statusValue}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-secondary-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="3"
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Add any special instructions or notes about this booking"
                ></textarea>
              </div>
              
              {/* Date Selection */}
              {formData.showId && showDateRange.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-secondary-800 mb-4">Select Dates</h3>
                  <StaffDatePicker
                    dateRange={showDateRange}
                    value={formData.datesNeeded || []}
                    onChange={datesNeeded => setFormData({ ...formData, datesNeeded })}
                  />
                  
                  {formErrors.dates && (
                    <p className="mt-2 text-sm text-red-600">{formErrors.dates}</p>
                  )}
                </div>
              )}
              
              {/* Validation issues for shows */}
              {formData.showId && showDateRange.length === 0 && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-md">
                  No valid dates found for this show. Check show start/end date format.
                </div>
              )}
              
              {/* Save button for main form */}
              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!isFormValid || saving}
                >
                  {saving ? (
                    <span className="animate-spin mr-1.5 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <CheckCircleIcon className="mr-1.5 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        
          {/* Right column - Staff assignment */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-secondary-200 sticky top-6">
              <div className="p-4 border-b border-secondary-200 bg-secondary-50 flex items-center justify-between">
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 text-primary-600 mr-2" />
                  <h3 className="font-medium text-secondary-900">Staff Assignment</h3>
                </div>
                <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                  {sortedDatesNeeded.length} date{sortedDatesNeeded.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {sortedDatesNeeded.length > 0 ? (
                <div className="p-3 max-h-[800px] overflow-y-auto">
                  <div className="space-y-3">
                    {sortedDatesNeeded.map(({ date, staffCount = 1, staffIds = [] }) => (
                      <div key={date} className="bg-secondary-50 rounded-lg p-3 border border-secondary-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 text-primary-600 mr-1.5" />
                            <span className="font-medium text-sm">
                              {new Date(date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <span className="text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
                            {staffCount} needed
                          </span>
                        </div>
                        
                        <div className="space-y-2 ml-6">
                          {/* Render a dropdown for each staff needed */}
                          {Array.from({ length: staffCount }).map((_, i) => {
                            const availableStaff = getAvailableStaffForDate(date, i);
                            const hasStaffAssigned = staffIds && staffIds[i];
                            
                            return (
                              <div key={i} className="flex items-center">
                                <div className="flex-grow relative">
                                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                    <UserGroupIcon className="h-3.5 w-3.5 text-secondary-400" />
                                  </div>
                                  <select
                                    className={`pl-7 block w-full text-xs rounded-md border shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors ${
                                      hasStaffAssigned 
                                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900' 
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
                            className="mt-1 text-xs flex items-center text-primary-600 hover:text-primary-800"
                            onClick={() => handleAddStaffSlot(date)}
                          >
                            <PlusIcon className="h-3.5 w-3.5 mr-1" />
                            Add staff
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <CalendarIcon className="w-12 h-12 mx-auto text-secondary-300 mb-3" />
                  <p className="text-secondary-500">No dates selected</p>
                  <p className="text-secondary-400 text-sm">Select dates from the calendar to assign staff</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  </DashboardLayout>
);
}
