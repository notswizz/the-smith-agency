import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/utils/dateUtils';
import useStore from '@/lib/hooks/useStore';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export default function StaffProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [isEditing, setIsEditing] = useState(false);
  const { getStaffById, updateStaff, getBookingsForStaff, shows, getShowById, availability, deleteStaff, clients } = useStore();
  const [staffMember, setStaffMember] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (id) {
      const member = getStaffById(id);
      if (member) {
        setStaffMember(member);
        setFormData(member);
        setBookings(getBookingsForStaff(id));
      } else {
        router.push('/staff');
      }
    }
  }, [id, getStaffById, getBookingsForStaff, router]);

  if (!staffMember) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-secondary-500">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('sizes.')) {
      const sizeKey = name.split('.')[1];
      setFormData({
        ...formData,
        sizes: {
          ...formData.sizes,
          [sizeKey]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateStaff(id, formData);
    setStaffMember(formData);
    setIsEditing(false);
  };

  return (
    <>
      <Head>
        <title>{staffMember.firstName} {staffMember.lastName} | The Smith Agency</title>
        <meta name="description" content={`Staff profile for ${staffMember.firstName} ${staffMember.lastName}`} />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Header with title and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/staff')}
                className="flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Staff
              </Button>
              <h1 className="text-2xl font-bold text-secondary-900">{staffMember.firstName} {staffMember.lastName}</h1>
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
                    if (confirm('Are you sure you want to delete this staff member?')) {
                      await deleteStaff(id);
                      router.push('/staff');
                    }
                  }}>
                    Delete
                  </Button>
                </>
              ) : (
                <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Profile and Details */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <Card>
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-4">
                    {staffMember.profileImage ? (
                      <Image
                        src={staffMember.profileImage}
                        alt={`${staffMember.firstName} ${staffMember.lastName} profile`}
                        width={128}
                        height={128}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-4xl font-semibold">
                        {staffMember.firstName.charAt(0)}
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="w-full space-y-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-secondary-700">
                          First Name
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-secondary-700">
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-secondary-700">
                          Phone
                        </label>
                        <input
                          type="text"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="instagram" className="block text-sm font-medium text-secondary-700">
                          Instagram
                        </label>
                        <input
                          type="text"
                          id="instagram"
                          name="instagram"
                          value={formData.instagram || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="experience" className="block text-sm font-medium text-secondary-700">
                          Experience Level
                        </label>
                        <select
                          id="experience"
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      <h2 className="text-xl font-bold text-secondary-900 text-center mb-2">
                        {staffMember.firstName} {staffMember.lastName}
                      </h2>
                      <p className="text-secondary-500 text-center mb-4">{staffMember.experience} Level</p>

                      <div className="mt-6 space-y-4">
                        <div className="flex items-center">
                          <EnvelopeIcon className="h-5 w-5 text-secondary-400 mr-2" />
                          <a
                            href={`mailto:${staffMember.email}`}
                            className="text-secondary-900 hover:text-primary-600"
                          >
                            {staffMember.email}
                          </a>
                        </div>
                        <div className="flex items-center">
                          <PhoneIcon className="h-5 w-5 text-secondary-400 mr-2" />
                          <a
                            href={`tel:${staffMember.phone}`}
                            className="text-secondary-900 hover:text-primary-600"
                          >
                            {staffMember.phone}
                          </a>
                        </div>
                        {staffMember.instagram && (
                          <div className="flex items-center">
                            <span className="text-secondary-400 mr-2 text-lg">@</span>
                            <a
                              href={`https://instagram.com/${staffMember.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-secondary-900 hover:text-primary-600"
                            >
                              {staffMember.instagram}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Sizes Card */}
              <Card title="Physical Details">
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="sizes.height" className="block text-sm font-medium text-secondary-700">
                        Height
                      </label>
                      <input
                        type="text"
                        id="sizes.height"
                        name="sizes.height"
                        value={formData.sizes?.height || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>

                    {/* Bust or Chest (depending on gender) */}
                    {formData.sizes?.bust !== undefined ? (
                      <div>
                        <label htmlFor="sizes.bust" className="block text-sm font-medium text-secondary-700">
                          Bust
                        </label>
                        <input
                          type="text"
                          id="sizes.bust"
                          name="sizes.bust"
                          value={formData.sizes?.bust || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    ) : (
                      <div>
                        <label htmlFor="sizes.chest" className="block text-sm font-medium text-secondary-700">
                          Chest
                        </label>
                        <input
                          type="text"
                          id="sizes.chest"
                          name="sizes.chest"
                          value={formData.sizes?.chest || ''}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {staffMember.sizes?.height && (
                      <div className="text-sm">
                        <span className="text-secondary-500">Height: </span>
                        <span className="text-secondary-900">{staffMember.sizes.height}</span>
                      </div>
                    )}
                    
                    {staffMember.sizes?.bust && (
                      <div className="text-sm">
                        <span className="text-secondary-500">Bust: </span>
                        <span className="text-secondary-900">{staffMember.sizes.bust}</span>
                      </div>
                    )}
                    
                    {staffMember.sizes?.chest && (
                      <div className="text-sm">
                        <span className="text-secondary-500">Chest: </span>
                        <span className="text-secondary-900">{staffMember.sizes.chest}</span>
                      </div>
                    )}
                    
                    {staffMember.sizes?.waist && (
                      <div className="text-sm">
                        <span className="text-secondary-500">Waist: </span>
                        <span className="text-secondary-900">{staffMember.sizes.waist}</span>
                      </div>
                    )}
                    
                    {staffMember.sizes?.hips && (
                      <div className="text-sm">
                        <span className="text-secondary-500">Hips: </span>
                        <span className="text-secondary-900">{staffMember.sizes.hips}</span>
                      </div>
                    )}
                    
                    {staffMember.sizes?.inseam && (
                      <div className="text-sm">
                        <span className="text-secondary-500">Inseam: </span>
                        <span className="text-secondary-900">{staffMember.sizes.inseam}</span>
                      </div>
                    )}
                    
                    {staffMember.sizes?.dress && (
                      <div className="text-sm">
                        <span className="text-secondary-500">Dress Size: </span>
                        <span className="text-secondary-900">{staffMember.sizes.dress}</span>
                      </div>
                    )}
                    
                    {staffMember.sizes?.shoe && (
                      <div className="text-sm">
                        <span className="text-secondary-500">Shoe Size: </span>
                        <span className="text-secondary-900">{staffMember.sizes.shoe}</span>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Right column - Bookings and Availability */}
            <div className="lg:col-span-2 space-y-6">
              {/* Booking History */}
              <Card 
                title="Booking History"
                actions={
                  <Link href="/bookings">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                }
              >
                {bookings.length > 0 ? (
                  <div className="divide-y divide-secondary-200">
                    {bookings.map((booking) => {
                      const show = getShowById(booking.show);
                      return (
                        <div key={booking.id} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <Link
                                href={`/bookings/${booking.id}`}
                                className="text-sm font-medium text-secondary-900 hover:text-primary-600"
                              >
                                {getShowById && booking.show ? getShowById(booking.show)?.name : 'Show'}
                              </Link>
                              <div className="text-xs text-secondary-500">
                                {booking.clientId && clients ? (
                                  <>
                                    Client: <span className="font-semibold text-secondary-800">{clients.find(c => c.id === booking.clientId)?.name || booking.clientId}</span>
                                  </>
                                ) : null}
                              </div>
                              <div className="text-xs text-secondary-400 mt-1">
                                Total Days Worked: <span className="font-semibold text-primary-700">{
                                  Array.isArray(booking.datesNeeded)
                                    ? booking.datesNeeded.filter(dn => Array.isArray(dn.staffIds) && dn.staffIds.includes(id)).length
                                    : 0
                                }</span>
                              </div>
                              <div className="text-xs text-secondary-400 mt-1">
                                Status: <span className={
                                  booking.status === 'confirmed'
                                    ? 'text-green-700'
                                    : booking.status === 'pending'
                                      ? 'text-yellow-700'
                                      : 'text-red-700'
                                }>
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center text-xs text-secondary-500">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {Array.isArray(booking.dates) && booking.dates.length > 0 ? formatDate(booking.dates[0]) : '—'}
                                {Array.isArray(booking.dates) && booking.dates.length > 1 && ' - ...'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-secondary-500 text-sm py-2">No bookings found</p>
                )}
              </Card>

              {/* Availability Calendar (This would normally be more complex) */}
              <Card title="Availability">
                <p className="text-secondary-700 mb-4">
                  This staff member has submitted availability for the following shows:
                </p>
                <div className="space-y-4">
                  {(availability || [])
                    .filter(a => a.staffId === id)
                    .map(availability => {
                      const show = getShowById(availability.showId);
                      if (!show) return null;
                      
                      return (
                        <div key={availability.id} className="border border-secondary-200 rounded-md p-4">
                          <h3 className="font-medium text-secondary-900">{show.name}</h3>
                          <p className="text-sm text-secondary-500 mb-2">
                            {formatDate(show.startDate)} - {formatDate(show.endDate)}
                          </p>
                          <div className="mt-2">
                            <h4 className="text-sm font-medium text-secondary-700 mb-1">Available Dates:</h4>
                            <div className="flex flex-wrap gap-2">
                              {(availability.availableDates || availability.dates || []).map(date => (
                                <span 
                                  key={date} 
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                >
                                  {formatDate(date, 'MMM d')}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
} 