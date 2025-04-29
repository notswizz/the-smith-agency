import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { formatDate } from '@/utils/dateUtils';
import { ArrowLeftIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import StaffDatePicker from '@/components/StaffDatePicker';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function NewBooking() {
  const router = useRouter();
  const { showId } = router.query;
  const { shows, staff, clients, bookings, availability = [], fetchStaff, fetchShows, fetchAvailability } = useStore();

  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    showId: '',
    status: 'pending',
    notes: '',
    datesNeeded: [], // [{date: 'YYYY-MM-DD', staffCount: 1, staffId: '', staffIndex: 0}]
  });

  // Show date range for picker
  const [showDateRange, setShowDateRange] = useState([]); // ['YYYY-MM-DD']

  // Robust date range builder
  function getShowDateRange(show) {
    if (!show || !show.startDate || !show.endDate) return [];
    // Handle Firestore Timestamp objects or strings
    function toDate(val) {
      if (typeof val === 'string') {
        // Parse as local date (no timezone offset)
        const [year, month, day] = val.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      if (val && typeof val.toDate === 'function') return val.toDate();
      return new Date(NaN);
    }
    const start = toDate(show.startDate);
    const end = toDate(show.endDate);
    if (isNaN(start) || isNaN(end)) return [];
    const dates = [];
    for (
      let d = new Date(start);
      d <= end;
      d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    ) {
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }

  // Load initial data based on formData.showId
  useEffect(() => {
    const show = shows.find(s => s.id === formData.showId);
    if (show) {
      setShowDateRange(getShowDateRange(show));
    } else {
      setShowDateRange([]);
    }
  }, [formData.showId, shows]);

  // Ensure staff and availability are loaded when form is used
  useEffect(() => {
    if (!staff || staff.length === 0) fetchStaff();
    if (!shows || shows.length === 0) fetchShows();
    if (!availability || availability.length === 0) fetchAvailability();
  }, []);

  useEffect(() => {
    if (!staff || staff.length === 0) fetchStaff();
    if (!availability || availability.length === 0) fetchAvailability();
  }, [staff, availability, fetchStaff, fetchAvailability]);

  // Get all shows sorted by date (most recent first)
  const sortedShows = useMemo(() => {
    return [...shows].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }, [shows]);
  // Get all clients sorted by name
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => a.name.localeCompare(b.name));
  }, [clients]);

  // Always sort availableDates in DB records for consistent comparison
  const getAvailableStaff = (date) => {
    if (!Array.isArray(staff) || staff.length === 0) return [];
    if (!Array.isArray(availability)) return [];
    return staff.filter(member => {
      // Find availability for this staff/show
      const avail = availability.find(a => a.staffId === member.id && a.showId === formData.showId);
      if (!avail || !Array.isArray(avail.availableDates)) return false;
      // Defensive: sort availableDates for comparison
      const sortedAvailDates = [...avail.availableDates].sort();
      return sortedAvailDates.includes(date);
    });
  };

  // Always show dates in true chronological order based on show date range, not selection order
  const sortedDatesNeeded = useMemo(() => {
    // Create a lookup for selected dates
    const selectedMap = {};
    (formData.datesNeeded || []).forEach(d => {
      if (d && d.date) selectedMap[d.date] = d;
    });
    // Sort dates according to showDateRange order
    return (showDateRange || [])
      .filter(date => selectedMap[date])
      .map(date => selectedMap[date]);
  }, [formData.datesNeeded, showDateRange]);

  // Debug: show availability and formData for troubleshooting
  // Remove or comment out in production
  // console.log('formData.showId:', formData.showId);
  // console.log('availability:', availability);

  // --- MODIFIED: Get available staff for a date (exclude already booked staff for that date/show, including current selection) ---
  const getAvailableStaffForDate = (date, currentStaffIndex = null) => {
    if (!Array.isArray(staff) || staff.length === 0) return [];
    if (!Array.isArray(availability)) return [];
    
    // Filter availability for this show
    const showAvail = availability.filter(a => a.showId === formData.showId);
    
    // Find all bookings for this show and date, including current form selection
    const bookedStaffIds = [
      // Already saved bookings
      ...(bookings || [])
        .filter(b => b.showId === formData.showId && Array.isArray(b.datesNeeded) && b.datesNeeded.some(dn => dn.date === date))
        .flatMap(b => (b.datesNeeded || []).filter(dn => dn.date === date).flatMap(dn => Array.isArray(dn.staffIds) ? dn.staffIds : [])),
      // Current form selection for this date (other dropdowns)
      ...((formData.datesNeeded.find(d => d.date === date)?.staffIds || []).filter((_, i) => i !== currentStaffIndex)),
    ].filter(Boolean);

    // Find staff available on this date and NOT already booked
    return staff.filter(member => {
      const record = showAvail.find(a => a.staffId === member.id);
      const isAvailable = record && Array.isArray(record.availableDates) && record.availableDates.includes(date);
      const isBooked = bookedStaffIds.includes(member.id);
      return isAvailable && !isBooked;
    }).map(member => ({
      ...member,
      // Use the staff member's name from their record
      name: member.firstName && member.lastName 
        ? `${member.firstName} ${member.lastName}`
        : member.name || '[NO NAME]'
    }));
  };

  // Handle input change for simple fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle staff selection change
  const handleStaffSelectChange = (date, staffId, staffIndex) => {
    // Remove staffId if it's already assigned to another slot for this date
    const updatedDatesNeeded = [...formData.datesNeeded];
    const dateIndex = updatedDatesNeeded.findIndex(d => d.date === date);
    if (dateIndex >= 0) {
      if (!updatedDatesNeeded[dateIndex].staffIds) {
        updatedDatesNeeded[dateIndex].staffIds = [];
      }
      // Remove staffId from any other index for this date
      updatedDatesNeeded[dateIndex].staffIds = updatedDatesNeeded[dateIndex].staffIds.map((sid, idx) =>
        idx !== staffIndex && sid === staffId ? '' : sid
      );
      updatedDatesNeeded[dateIndex].staffIds[staffIndex] = staffId;
    } else {
      updatedDatesNeeded.push({ date, staffIds: [staffId], staffCount: 1, staffIndex });
    }
    setFormData({ ...formData, datesNeeded: updatedDatesNeeded });
  };

  // Validate before submit
  const isValid =
    formData.clientId &&
    formData.showId &&
    formData.datesNeeded.length > 0;

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      alert('Please fill in all required fields and select at least one date with staff needed.');
      return;
    }
    // Compose booking object
    const newBooking = {
      clientId: formData.clientId,
      showId: formData.showId,
      status: formData.status,
      notes: formData.notes,
      datesNeeded: formData.datesNeeded.map(d => ({
        date: d.date,
        staffIds: Array.isArray(d.staffIds) ? d.staffIds.filter(Boolean) : [],
        staffCount: typeof d.staffCount === 'number' ? d.staffCount : 1,
      })), // [{date, staffIds, staffCount}]
      createdAt: new Date().toISOString(),
    };
    try {
      const docRef = await addDoc(collection(db, 'bookings'), newBooking);
      router.push(`/bookings/${docRef.id}`);
    } catch (err) {
      alert('Failed to create booking: ' + err.message);
    }
  };

  return (
    <>
      <Head>
        <title>New Booking</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-8">
          <div className="flex items-center mb-6">
            <Link href="/bookings">
              <Button variant="ghost" size="sm" className="mr-2">
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">New Booking</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow">
            {/* Client selection */}
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-secondary-700">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                id="clientId"
                name="clientId"
                value={formData.clientId}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
              >
                <option value="">Select a client</option>
                {sortedClients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            {/* Show selection */}
            <div>
              <label htmlFor="showId" className="block text-sm font-medium text-secondary-700">
                Show <span className="text-red-500">*</span>
              </label>
              <select
                id="showId"
                name="showId"
                value={formData.showId}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
              >
                <option value="">Select a show</option>
                {sortedShows.map(show => (
                  <option key={show.id} value={show.id}>
                    {show.name} ({formatDate(show.startDate)} - {formatDate(show.endDate)})
                  </option>
                ))}
              </select>
            </div>
            {/* Dates needed with staff assignment */}
            {formData.showId && showDateRange.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Dates Needed <span className="text-red-500">*</span>
                </label>
                <StaffDatePicker
                  dateRange={showDateRange}
                  value={formData.datesNeeded}
                  onChange={datesNeeded => setFormData({ ...formData, datesNeeded })}
                />
                {/* Staff assignment for each selected date */}
                <div className="space-y-2 mt-4">
                  {sortedDatesNeeded.map(({ date, staffCount = 1, staffIds }, idx) => (
                    <div key={date} className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm w-28">{date}</span>
                        <span className="text-xs text-secondary-500">Need {staffCount}</span>
                      </div>
                      {/* Render a dropdown for each staff needed */}
                      {Array.from({ length: staffCount }).map((_, i) => (
                        <select
                          key={i}
                          className="border rounded px-2 py-1 text-sm mb-1"
                          value={staffIds && staffIds[i] || ''}
                          onChange={e => handleStaffSelectChange(date, e.target.value, i)}
                          required={false}
                        >
                          <option value="">Select staff</option>
                          {getAvailableStaffForDate(date, i).map(member => (
                            <option key={member.id} value={member.id}>
                              {member.name || '[NO NAME]'}
                            </option>
                          ))}
                        </select>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {formData.showId && showDateRange.length === 0 && (
              <div className="text-red-600 text-sm mb-2">No valid dates found for this show. Check show start/end date format.</div>
            )}
            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-secondary-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                placeholder="Add any special instructions or notes about this booking"
              ></textarea>
            </div>
            {/* Submit button */}
            <div className="pt-5 flex justify-end space-x-3">
              <Link href="/bookings">
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!isValid}
              >
                Create Booking
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </>
  );
}