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
  TagIcon
} from '@heroicons/react/24/outline';

export default function ShowProfile() {
  const router = useRouter();
  const { id } = router.query;
  const { shows, staff, bookings, deleteShow } = useStore();

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
    description: ''
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
          description: show.description || ''
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you would update the database here
    setShowData({
      ...showData,
      ...formData
    });
    setIsEditing(false);
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
              <h1 className="text-2xl font-bold text-secondary-900">{showData.name}</h1>
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

          {/* Show information */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {/* Show header with summary information */}
            <div className="bg-gradient-to-r from-primary-100 to-secondary-100 p-6 border-b border-secondary-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-secondary-600">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>{formatDate(showData.startDate)} - {formatDate(showData.endDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-secondary-600">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span>{showData.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-secondary-600">
                    <TagIcon className="h-4 w-4 mr-1" />
                    <span>Season: {showData.season} | Type: {showData.type}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs navigation */}
            <div className="border-b border-secondary-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'details'
                      ? 'border-b-2 border-primary-500 text-primary-600'
                      : 'text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  Show Details
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'bookings'
                      ? 'border-b-2 border-primary-500 text-primary-600'
                      : 'text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  Bookings ({showBookings.length})
                </button>
              </nav>
            </div>

            {/* Tab content */}
            <div className="p-6">
              {activeTab === 'details' && (
                <>
                  {isEditing ? (
                    <form className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-secondary-700">
                            Show Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="type" className="block text-sm font-medium text-secondary-700">
                            Show Type
                          </label>
                          <input
                            type="text"
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="season" className="block text-sm font-medium text-secondary-700">
                            Season
                          </label>
                          <input
                            type="text"
                            id="season"
                            name="season"
                            value={formData.season}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="location" className="block text-sm font-medium text-secondary-700">
                            Location
                          </label>
                          <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="startDate" className="block text-sm font-medium text-secondary-700">
                            Start Date
                          </label>
                          <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="endDate" className="block text-sm font-medium text-secondary-700">
                            End Date
                          </label>
                          <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-secondary-700">
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          rows="4"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        ></textarea>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      {showData.description && (
                        <div>
                          <h3 className="text-sm font-medium text-secondary-700">Description</h3>
                          <p className="mt-1 text-sm text-secondary-600">{showData.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'bookings' && (
                <div className="space-y-4">
                  <div className="mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-secondary-900">Staff Bookings</h3>
                      <p className="text-sm text-secondary-600">
                        {showBookings.length} staff members assigned to this show
                      </p>
                    </div>
                    <Link href={`/bookings/new?showId=${id}`}>
                      <Button variant="primary" size="sm" className="flex items-center">
                        <span className="h-4 w-4 mr-1">+</span>
                        Assign Staff
                      </Button>
                    </Link>
                  </div>

                  {showBookings.length === 0 ? (
                    <div className="text-center p-6 bg-secondary-50 rounded-lg">
                      <UserIcon className="h-8 w-8 mx-auto text-secondary-400" />
                      <h3 className="mt-2 text-sm font-medium text-secondary-900">No staff assigned</h3>
                      <p className="mt-1 text-sm text-secondary-600">
                        Get started by assigning staff members to this show.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-secondary-200">
                        <thead className="bg-secondary-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                              Staff Member
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                              Assigned Date
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-secondary-200">
                          {showBookings.map((booking) => {
                            const staffMember = staff.find(s => s.id === booking.staffId);
                            return (
                              <tr key={booking.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {staffMember ? (
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <div className="h-10 w-10 rounded-full bg-secondary-200 flex items-center justify-center text-secondary-600">
                                          {staffMember.firstName.charAt(0)}{staffMember.lastName.charAt(0)}
                                        </div>
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-secondary-900">
                                          <Link href={`/staff/${staffMember.id}`} className="hover:underline">
                                            {staffMember.firstName} {staffMember.lastName}
                                          </Link>
                                        </div>
                                        <div className="text-sm text-secondary-500">
                                          {staffMember.email}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-secondary-500">Staff not found</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-secondary-900">{booking.role}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    booking.status === 'confirmed' 
                                      ? 'bg-green-100 text-green-800' 
                                      : booking.status === 'pending' 
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                  }`}>
                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                  {formatDate(booking.assignedDate)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <Link href={`/bookings/${booking.id}`} className="text-primary-600 hover:text-primary-900">
                                    Details
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 