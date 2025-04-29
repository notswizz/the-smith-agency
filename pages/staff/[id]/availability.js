import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { formatDate } from '@/utils/dateUtils';

export default function StaffAvailability() {
  const router = useRouter();
  const { id: staffId } = router.query;
  const { shows, staff, availability = [], setAvailability, fetchStaff, fetchShows } = useStore();
  const [selectedShowId, setSelectedShowId] = useState('');
  const [selectedDates, setSelectedDates] = useState([]);
  const [showDates, setShowDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all required data when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load staff data if needed
        if (staff.length === 0) {
          await fetchStaff();
        }

        // Load shows data if needed
        if (shows.length === 0) {
          await fetchShows();
        }

        // Verify staff member exists
        if (staffId && !staff.find(s => s.id === staffId)) {
          setError('Staff member not found');
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load required data');
        setIsLoading(false);
      }
    };

    if (staffId) {
      loadData();
    }
  }, [staffId, staff.length, shows.length, fetchStaff, fetchShows]);

  // Debug staff data
  useEffect(() => {
    if (staffId && staff.length > 0) {
      const staffMember = staff.find(s => s.id === staffId);
      console.log('Staff data debug:', {
        staffId,
        staffLength: staff.length,
        staffMember,
        staffMemberName: staffMember?.name
      });
    }
  }, [staffId, staff]);

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
      // Load existing availability for this staff/show
      const avail = (availability || []).find(a => a.staffId === staffId && a.showId === selectedShowId);
      setSelectedDates(avail ? avail.availableDates : []);
    }
  }, [selectedShowId, shows, staffId, availability]);

  const handleToggleDate = (date) => {
    setSelectedDates(dates =>
      dates.includes(date)
        ? dates.filter(d => d !== date)
        : [...dates, date]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required data is present
    if (!staffId || !selectedShowId || !selectedDates || !Array.isArray(selectedDates)) {
      setError('Please fill in all required fields');
      return;
    }

    const staffMember = staff.find(s => s.id === staffId);
    if (!staffMember || !staffMember.name) {
      setError('Staff member data is incomplete');
      return;
    }

    try {
      setError(null);
      await setAvailability(staffId, selectedShowId, selectedDates, staffMember.name);
      router.push(`/staff/${staffId}`);
    } catch (error) {
      console.error('Error setting availability:', error);
      setError(error.message || 'Failed to save availability');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-8">
          <div className="text-center">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-8">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Staff Availability</h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow">
          <div>
            <label htmlFor="show" className="block text-sm font-medium text-secondary-700">Show</label>
            <select 
              id="show" 
              value={selectedShowId} 
              onChange={e => setSelectedShowId(e.target.value)} 
              className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
            >
              <option value="">Select a show</option>
              {shows.map(show => (
                <option key={show.id} value={show.id}>
                  {show.name} ({formatDate(show.startDate)} - {formatDate(show.endDate)})
                </option>
              ))}
            </select>
          </div>
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
            <Button variant="outline" size="sm" onClick={() => router.push(`/staff/${staffId}`)} type="button">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Availability
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
