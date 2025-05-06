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
  UserGroupIcon
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

  // Generate a unique gradient based on the first letter of the name
  const getGradient = (letter) => {
    const gradients = [
      'from-pink-500 to-purple-600',
      'from-blue-500 to-teal-400',
      'from-green-400 to-emerald-600',
      'from-orange-400 to-pink-500',
      'from-indigo-500 to-blue-400',
      'from-red-500 to-orange-400',
      'from-amber-400 to-yellow-300',
      'from-violet-500 to-purple-500',
      'from-teal-400 to-cyan-400',
      'from-fuchsia-500 to-pink-500',
    ];
    
    // Use character code to generate a consistent index
    const index = letter ? (letter.charCodeAt(0) % gradients.length) : 0;
    return gradients[index];
  };

  useEffect(() => {
    if (id) {
      const clientData = getClientById(id);
      if (clientData) {
        setClient(clientData);
        setFormData(clientData);
        const clientBookings = getBookingsForClient(id);
        setBookings(clientBookings || []);
        
        // Enable editing mode if edit=true is in the URL
        if (router.query.edit === 'true') {
          setIsEditing(true);
        }
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

  // Get the gradient for this client
  const gradient = getGradient(client.name?.charAt(0));
  const clientLogo = client.logoUrl || null;
  const initials = client.name?.substring(0, 2).toUpperCase() || '??';
  const activeShowsCount = client.shows?.filter(s => s.status === 'active')?.length || 0;

  return (
    <>
      <Head>
        <title>{client.name} | The Smith Agency</title>
        <meta name="description" content={`Client profile for ${client.name}`} />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Client Header with banner */}
          <div className="relative overflow-hidden rounded-xl shadow-md">
            <div className={`bg-gradient-to-r ${gradient} h-32 w-full relative`}>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
              
              {/* Back button */}
              <div className="absolute top-4 left-4">
                <Button
                  variant="white"
                  size="sm"
                  onClick={() => router.push('/clients')}
                  className="flex items-center shadow-sm"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back to Clients
                </Button>
              </div>
              
              {/* Action buttons */}
              <div className="absolute top-4 right-4 flex space-x-2">
                {isEditing ? (
                  <>
                    <Button variant="white" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button variant="success" size="sm" onClick={handleSubmit} className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Save
                    </Button>
                    <Button variant="danger" size="sm" onClick={async () => {
                      if (confirm('Are you sure you want to delete this client?')) {
                        await deleteClient(id);
                        router.push('/clients');
                      }
                    }} className="flex items-center">
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href={`/bookings/new?client=${client.id}`}>
                      <Button variant="white" size="sm" className="flex items-center">
                        <PlusIcon className="h-4 w-4 mr-1" />
                        New Booking
                      </Button>
                    </Link>
                    <Button variant="primary" size="sm" onClick={() => setIsEditing(true)} className="flex items-center">
                      <PencilSquareIcon className="h-4 w-4 mr-1" />
                      Edit Client
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-white px-6 pb-6 pt-16 flex flex-col items-center">
              {/* Client logo/avatar */}
              <div className="relative -mt-24 mb-4">
                {clientLogo ? (
                  <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center shadow-lg border-4 border-white overflow-hidden">
                    <img
                      src={clientLogo}
                      alt={client.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center text-3xl font-semibold shadow-lg border-4 border-white">
                    <span className={`text-transparent bg-clip-text bg-gradient-to-br ${gradient}`}>{initials}</span>
                  </div>
                )}
                
                {/* Active shows badge */}
                {activeShowsCount > 0 && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-primary-100 text-primary-800 text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center shadow-sm">
                      <UserGroupIcon className="h-3.5 w-3.5 mr-1" /> 
                      {activeShowsCount}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Client name and category */}
              <h1 className="text-2xl font-bold text-secondary-900">{client.name}</h1>
              {client.category && (
                <div className="mt-1 inline-flex items-center px-3 py-1 rounded-full bg-secondary-100 text-secondary-800 text-xs font-medium">
                  <BuildingOffice2Icon className="h-3.5 w-3.5 mr-1" />
                  {client.category}
                </div>
              )}
              
              {/* Basic info */}
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {client.location && (
                  <div className="flex items-center text-sm text-secondary-700">
                    <div className="bg-secondary-50 p-1.5 rounded-full mr-2 text-secondary-500">
                      <MapPinIcon className="h-4 w-4" />
                    </div>
                    <span>{client.location}</span>
                  </div>
                )}
                
                {client.website && (
                  <div className="flex items-center text-sm text-secondary-700">
                    <div className="bg-secondary-50 p-1.5 rounded-full mr-2 text-secondary-500">
                      <GlobeAltIcon className="h-4 w-4" />
                    </div>
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
                  <form className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-secondary-700">
                        Client Name
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BuildingOffice2Icon className="h-5 w-5 text-secondary-400" />
                        </div>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="block w-full pl-10 border border-secondary-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-secondary-700">
                        Category
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 3a2 2 0 012-2h6a2 2 0 012 2v1h2a2 2 0 012 2v2.5a1 1 0 01-1 1H2a1 1 0 01-1-1V6a2 2 0 012-2h2V3zm1 1h8V3a1 1 0 00-1-1H7a1 1 0 00-1 1v1zm9 5.5V6a1 1 0 00-1-1H2a1 1 0 00-1 1v2.5h14zm0 1H2v6a1 1 0 001 1h12a1 1 0 001-1v-6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="block w-full pl-10 border border-secondary-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-secondary-700">
                        Location
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPinIcon className="h-5 w-5 text-secondary-400" />
                        </div>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="block w-full pl-10 border border-secondary-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-secondary-700">
                        Website
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <GlobeAltIcon className="h-5 w-5 text-secondary-400" />
                        </div>
                        <input
                          type="url"
                          id="website"
                          name="website"
                          value={formData.website || ''}
                          onChange={handleInputChange}
                          className="block w-full pl-10 border border-secondary-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder="https://"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end space-x-3">
                      <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleSubmit} className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Save Changes
                      </Button>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bookings.map((booking) => {
                      const show = getShowById(booking.showId);
                      const firstDate = booking.datesNeeded?.[0]?.date;
                      const lastDate = booking.datesNeeded?.[booking.datesNeeded.length - 1]?.date;
                      
                      return (
                        <div key={booking.id} className="bg-white rounded-lg shadow border border-secondary-200 overflow-hidden hover:shadow-md transition-shadow">
                          <div className={`h-1.5 w-full ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-500' 
                              : booking.status === 'pending' 
                                ? 'bg-yellow-500'
                                : 'bg-secondary-500'
                          }`}></div>
                          <div className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-sm font-medium text-secondary-900">
                                  {show?.name || 'Unknown Show'}
                                </div>
                                <div className="text-xs text-secondary-500">
                                  {show?.location || ''}
                                </div>
                              </div>
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
                            </div>
                            
                            <div className="mt-3">
                              <div className="flex items-center text-xs text-secondary-500">
                                <CalendarIcon className="h-4 w-4 mr-1 text-secondary-400" />
                                {firstDate && formatDate(firstDate)}
                                {lastDate && firstDate !== lastDate && (
                                  <span> - {formatDate(lastDate)}</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-4 flex justify-end">
                              <Link href={`/bookings/${booking.id}`}>
                                <Button size="sm" variant="ghost">
                                  View
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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