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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
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
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
          }
        `}</style>
      </Head>

      <DashboardLayout>
        <div className="max-w-7xl mx-auto py-3 sm:py-6 px-3 sm:px-4 space-y-4 sm:space-y-6">
          {/* Header with title and actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1 sm:mb-2">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/clients')}
                className="flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Back to Clients</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{client.name}</h1>
            </div>
          </div>
          
          {/* Client Profile Section */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="bg-gray-100 h-32 sm:h-48 relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-gray-200/50 rounded-full -mr-16 sm:-mr-20 -mt-16 sm:-mt-20"></div>
              <div className="absolute bottom-0 left-0 w-20 sm:w-24 h-20 sm:h-24 bg-gray-200/50 rounded-full -ml-10 sm:-ml-12 -mb-10 sm:-mb-12"></div>
              
              {/* Action buttons */}
              <div className="absolute top-3 sm:top-6 right-3 sm:right-6 flex gap-2">
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
                      Edit
                    </Button>
                  </>
                )}
              </div>
              
              {/* Curved wave decoration at bottom */}
              <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none">
                <path d="M0 100V0C240 53.3333 480 80 720 80C960 80 1200 53.3333 1440 0V100H0Z" fill="white"/>
              </svg>
            </div>
            
            <div className="px-4 sm:px-6 pb-5 sm:pb-6 relative">
              {/* Client logo/avatar and details */}
              <div className="flex flex-col md:flex-row -mt-16 sm:-mt-24 gap-4 sm:gap-6">
                <div className="flex-shrink-0 relative mx-auto md:mx-0">
                  <div className="h-32 w-32 sm:h-48 sm:w-48 rounded-lg border-4 border-white bg-white shadow-md overflow-hidden">
                    {client.logoUrl ? (
                      <img
                        src={client.logoUrl}
                        alt={`${client.name} logo`}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-4xl sm:text-6xl font-semibold text-transparent bg-clip-text bg-gradient-to-br ${getGradient(client.name?.charAt(0))}`}>
                        {client.name?.substring(0, 2).toUpperCase() || '??'}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-1 sm:pt-4 text-center md:text-left flex-1 flex flex-col justify-center">
                  <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-800">
                    {client.name}
                  </h2>
                  
                  <div className="mt-1 sm:mt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
                    {client.category && (
                      <div className="flex items-center text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                        <BuildingOffice2Icon className="h-3.5 w-3.5 text-gray-500 mr-1" />
                        <span className="text-xs">{client.category}</span>
                      </div>
                    )}
                    
                    {client.location && (
                      <div className="flex items-center text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                        <MapPinIcon className="h-3.5 w-3.5 text-gray-500 mr-1" />
                        <span className="text-xs">{client.location}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Contact information */}
                  <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                    {client.website && (
                      <a
                        href={client.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all text-sm font-medium"
                      >
                        <GlobeAltIcon className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="hidden sm:inline max-w-[180px] truncate">{client.website.replace(/(^\w+:|^)\/\//, '')}</span>
                        <span className="sm:hidden">Website</span>
                      </a>
                    )}
                    
                    {client.contacts && client.contacts.length > 0 && client.contacts.some(c => c.isPrimary) && (
                      <>
                        {client.contacts.find(c => c.isPrimary)?.email && (
                          <a
                            href={`mailto:${client.contacts.find(c => c.isPrimary).email}`}
                            className="flex items-center px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all text-sm font-medium"
                          >
                            <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="sm:hidden">Email</span>
                            <span className="hidden sm:inline">Contact</span>
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {/* Stats summary */}
                <div className="md:ml-auto md:self-center mt-4 sm:mt-6 md:mt-0 w-full md:w-auto">
                  <div className="flex gap-4 sm:gap-6 justify-center md:justify-end">
                    <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm border border-gray-200 flex-1 md:flex-initial min-w-[90px] sm:min-w-[100px] hover:shadow-md transition-shadow duration-300">
                      <div className="text-2xl sm:text-3xl font-bold text-gray-800">{bookings.length}</div>
                      <div className="text-2xs sm:text-xs text-gray-500 uppercase tracking-wider font-medium">Bookings</div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm border border-gray-200 flex-1 md:flex-initial min-w-[90px] sm:min-w-[100px] hover:shadow-md transition-shadow duration-300">
                      <div className="text-2xl sm:text-3xl font-bold text-gray-800">{client.shows?.length || 0}</div>
                      <div className="text-2xs sm:text-xs text-gray-500 uppercase tracking-wider font-medium">Shows</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-2">
            <nav className="flex space-x-8 p-1">
              <button
                onClick={() => setActiveTab('details')}
                className={`${
                  activeTab === 'details'
                    ? 'text-primary-600 border-primary-500 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
                } flex-1 py-3 px-1 text-center border-b-2 font-medium text-sm rounded-t-md transition-colors`}
              >
                Client Details
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`${
                  activeTab === 'contacts'
                    ? 'text-primary-600 border-primary-500 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
                } flex-1 py-3 px-1 text-center border-b-2 font-medium text-sm rounded-t-md transition-colors`}
              >
                Contacts
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`${
                  activeTab === 'bookings'
                    ? 'text-primary-600 border-primary-500 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
                } flex-1 py-3 px-1 text-center border-b-2 font-medium text-sm rounded-t-md transition-colors`}
              >
                Bookings
              </button>
            </nav>
          </div>

          {/* Tab content */}
          {activeTab === 'details' && (
            <div className="animate-fadeIn">
              <Card className="overflow-hidden">
                {isEditing ? (
                  <form className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Client Name
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BuildingOffice2Icon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 3a2 2 0 012-2h6a2 2 0 012 2v1h2a2 2 0 012 2v2.5a1 1 0 01-1 1H2a1 1 0 01-1-1V6a2 2 0 012-2h2V3zm1 1h8V3a1 1 0 00-1-1H7a1 1 0 00-1 1v1zm9 5.5V6a1 1 0 00-1-1H2a1 1 0 00-1 1v2.5h14zm0 1H2v6a1 1 0 001 1h12a1 1 0 001-1v-6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPinIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                        Website
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="url"
                          id="website"
                          name="website"
                          value={formData.website || ''}
                          onChange={handleInputChange}
                          className="block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder="https://"
                        />
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6 p-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-gray-200">
                      <div className="flex-shrink-0">
                        <div className="bg-primary-100 p-4 rounded-full">
                          <BuildingOffice2Icon className="h-8 w-8 text-primary-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                        <p className="text-sm text-gray-500">{client.category}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-md">
                          <MapPinIcon className="h-6 w-6 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Location</p>
                          <p className="text-gray-900">{client.location || "—"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-md">
                          <GlobeAltIcon className="h-6 w-6 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Website</p>
                          {client.website ? (
                            <a
                              href={client.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-800 hover:underline"
                            >
                              {client.website.replace(/(^\w+:|^)\/\//, '')}
                            </a>
                          ) : (
                            <p className="text-gray-500">—</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="animate-fadeIn">
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
                  <div className="divide-y divide-gray-200">
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
                                      : 'text-gray-300 hover:text-gray-400'
                                  }`}
                                >
                                  <StarIcon className="h-5 w-5" />
                                </button>
                                <input
                                  type="text"
                                  value={contact.name}
                                  onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                                  placeholder="Contact Name"
                                  className="block w-full border-0 border-b border-transparent bg-gray-50 focus:border-primary-600 focus:ring-0 sm:text-sm"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveContact(index)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7">
                              <div className="flex items-center">
                                <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                                <input
                                  type="email"
                                  value={contact.email}
                                  onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                                  placeholder="Email"
                                  className="block w-full border-0 border-b border-transparent bg-gray-50 focus:border-primary-600 focus:ring-0 sm:text-sm"
                                />
                              </div>
                              <div className="flex items-center">
                                <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                                <input
                                  type="tel"
                                  value={contact.phone || ''}
                                  onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                  placeholder="Phone"
                                  className="block w-full border-0 border-b border-transparent bg-gray-50 focus:border-primary-600 focus:ring-0 sm:text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start p-1">
                            <div className="flex-shrink-0 mt-1 mr-4">
                              {contact.isPrimary ? (
                                <div className="text-yellow-500 bg-yellow-50 p-1.5 rounded-full">
                                  <StarIcon className="h-5 w-5" />
                                </div>
                              ) : (
                                <div className="bg-gray-100 p-1.5 rounded-full text-gray-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-gray-900 font-medium">
                                    {contact.name}
                                    {contact.isPrimary && (
                                      <span className="ml-2 text-xs font-normal px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">Primary</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {contact.email && (
                                  <div className="flex items-center">
                                    <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                                    <a
                                      href={`mailto:${contact.email}`}
                                      className="text-gray-600 hover:text-primary-600 hover:underline"
                                    >
                                      {contact.email}
                                    </a>
                                  </div>
                                )}
                                
                                {contact.phone && (
                                  <div className="flex items-center">
                                    <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                                    <a
                                      href={`tel:${contact.phone}`}
                                      className="text-gray-600 hover:text-primary-600 hover:underline"
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
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-100 p-3 rounded-full text-gray-400 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No contacts added yet.</p>
                    {isEditing && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4 flex items-center"
                        onClick={handleAddContact}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add First Contact
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="animate-fadeIn">
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
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bookings.map((booking) => {
                        const show = getShowById(booking.showId);
                        const firstDate = booking.datesNeeded?.[0]?.date;
                        const lastDate = booking.datesNeeded?.[booking.datesNeeded.length - 1]?.date;
                        
                        return (
                          <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className={`h-1.5 w-full ${
                              booking.status === 'confirmed' 
                                ? 'bg-green-500' 
                                : booking.status === 'pending' 
                                  ? 'bg-yellow-500'
                                  : 'bg-gray-500'
                            }`}></div>
                            <div className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {show?.name || 'Unknown Show'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {show?.location || ''}
                                  </div>
                                </div>
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    booking.status === 'confirmed'
                                      ? 'bg-green-100 text-green-800'
                                      : booking.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </span>
                              </div>
                              
                              <div className="mt-3 flex items-center text-xs text-gray-500">
                                <div className="bg-gray-100 p-1 rounded-md mr-2">
                                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                                </div>
                                {firstDate && formatDate(firstDate)}
                                {lastDate && firstDate !== lastDate && (
                                  <span> - {formatDate(lastDate)}</span>
                                )}
                              </div>
                              
                              <div className="mt-4 flex justify-end">
                                <Link href={`/bookings/${booking.id}`}>
                                  <Button size="sm" variant="outline" className="text-xs px-3 py-1">
                                    View Details
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-100 p-3 rounded-full text-gray-400 mb-3">
                      <CalendarIcon className="h-6 w-6" />
                    </div>
                    <p className="text-gray-500 text-sm">No bookings yet for this client.</p>
                    <Link href={`/bookings/new?client=${client.id}`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4 flex items-center"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Create First Booking
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Bottom buffer to prevent content from being covered by the menu */}
          <div className="h-20 md:h-16"></div>
        </div>
      </DashboardLayout>
    </>
  );
} 