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
  UserIcon, 
  BriefcaseIcon, 
  DocumentTextIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  PlusIcon
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
    });
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

  const validateForm = () => {
    const errors = {};
    if (!formData.clientId) errors.clientId = 'Please select a client';
    if (!formData.showId) errors.showId = 'Please select a show';
    if (!formData.datesNeeded || formData.datesNeeded.length === 0) {
      errors.dates = 'Please select at least one date';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      await updateBooking(bookingId, { ...formData, status });
      router.push(`/bookings/${bookingId}`);
    }
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
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <div className="flex items-center">
            <Link href={`/bookings/${bookingId}`} className="mr-4">
              <Button variant="ghost" size="sm" className="flex items-center text-secondary-600">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-secondary-900">Edit Booking</h1>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl overflow-hidden">
          {/* Status header bar - changes color based on status */}
          <div className={`h-2 w-full ${
            status === 'confirmed' 
              ? 'bg-success-500' 
              : status === 'pending' 
                ? 'bg-warning-500'
                : 'bg-danger-500'
          }`} />

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-8">
              {/* Client and Show Selection */}
              <div>
                <h2 className="text-lg font-medium text-secondary-900 mb-4 flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-primary-500 mr-2" />
                  Booking Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="clientId" className="flex items-center text-sm font-medium text-secondary-700 mb-1">
                      <BriefcaseIcon className="h-4 w-4 mr-1" />
                      Client
                    </label>
                    <select 
                      id="clientId" 
                      name="clientId" 
                      value={formData.clientId} 
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
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

                  <div>
                    <label htmlFor="showId" className="flex items-center text-sm font-medium text-secondary-700 mb-1">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Show
                    </label>
                    <select 
                      id="showId" 
                      name="showId" 
                      value={formData.showId} 
                      onChange={handleInputChange}
                      className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
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
                  
                  <div className="md:col-span-2">
                    <label htmlFor="status" className="flex items-center text-sm font-medium text-secondary-700 mb-1">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Status
                    </label>
                    <div className="mt-1 flex gap-4">
                      <label className={`flex items-center px-3 py-2 rounded-md border ${
                        status === 'pending' 
                          ? 'bg-warning-50 border-warning-300 text-warning-700' 
                          : 'bg-white border-secondary-200 text-secondary-600'
                      } cursor-pointer`}>
                        <input
                          type="radio"
                          name="status"
                          value="pending"
                          checked={status === 'pending'}
                          onChange={() => setStatus('pending')}
                          className="sr-only"
                        />
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pending
                      </label>
                      <label className={`flex items-center px-3 py-2 rounded-md border ${
                        status === 'confirmed' 
                          ? 'bg-success-50 border-success-300 text-success-700' 
                          : 'bg-white border-secondary-200 text-secondary-600'
                      } cursor-pointer`}>
                        <input
                          type="radio"
                          name="status"
                          value="confirmed"
                          checked={status === 'confirmed'}
                          onChange={() => setStatus('confirmed')}
                          className="sr-only"
                        />
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Confirmed
                      </label>
                      <label className={`flex items-center px-3 py-2 rounded-md border ${
                        status === 'cancelled' 
                          ? 'bg-danger-50 border-danger-300 text-danger-700' 
                          : 'bg-white border-secondary-200 text-secondary-600'
                      } cursor-pointer`}>
                        <input
                          type="radio"
                          name="status"
                          value="cancelled"
                          checked={status === 'cancelled'}
                          onChange={() => setStatus('cancelled')}
                          className="sr-only"
                        />
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancelled
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Selection Section */}
              {formData.showId && showDateRange.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium text-secondary-900 mb-4 flex items-center">
                    <CalendarIcon className="h-5 w-5 text-primary-500 mr-2" />
                    Select Dates
                  </h2>
                  <div className="bg-secondary-50 p-4 rounded-lg">
                    <StaffDatePicker
                      dateRange={showDateRange}
                      value={formData.datesNeeded}
                      onChange={datesNeeded => setFormData({ ...formData, datesNeeded })}
                    />
                    
                    {formErrors.dates && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.dates}</p>
                    )}
                  </div>
                  
                  {/* Selected dates summary */}
                  {sortedDatesNeeded.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-secondary-700">
                      <span className="font-medium">{sortedDatesNeeded.length}</span> 
                      date{sortedDatesNeeded.length !== 1 ? 's' : ''} selected
                      
                      {staffRequirementsSummary.total > 0 && (
                        <span className="ml-3 px-2 py-0.5 rounded-full text-xs bg-secondary-100">
                          {staffRequirementsSummary.assigned}/{staffRequirementsSummary.total} staff assigned
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Staff Assignment Section */}
              {formData.datesNeeded && formData.datesNeeded.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium text-secondary-900 mb-4 flex items-center">
                    <UserIcon className="h-5 w-5 text-primary-500 mr-2" />
                    Assign Staff
                  </h2>
                  <div className="space-y-4">
                    {sortedDatesNeeded.map(({ date, staffCount = 1, staffIds }, idx) => (
                      <div key={date} className="bg-secondary-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <CalendarIcon className="h-5 w-5 text-secondary-500 mr-2" />
                            <span className="text-sm font-medium text-secondary-900">
                              {new Date(date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-secondary-600">
                              Staff needed:
                            </span>
                            <button 
                              type="button"
                              onClick={() => handleRemoveStaffSlot(date)}
                              disabled={staffCount <= 1}
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                                staffCount <= 1 
                                  ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed' 
                                  : 'bg-secondary-200 text-secondary-700 hover:bg-secondary-300'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="font-medium w-5 text-center">{staffCount}</span>
                            <button 
                              type="button"
                              onClick={() => handleAddStaffSlot(date)}
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 hover:bg-primary-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {Array.from({ length: staffCount }).map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-secondary-200 flex items-center justify-center text-secondary-600 flex-shrink-0">
                                {i+1}
                              </div>
                              <select
                                className="flex-1 rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                value={staffIds && staffIds[i] || ''}
                                onChange={e => handleStaffSelectChange(date, e.target.value, i)}
                              >
                                <option value="">Select staff member</option>
                                {getAvailableStaffForDate(date, i).map(member => (
                                  <option key={member.id} value={member.id}>
                                    {member.firstName && member.lastName 
                                      ? `${member.firstName} ${member.lastName}`
                                      : member.name || '[NO NAME]'}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div>
                <h2 className="text-lg font-medium text-secondary-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-primary-500 mr-2" />
                  Additional Notes
                </h2>
                <div>
                  <textarea
                    id="notes"
                    name="notes"
                    rows="4"
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Add any special instructions or notes about this booking"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="px-6 py-4 bg-secondary-50 border-t border-secondary-200">
              <div className="flex justify-between">
                <Link href={`/bookings/${bookingId}`}>
                  <Button type="button" variant="outline" size="sm">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" variant="primary" size="sm" className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
