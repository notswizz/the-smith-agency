import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { formatDate } from '@/utils/dateUtils';
import { 
  PencilIcon,
  CalendarIcon,
  UsersIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowLeftIcon,
  UserIcon,
  MapPinIcon,
  TagIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ShowProfile() {
  const router = useRouter();
  const { id } = router.query;
  const { shows, staff, bookings, deleteShow, clients, updateShow } = useStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showData, setShowData] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [showBookings, setShowBookings] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    season: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    status: 'active' // Add status field with default value
  });

  // Fetch show data and related bookings
  useEffect(() => {
    if (id && shows.length > 0) {
      const show = shows.find(s => s.id === id);
      if (show) {
        setShowData(show);
        setFormData({
          name: show.name,
          type: show.type,
          season: show.season,
          location: show.location,
          startDate: show.startDate,
          endDate: show.endDate,
          description: show.description || '',
          status: show.status || 'active' // Initialize status field
        });

        // Get bookings for this show
        const relatedBookings = bookings.filter(booking => booking.showId === id);
        setShowBookings(relatedBookings);
      }
      setLoading(false);
    }
  }, [id, shows, bookings]);

  // Input handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Status toggle handler
  const handleStatusToggle = () => {
    setFormData({
      ...formData,
      status: formData.status === 'active' ? 'inactive' : 'active'
    });
  };

  // Helper to get client name for a booking
  const getClientName = (booking) => {
    if (booking.clientName) return booking.clientName;
    if (booking.clientId && Array.isArray(clients)) {
      const client = clients.find(c => c.id === booking.clientId);
      if (client) return client.name;
    }
    return 'Client';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare the updated show data
    const updatedShowData = {
      ...showData,
      ...formData,
      status: formData.status // Ensure status is included
    };
    
    // Save changes to the show
    if (updateShow && typeof updateShow === 'function') {
      await updateShow(id, updatedShowData);
    }
    
    // Update local state
    setShowData(updatedShowData);
    setIsEditing(false);
  };

  // PDF print handler
  const handlePrintPDF = async () => {
    const input = document.getElementById('bookings-pdf-section');
    if (!input) return;
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${showData.name}_bookings.pdf`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!showData) {
    return (
      <DashboardLayout>
        <div className="text-center p-6">
          <h2 className="text-xl font-semibold text-secondary-800">Show not found</h2>
          <p className="mt-2 text-secondary-600">The show you're looking for doesn't exist or has been removed.</p>
          <Link href="/shows">
            <Button variant="primary" className="mt-4">
              Return to Shows Directory
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{showData.name} | The Smith Agency</title>
        <meta name="description" content={`Details for ${showData.name} at The Smith Agency`} />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Back button and header */}
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center">
              <Link href="/shows" className="mr-4">
                <Button variant="outline" size="sm" className="flex items-center">
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <h1 className="text-3xl font-extrabold text-primary-800 ml-2 drop-shadow-sm">{showData.name}</h1>
            </div>
            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSubmit}>
                    Save Changes
                  </Button>
                  <Button variant="danger" size="sm" onClick={async () => {
                    if (confirm('Are you sure you want to delete this show?')) {
                      await deleteShow(id);
                      router.push('/shows');
                    }
                  }}>
                    Delete
                  </Button>
                </>
              ) : (
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="flex items-center"
                  onClick={() => setIsEditing(true)}
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit Show
                </Button>
              )}
            </div>
          </div>

          {/* Improved Show Profile Section */}
          <div className="bg-gradient-to-r from-primary-50 to-secondary-100 shadow rounded-xl p-8 flex flex-col md:flex-row md:items-center md:justify-between border border-secondary-200">
            <div className="space-y-2 flex-1">
              {isEditing ? (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-secondary-700">Show Name</label>
                      <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                    </div>
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-secondary-700">Show Type</label>
                      <input type="text" id="type" name="type" value={formData.type} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                    </div>
                    <div>
                      <label htmlFor="season" className="block text-sm font-medium text-secondary-700">Season</label>
                      <input type="text" id="season" name="season" value={formData.season} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                    </div>
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-secondary-700">Location</label>
                      <input type="text" id="location" name="location" value={formData.location} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                    </div>
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-secondary-700">Start Date</label>
                      <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-secondary-700">End Date</label>
                      <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
                    </div>
                  </div>
                  
                  {/* Status Toggle - Full Width */}
                  <div className="bg-gradient-to-r from-white to-secondary-50 rounded-xl border-2 border-secondary-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <label className="block text-lg font-bold text-secondary-900 mb-3">Show Status</label>
                        <p className="text-sm text-secondary-600 leading-relaxed max-w-2xl">
                          {formData.status === 'active' 
                            ? 'This show is currently active and accepting new bookings. Staff can be assigned and clients can make reservations.' 
                            : 'This show is inactive and not accepting new bookings. Existing bookings remain unaffected.'
                          }
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-4 lg:ml-6">
                        {/* Enhanced Toggle Switch */}
                        <button
                          type="button"
                          onClick={handleStatusToggle}
                          className={`relative inline-flex h-10 w-18 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-primary-500/20 hover:scale-105 ${
                            formData.status === 'active' 
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25' 
                              : 'bg-gradient-to-r from-secondary-400 to-secondary-500 shadow-lg shadow-secondary-400/25'
                          }`}
                        >
                          <span
                            className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-all duration-300 ease-in-out ${
                              formData.status === 'active' ? 'translate-x-10' : 'translate-x-1'
                            }`}
                          />
                          <span className="sr-only">Toggle show status</span>
                        </button>
                        
                        {/* Status Indicator */}
                        <div className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                          formData.status === 'active' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : 'bg-secondary-50 border-secondary-200 text-secondary-700'
                        }`}>
                          {formData.status === 'active' ? (
                            <>
                              <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                              <PlayIcon className="h-5 w-5 mr-1" />
                              <span className="text-sm font-bold">Active</span>
                            </>
                          ) : (
                            <>
                              <div className="w-3 h-3 bg-secondary-500 rounded-full mr-2"></div>
                              <PauseIcon className="h-5 w-5 mr-1" />
                              <span className="text-sm font-bold">Inactive</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Status Info */}
                    <div className="mt-4 pt-4 border-t border-secondary-200">
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          formData.status === 'active' ? 'bg-emerald-500' : 'bg-secondary-500'
                        }`}></div>
                        <div className="text-xs text-secondary-600">
                          <span className="font-medium">Current Impact:</span> {
                            formData.status === 'active' 
                              ? 'Show is visible to clients and staff can be assigned to bookings.' 
                              : 'Show is hidden from new bookings but existing assignments remain active.'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-secondary-700">Description</label>
                    <textarea id="description" name="description" rows="3" value={formData.description} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"></textarea>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button variant="secondary" size="sm" type="button" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button variant="primary" size="sm" type="submit">Save Changes</Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-lg text-secondary-700 font-semibold">
                      <CalendarIcon className="h-5 w-5 mr-2 text-primary-500" />
                      <span>{formatDate(showData.startDate)} - {formatDate(showData.endDate)}</span>
                    </div>
                    {/* Status Badge */}
                    <div className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                      (showData.status || 'active') === 'active' 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                        : 'bg-secondary-100 text-secondary-700 border border-secondary-200'
                    }`}>
                      {(showData.status || 'active') === 'active' ? (
                        <>
                          <PlayIcon className="h-4 w-4 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <PauseIcon className="h-4 w-4 mr-1" />
                          Inactive
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-md text-secondary-700">
                    <MapPinIcon className="h-5 w-5 mr-2 text-primary-400" />
                    <span>{showData.location}</span>
                  </div>
                  <div className="flex items-center text-md text-secondary-700">
                    <TagIcon className="h-5 w-5 mr-2 text-secondary-400" />
                    <span>Season: {showData.season} | Type: {showData.type}</span>
                  </div>
                  {showData.description && (
                    <div className="mt-2 text-secondary-600 text-base italic">{showData.description}</div>
                  )}
                </>
              )}
            </div>
            <div className="mt-6 md:mt-0 flex flex-col items-end space-y-2">
              <Button variant="outline" size="sm" onClick={handlePrintPDF}>
                Print Bookings PDF
              </Button>
            </div>
          </div>

          {/* Bookings Section - always visible, compact view */}
          <div id="bookings-pdf-section" className="bg-white shadow-lg rounded-xl p-6 border border-secondary-200">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-secondary-900">Bookings</h3>
                <p className="text-md text-secondary-600">
                  {showBookings.length} booking{showBookings.length !== 1 ? 's' : ''} for this show
                </p>
              </div>
            </div>
            {showBookings.length === 0 ? (
              <div className="text-center p-6 bg-secondary-50 rounded-lg">
                <UserIcon className="h-8 w-8 mx-auto text-secondary-400" />
                <h3 className="mt-2 text-lg font-medium text-secondary-900">No bookings yet</h3>
                <p className="mt-1 text-md text-secondary-600">
                  Get started by assigning staff members to this show.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {showBookings.map((booking) => {
                  // Calculate total staff assigned and total days
                  const totalDays = Array.isArray(booking.datesNeeded) ? booking.datesNeeded.length : 0;
                  const staffSet = new Set();
                  if (Array.isArray(booking.datesNeeded)) {
                    booking.datesNeeded.forEach(date => {
                      if (Array.isArray(date.staffIds)) {
                        date.staffIds.filter(Boolean).forEach(id => staffSet.add(id));
                      }
                    });
                  }
                  const totalStaff = staffSet.size;
                  // List unique staff assigned (not per day)
                  const staffList = Array.from(staffSet).map(staffId => {
                    const staffMember = staff.find(s => s.id === staffId);
                    return staffMember ? (staffMember.firstName ? `${staffMember.firstName} ${staffMember.lastName}` : staffMember.name || 'Staff') : 'Staff';
                  });
                  return (
                    <div key={booking.id} className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg shadow border border-secondary-200 hover:shadow-lg transition-shadow p-4 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-lg font-semibold text-primary-700">{getClientName(booking)}</div>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : booking.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending'}
                        </span>
                      </div>
                      <div className="text-sm text-secondary-700 mb-2">
                        <span className="font-medium">Notes:</span> {booking.notes || '—'}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-secondary-700">
                        <div><span className="font-medium">Total Days:</span> {totalDays}</div>
                        <div><span className="font-medium">Staff Assigned:</span> {totalStaff}</div>
                      </div>
                      {staffList.length > 0 && (
                        <div className="mt-2 text-xs text-secondary-700">
                          <span className="font-medium">Staff Working:</span> {staffList.join(', ')}
                        </div>
                      )}
                      <div className="mt-auto flex justify-end pt-4">
                        <Link href={`/bookings/${booking.id}`} className="text-primary-600 hover:text-primary-900 text-sm font-medium">
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 