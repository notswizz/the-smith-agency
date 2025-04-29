import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { formatDate } from '@/utils/dateUtils';
import useStore from '@/lib/hooks/useStore';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  BuildingOffice2Icon,
  GlobeAltIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowLeftIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

export default function ClientProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // details, contacts, bookings
  const { 
    getClientById, 
    updateClient, 
    deleteClient, 
    getBookingsForClient, 
    getShowById,
    shows 
  } = useStore();
  const [client, setClient] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (id) {
      const clientData = getClientById(id);
      if (clientData) {
        setClient(clientData);
        setFormData(clientData);
        const clientBookings = getBookingsForClient(id);
        setBookings(clientBookings || []);
      } else {
        router.push('/clients');
      }
    }
  }, [id, getClientById, getBookingsForClient, router]);

  if (!client) {
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
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...formData.contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      contacts: updatedContacts,
    });
  };

  const handleSetPrimaryContact = (index) => {
    const updatedContacts = formData.contacts.map((contact, i) => ({
      ...contact,
      isPrimary: i === index,
    }));
    setFormData({
      ...formData,
      contacts: updatedContacts,
    });
  };

  const handleAddContact = () => {
    const updatedContacts = [...formData.contacts];
    updatedContacts.push({
      id: `new-${Date.now()}`,
      name: '',
      email: '',
      phone: '',
      isPrimary: formData.contacts.length === 0,
    });
    setFormData({
      ...formData,
      contacts: updatedContacts,
    });
  };

  const handleRemoveContact = (index) => {
    let updatedContacts = [...formData.contacts];
    const removedContact = updatedContacts[index];
    updatedContacts.splice(index, 1);
    
    // If the removed contact was primary, set a new primary
    if (removedContact.isPrimary && updatedContacts.length > 0) {
      updatedContacts[0].isPrimary = true;
    }
    
    setFormData({
      ...formData,
      contacts: updatedContacts,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateClient(id, formData);
    setClient(formData);
    setIsEditing(false);
  };

  return (
    <>
      <Head>
        <title>{client.name} | The Smith Agency</title>
        <meta name="description" content={`Client profile for ${client.name}`} />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Header with title and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/clients')}
                className="flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Clients
              </Button>
              <h1 className="text-2xl font-bold text-secondary-900">{client.name}</h1>
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
                    if (confirm('Are you sure you want to delete this client?')) {
                      await deleteClient(id);
                      router.push('/clients');
                    }
                  }}>
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <Link href={`/bookings/new?client=${client.id}`}>
                    <Button variant="outline" size="sm" className="flex items-center">
                      <PlusIcon className="h-4 w-4 mr-1" />
                      New Booking
                    </Button>
                  </Link>
                  <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
                    Edit Client
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-secondary-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`${
                  activeTab === 'details'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:border-secondary-300 hover:text-secondary-700'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Client Details
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`${
                  activeTab === 'contacts'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:border-secondary-300 hover:text-secondary-700'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Contacts
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`${
                  activeTab === 'bookings'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:border-secondary-300 hover:text-secondary-700'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Bookings History
              </button>
            </nav>
          </div>

          {/* Tab content */}
          {activeTab === 'details' && (
            <div>
              <Card>
                {isEditing ? (
                  <form className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-secondary-700">
                        Client Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-secondary-700">
                        Category
                      </label>
                      <input
                        type="text"
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                        className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-secondary-700">
                        Website
                      </label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-3 rounded-lg mr-4">
                        <BuildingOffice2Icon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-secondary-900">{client.name}</h2>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 mt-1">
                          {client.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t border-secondary-200 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <MapPinIcon className="h-5 w-5 text-secondary-400 mr-2" />
                        <span className="text-secondary-900">{client.location}</span>
                      </div>
                      
                      {client.website && (
                        <div className="flex items-center">
                          <GlobeAltIcon className="h-5 w-5 text-secondary-400 mr-2" />
                          <a
                            href={client.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-800"
                          >
                            {client.website.replace(/(^\w+:|^)\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div>
              <Card
                title="Contacts"
                actions={
                  isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddContact}
                      className="flex items-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Contact
                    </Button>
                  )
                }
              >
                {formData.contacts && formData.contacts.length > 0 ? (
                  <div className="divide-y divide-secondary-200">
                    {formData.contacts.map((contact, index) => (
                      <div key={contact.id} className="py-4 first:pt-0 last:pb-0">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryContact(index)}
                                  className={`mr-2 ${
                                    contact.isPrimary
                                      ? 'text-yellow-500'
                                      : 'text-secondary-300 hover:text-secondary-400'
                                  }`}
                                >
                                  <StarIcon className="h-5 w-5" />
                                </button>
                                <input
                                  type="text"
                                  value={contact.name}
                                  onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                                  placeholder="Contact Name"
                                  className="block w-full border-0 border-b border-transparent bg-secondary-50 focus:border-primary-600 focus:ring-0 sm:text-sm"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveContact(index)}
                                className="text-secondary-400 hover:text-danger-500"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7">
                              <div className="flex items-center">
                                <EnvelopeIcon className="h-4 w-4 text-secondary-400 mr-2" />
                                <input
                                  type="email"
                                  value={contact.email}
                                  onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                                  placeholder="Email"
                                  className="block w-full border-0 border-b border-transparent bg-secondary-50 focus:border-primary-600 focus:ring-0 sm:text-sm"
                                />
                              </div>
                              <div className="flex items-center">
                                <PhoneIcon className="h-4 w-4 text-secondary-400 mr-2" />
                                <input
                                  type="tel"
                                  value={contact.phone || ''}
                                  onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                  placeholder="Phone"
                                  className="block w-full border-0 border-b border-transparent bg-secondary-50 focus:border-primary-600 focus:ring-0 sm:text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mt-1">
                              {contact.isPrimary && (
                                <StarIcon className="h-5 w-5 text-yellow-500" />
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="text-secondary-900 font-medium">
                                {contact.name}
                                {contact.isPrimary && (
                                  <span className="ml-2 text-xs text-secondary-500">Primary Contact</span>
                                )}
                              </p>
                              <div className="mt-1 text-sm">
                                <div className="flex items-center">
                                  <EnvelopeIcon className="h-4 w-4 text-secondary-400 mr-2" />
                                  <a
                                    href={`mailto:${contact.email}`}
                                    className="text-secondary-900 hover:text-primary-600"
                                  >
                                    {contact.email}
                                  </a>
                                </div>
                                {contact.phone && (
                                  <div className="flex items-center mt-1">
                                    <PhoneIcon className="h-4 w-4 text-secondary-400 mr-2" />
                                    <a
                                      href={`tel:${contact.phone}`}
                                      className="text-secondary-900 hover:text-primary-600"
                                    >
                                      {contact.phone}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary-500 text-sm">No contacts added yet.</p>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <Card
                title="Booking History"
                actions={
                  <Link href={`/bookings/new?client=${client.id}`}>
                    <Button variant="outline" size="sm" className="flex items-center">
                      <PlusIcon className="h-4 w-4 mr-1" />
                      New Booking
                    </Button>
                  </Link>
                }
              >
                {bookings.length > 0 ? (
                  <div className="overflow-hidden bg-white shadow-sm rounded-md">
                    <table className="min-w-full divide-y divide-secondary-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 bg-secondary-50 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                            Show
                          </th>
                          <th className="px-6 py-3 bg-secondary-50 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                            Dates
                          </th>
                          <th className="px-6 py-3 bg-secondary-50 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 bg-secondary-50 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-secondary-200">
                        {bookings.map((booking) => {
                          const show = getShowById(booking.showId);
                          const firstDate = booking.datesNeeded?.[0]?.date;
                          const lastDate = booking.datesNeeded?.[booking.datesNeeded.length - 1]?.date;
                          
                          return (
                            <tr key={booking.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-secondary-900">
                                  {show?.name || 'Unknown Show'}
                                </div>
                                <div className="text-xs text-secondary-500">
                                  {show?.location || ''}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                <div className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-1 text-secondary-400" />
                                  {firstDate && formatDate(firstDate)}
                                  {lastDate && firstDate !== lastDate && (
                                    <span> - {formatDate(lastDate)}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    booking.status === 'confirmed'
                                      ? 'bg-green-100 text-green-800'
                                      : booking.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-secondary-100 text-secondary-800'
                                  }`}
                                >
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link href={`/bookings/${booking.id}`}>
                                  <Button size="sm" variant="ghost">
                                    View
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-secondary-500 text-sm">No bookings yet for this client.</p>
                )}
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
} 