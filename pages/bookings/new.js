import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { formatDate } from '@/utils/dateUtils';
import { ArrowLeftIcon, CheckCircleIcon, XMarkIcon, UserGroupIcon, BuildingOffice2Icon, CalendarIcon, ClockIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
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

  // Load previous selections from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('bookingPreferences');
    if (savedPreferences) {
      const preferences = JSON.parse(savedPreferences);
      // Only set clientId and status from preferences
      setFormData(prev => ({
        ...prev,
        clientId: preferences.clientId || '',
        status: preferences.status || 'pending'
      }));
    }
    
    // Check if showId was passed in URL query
    if (showId) {
      setFormData(prev => ({
        ...prev,
        showId
      }));
    }
  }, [showId]);

  // Form sections tracking
  const [activeSection, setActiveSection] = useState('details');
  
  // Summary stats
  const totalStaffNeeded = useMemo(() => {
    return formData.datesNeeded.reduce((sum, date) => sum + (date.staffCount || 1), 0);
  }, [formData.datesNeeded]);
  
  const totalStaffAssigned = useMemo(() => {
    return formData.datesNeeded.reduce((sum, date) => {
      return sum + (Array.isArray(date.staffIds) ? date.staffIds.filter(Boolean).length : 0);
    }, 0);
  }, [formData.datesNeeded]);

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

  // Get available staff for a date (exclude already booked staff for that date/show, including current selection)
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
      // Use the staff member's name or a placeholder
      name: member.name || '[NO NAME]'
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
    
    // Save preferences to localStorage
    const preferences = {
      clientId: formData.clientId,
      status: formData.status
    };
    localStorage.setItem('bookingPreferences', JSON.stringify(preferences));
    
    try {
      const docRef = await addDoc(collection(db, 'bookings'), newBooking);
      router.push(`/bookings/${docRef.id}`);
    } catch (err) {
      alert('Failed to create booking: ' + err.message);
    }
  };

  // Mass assign staff to all selected dates
  const handleMassAssignStaff = (staffId) => {
    const updatedDatesNeeded = formData.datesNeeded.map(dateNeeded => {
      // Get all staff already assigned to this date (excluding empty slots)
      const existingStaffIds = (dateNeeded.staffIds || []).filter(Boolean);
      
      // If this staff is not already assigned and is available for this date
      const isAvailable = getAvailableStaffForDate(dateNeeded.date).some(s => s.id === staffId);
      
      if (isAvailable && !existingStaffIds.includes(staffId)) {
        // Find the first empty slot, or add to the end
        const staffIds = [...(dateNeeded.staffIds || [])];
        const emptyIndex = staffIds.findIndex(id => !id);
        
        if (emptyIndex >= 0) {
          staffIds[emptyIndex] = staffId;
        } else {
          staffIds.push(staffId);
          // Also increment staffCount if needed
          if (staffIds.length > (dateNeeded.staffCount || 1)) {
            return {
              ...dateNeeded,
              staffIds: staffIds,
              staffCount: staffIds.length
            };
          }
        }
        
        return {
          ...dateNeeded,
          staffIds: staffIds
        };
      }
      
      return dateNeeded;
    });
    
    setFormData({ ...formData, datesNeeded: updatedDatesNeeded });
  };

  // Find staff available for all selected dates
  const getStaffAvailableForAllDates = () => {
    if (formData.datesNeeded.length === 0) return [];
    
    // Get the dates that have been selected
    const selectedDates = formData.datesNeeded.map(d => d.date);
    
    // Find staff available for ALL selected dates
    return staff.filter(member => {
      return selectedDates.every(date => {
        // Check if staff is available for this date
        const isAvailable = getAvailableStaffForDate(date).some(s => s.id === member.id);
        return isAvailable;
      });
    }).map(member => ({
      ...member,
      name: member.firstName && member.lastName 
        ? `${member.firstName} ${member.lastName}`
        : member.name || '[NO NAME]'
    }));
  };

  // Auto-assign staff to all selected dates using a smart algorithm
  const autoAssignStaff = () => {
    // Clone current datesNeeded
    const updatedDatesNeeded = [...formData.datesNeeded];
    
    // First, get all dates and their available staff
    const dateStaffMap = {};
    updatedDatesNeeded.forEach(dateNeeded => {
      const availableStaff = getAvailableStaffForDate(dateNeeded.date);
      dateStaffMap[dateNeeded.date] = {
        needed: dateNeeded.staffCount || 1,
        staffAvailable: availableStaff,
        current: dateNeeded.staffIds || []
      };
    });
    
    // Sort dates by fewest available staff first (hardest to fill)
    const datesByAvailability = Object.keys(dateStaffMap).sort((a, b) => 
      dateStaffMap[a].staffAvailable.length - dateStaffMap[b].staffAvailable.length
    );
    
    // For each date, starting with hardest to fill
    datesByAvailability.forEach(date => {
      const dateInfo = dateStaffMap[date];
      const neededCount = dateInfo.needed;
      const currentStaff = dateInfo.current.filter(Boolean);
      const remainingNeeded = neededCount - currentStaff.length;
      
      if (remainingNeeded <= 0) return; // Skip if already fully staffed
      
      // Find staff available on this date who haven't been assigned yet
      const availableUnassigned = dateInfo.staffAvailable
        .filter(staff => !currentStaff.includes(staff.id))
        .map(staff => staff.id);
      
      // Add as many as needed
      for (let i = 0; i < Math.min(remainingNeeded, availableUnassigned.length); i++) {
        const staffId = availableUnassigned[i];
        
        // Find this date in the updated array
        const dateIndex = updatedDatesNeeded.findIndex(d => d.date === date);
        if (dateIndex >= 0) {
          // Ensure staffIds array exists
          if (!updatedDatesNeeded[dateIndex].staffIds) {
            updatedDatesNeeded[dateIndex].staffIds = [];
          }
          
          // Add the staff member to the first empty slot or at the end
          const staffIds = [...updatedDatesNeeded[dateIndex].staffIds];
          const emptyIndex = staffIds.findIndex(id => !id);
          
          if (emptyIndex >= 0) {
            staffIds[emptyIndex] = staffId;
          } else {
            staffIds.push(staffId);
          }
          
          updatedDatesNeeded[dateIndex].staffIds = staffIds;
        }
      }
    });
    
    setFormData({ ...formData, datesNeeded: updatedDatesNeeded });
  };

  // Select all dates in a date range
  const selectAllDates = () => {
    // Create datesNeeded entries for all dates in the show range
    const allDatesNeeded = showDateRange.map(date => ({
      date,
      staffCount: 1,
      staffIds: []
    }));
    
    setFormData({
      ...formData,
      datesNeeded: allDatesNeeded
    });
  };

  return (
    <>
      <Head>
        <title>New Booking</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Link href="/bookings">
                <Button variant="ghost" size="sm" className="mr-2">
                  <ArrowLeftIcon className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-500">New Booking</h1>
            </div>
            
            <div className="flex space-x-3">
              <Link href="/bookings">
                <Button variant="white" size="sm">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                form="booking-form"
                variant="gradient"
                size="sm"
                disabled={!isValid}
              >
                Create Booking
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
                <span className="text-2xl font-bold">{formData.datesNeeded.length}</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="flex items-center text-indigo-600 mb-1">
                  <UserGroupIcon className="h-5 w-5 mr-1" /> 
                  <span className="text-sm font-medium">Staff Needed</span>
                </div>
                <span className="text-2xl font-bold">{totalStaffNeeded}</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="flex items-center text-indigo-600 mb-1">
                  <CheckCircleIcon className="h-5 w-5 mr-1" /> 
                  <span className="text-sm font-medium">Staff Assigned</span>
                </div>
                <span className="text-2xl font-bold">{totalStaffAssigned}</span>
              </div>
            </div>
          </div>
          
          {/* Tab navigation */}
          <div className="border-b border-secondary-200 mb-6">
            <div className="flex space-x-8">
              <button 
                onClick={() => setActiveSection('details')}
                className={`py-3 font-medium text-sm transition-colors relative ${
                  activeSection === 'details' ? 'text-primary-600' : 'text-secondary-500 hover:text-secondary-700'
                }`}
              >
                <div className="flex items-center">
                  <InformationCircleIcon className="h-5 w-5 mr-1.5" />
                  Booking Details
                </div>
                {activeSection === 'details' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                )}
              </button>
              
              <button 
                onClick={() => setActiveSection('dates')}
                className={`py-3 font-medium text-sm transition-colors relative ${
                  activeSection === 'dates' ? 'text-primary-600' : 'text-secondary-500 hover:text-secondary-700'
                }`}
              >
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-1.5" />
                  Dates & Staff
                </div>
                {activeSection === 'dates' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                )}
              </button>
            </div>
          </div>
          
          <form id="booking-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Booking Details Section */}
            <div className={`${activeSection === 'details' ? 'block' : 'hidden'}`}>
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
                        value={formData.clientId}
                        onChange={handleInputChange}
                        className="pl-10 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        required
                      >
                        <option value="">Select a client</option>
                        {sortedClients.map(client => (
                          <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                      </select>
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
                        value={formData.showId}
                        onChange={handleInputChange}
                        className="pl-10 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
                  </div>
                </div>
                
                {/* Status Selection */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {['pending', 'confirmed', 'cancelled'].map(status => (
                      <label key={status} className={`
                        flex items-center px-4 py-2 rounded-full border transition-all cursor-pointer
                        ${formData.status === status ? 
                          (status === 'pending' ? 'bg-amber-50 border-amber-300 text-amber-700' : 
                           status === 'confirmed' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 
                           'bg-red-50 border-red-300 text-red-700') : 
                          'bg-white border-secondary-200 text-secondary-700 hover:bg-secondary-50'}
                      `}>
                        <input
                          type="radio"
                          name="status"
                          value={status}
                          checked={formData.status === status}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <span className="capitalize">{status}</span>
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
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Add any special instructions or notes about this booking"
                  ></textarea>
                </div>
                
                {/* Next section button */}
                <div className="pt-4 flex justify-end">
                  <Button 
                    type="button" 
                    variant="primary" 
                    onClick={() => setActiveSection('dates')}
                    disabled={!formData.clientId || !formData.showId}
                  >
                    Continue to Dates & Staff
                    <svg className="ml-1.5 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Dates and Staff Section */}
            <div className={`${activeSection === 'dates' ? 'block' : 'hidden'}`}>
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                {formData.showId && showDateRange.length > 0 ? (
                  <>
                    {/* Date Selection */}
                    <div>
                      <h3 className="text-lg font-medium text-secondary-800 mb-4">Select Dates</h3>
                      <StaffDatePicker
                        dateRange={showDateRange}
                        value={formData.datesNeeded}
                        onChange={datesNeeded => setFormData({ ...formData, datesNeeded })}
                      />
                    </div>
                    
                    {/* Staff assignment for each selected date */}
                    {sortedDatesNeeded.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-secondary-800">Assign Staff</h3>
                          
                          {/* Assignment Tools */}
                          {formData.datesNeeded.length > 0 && (
                            <div className="flex items-center space-x-2">
                              {/* Mass Assign Staff */}
                              <select
                                className="text-xs border-secondary-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleMassAssignStaff(e.target.value);
                                    e.target.value = ''; // Reset after selection
                                  }
                                }}
                              >
                                <option value="">Mass assign staff...</option>
                                {getStaffAvailableForAllDates().map(member => (
                                  <option key={member.id} value={member.id}>
                                    {member.name}
                                  </option>
                                ))}
                              </select>

                              {/* Auto Assign Button */}
                              <button
                                type="button"
                                className="text-xs bg-primary-50 text-primary-700 px-3 py-1.5 rounded-md hover:bg-primary-100 transition-colors flex items-center"
                                onClick={autoAssignStaff}
                              >
                                <UserGroupIcon className="h-3.5 w-3.5 mr-1" />
                                Auto Assign
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          {sortedDatesNeeded.map(({ date, staffCount = 1, staffIds = [] }) => (
                            <div key={date} className="bg-secondary-50 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center">
                                  <ClockIcon className="h-5 w-5 text-primary-600 mr-2" />
                                  <span className="font-medium">{date}</span>
                                </div>
                                <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                                  {staffCount} staff needed
                                </span>
                              </div>
                              <div className="space-y-2">
                                {/* Render a dropdown for each staff needed */}
                                {Array.from({ length: staffCount }).map((_, i) => {
                                  const availableStaff = getAvailableStaffForDate(date, i);
                                  const hasStaffAssigned = staffIds && staffIds[i];
                                  
                                  return (
                                    <div key={i} className="flex items-center">
                                      <div className="flex-grow relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                          <UserGroupIcon className="h-4 w-4 text-secondary-400" />
                                        </div>
                                        <select
                                          className={`pl-9 block w-full rounded-md border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition-colors ${
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
                                              {member.name || '[NO NAME]'}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      {i > 0 && (
                                        <button 
                                          type="button"
                                          className="ml-2 p-1 text-secondary-400 hover:text-red-500"
                                          onClick={() => {
                                            const updatedDatesNeeded = [...formData.datesNeeded];
                                            const dateIndex = updatedDatesNeeded.findIndex(d => d.date === date);
                                            if (dateIndex >= 0) {
                                              updatedDatesNeeded[dateIndex].staffCount = staffCount - 1;
                                              if (updatedDatesNeeded[dateIndex].staffIds) {
                                                updatedDatesNeeded[dateIndex].staffIds.splice(i, 1);
                                              }
                                              setFormData({ ...formData, datesNeeded: updatedDatesNeeded });
                                            }
                                          }}
                                        >
                                          <XMarkIcon className="h-5 w-5" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                                
                                <button
                                  type="button"
                                  className="mt-2 text-xs flex items-center text-primary-600 hover:text-primary-800"
                                  onClick={() => {
                                    const updatedDatesNeeded = [...formData.datesNeeded];
                                    const dateIndex = updatedDatesNeeded.findIndex(d => d.date === date);
                                    if (dateIndex >= 0) {
                                      updatedDatesNeeded[dateIndex].staffCount = (staffCount || 1) + 1;
                                      setFormData({ ...formData, datesNeeded: updatedDatesNeeded });
                                    }
                                  }}
                                >
                                  <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  Add another staff member
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : formData.showId && showDateRange.length === 0 ? (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-md">
                    No valid dates found for this show. Check show start/end date format.
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 text-amber-600 text-sm p-4 rounded-md">
                    Please select a show first to see available dates.
                  </div>
                )}
                
                {/* Back button */}
                <div className="pt-4 flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveSection('details')}
                  >
                    <svg className="mr-1.5 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Back to Details
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={!isValid}
                  >
                    Create Booking
                    <CheckCircleIcon className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </>
  );
}