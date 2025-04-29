import React, { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { formatDate } from '@/utils/dateUtils';

export default function StaffAvailabilityEntry() {
  const { staff = [], shows = [], availability = [], setAvailability, fetchStaff } = useStore();
  const [staffQuery, setStaffQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedShowId, setSelectedShowId] = useState('');
  const [selectedDates, setSelectedDates] = useState([]);
  const [showDates, setShowDates] = useState([]);

  // Ensure staff list is loaded for fuzzy search
  useEffect(() => {
    if (!staff || staff.length === 0) {
      fetchStaff && fetchStaff();
    }
  }, [staff, fetchStaff]);

  // Fuzzy search staff by name (handle both name and firstName/lastName)
  const filteredStaff = useMemo(() => {
    if (!Array.isArray(staff) || staff.length === 0) return [];
    if (!staffQuery) return staff;
    const q = staffQuery.toLowerCase();
    return staff.filter(s => {
      if (s.firstName && s.lastName) {
        return (`${s.firstName} ${s.lastName}`.toLowerCase().includes(q));
      }
      if (s.name) {
        return s.name.toLowerCase().includes(q);
      }
      return false;
    });
  }, [staff, staffQuery]);

  // When staff or show changes, update available dates
  useEffect(() => {
    if (!selectedShowId) {
      setShowDates([]);
      return;
    }
    const show = shows.find(s => s.id === selectedShowId);
    if (show && show.startDate && show.endDate) {
      const start = new Date(show.startDate);
      const end = new Date(show.endDate);
      const range = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        range.push(d.toISOString().split('T')[0]);
      }
      setShowDates(range);
      // Only load availability if staff/show changes, not when toggling dates
      if (selectedStaff) {
        const avail = (availability || []).find(a => a.staffId === selectedStaff.id && a.showId === selectedShowId);
        if (avail) {
          setSelectedDates(avail.availableDates);
        } else {
          setSelectedDates([]);
        }
      }
    }
  // Only reset dates if selectedShowId or selectedStaff changes, not availability
  }, [selectedShowId, shows, selectedStaff]);

  // Polyfill setAvailability if missing
  const setAvailabilitySafe = async (...args) => {
    if (typeof setAvailability === 'function') {
      return setAvailability(...args);
    }
    // Fallback: just alert error (real implementation needed)
    alert('Staff availability saving is not yet implemented. Please contact admin.');
    return null;
  };

  const handleToggleDate = (date) => {
    setSelectedDates(dates =>
      dates.includes(date)
        ? dates.filter(d => d !== date)
        : [...dates, date]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff || !selectedShowId) return;

    // Get staff name in correct format
    const staffName = selectedStaff.firstName && selectedStaff.lastName 
      ? `${selectedStaff.firstName} ${selectedStaff.lastName}`
      : selectedStaff.name;

    if (!staffName) {
      alert('Staff name is missing');
      return;
    }

    await setAvailabilitySafe(selectedStaff.id, selectedShowId, selectedDates, staffName);
    alert('Availability saved!');
    setSelectedShowId('');
    setSelectedDates([]);
    setShowDates([]);
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Submit Your Availability</h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Your Name</label>
            <input
              type="text"
              className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Enter your name"
              value={staffQuery}
              onChange={e => {
                setStaffQuery(e.target.value);
                setSelectedStaff(null);
              }}
            />
            {staffQuery && !selectedStaff && (
              <div className="border rounded bg-white shadow mt-1 max-h-40 overflow-auto">
                {filteredStaff.length === 0 && <div className="p-2 text-secondary-500">No matches</div>}
                {filteredStaff.map(s => (
                  <div
                    key={s.id}
                    className="p-2 hover:bg-primary-100 cursor-pointer"
                    onClick={() => {
                      setSelectedStaff(s);
                      setStaffQuery(s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.name || '');
                    }}
                  >
                    {s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          {selectedStaff && (
            <div>
              <label htmlFor="show" className="block text-sm font-medium text-secondary-700">Show</label>
              <select id="show" value={selectedShowId} onChange={e => setSelectedShowId(e.target.value)} className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm">
                <option value="">Select a show</option>
                {shows.map(show => (
                  <option key={show.id} value={show.id}>{show.name} ({formatDate(show.startDate)} - {formatDate(show.endDate)})</option>
                ))}
              </select>
            </div>
          )}
          {showDates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Dates Available</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {showDates.map(date => (
                  <label key={date} className={`flex items-center space-x-2 p-2 rounded border ${selectedDates.includes(date) ? 'border-primary-500 bg-blue-50' : 'border-secondary-200'}`}>
                    <input
                      type="checkbox"
                      checked={selectedDates.includes(date)}
                      onChange={() => handleToggleDate(date)}
                      className="h-4 w-4 border-secondary-300 rounded"
                    />
                    <span className="text-sm">{date}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="pt-5 flex justify-end space-x-3">
            <Button type="submit" variant="primary" size="sm" disabled={!selectedStaff || !selectedShowId}>
              Save Availability
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
