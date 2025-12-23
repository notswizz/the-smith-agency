import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { formatDate } from '@/utils/dateUtils';
import useStore from '@/lib/hooks/useStore';
import firebaseService from '@/lib/firebase/firebaseService';
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
import { useAdminLogger } from '@/components/LoggingWrapper';

export default function ClientProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings'); // contacts, locations, bookings
  const { 
    getClientById, 
    updateClient, 
    deleteClient, 
    getBookingsForClient, 
    getShowById,
    shows 
  } = useStore();
  const { logUpdate, logDelete } = useAdminLogger();
  const [client, setClient] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({});
  
  // Subcollection data
  const [contacts, setContacts] = useState([]);
  const [showrooms, setShowrooms] = useState([]);
  const [loadingSubcollections, setLoadingSubcollections] = useState(true);

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
        
        // Fetch contacts and showrooms from subcollections
        const fetchSubcollections = async () => {
          setLoadingSubcollections(true);
          try {
            const [contactsData, showroomsData] = await Promise.all([
              firebaseService.getClientContacts(id),
              firebaseService.getClientShowrooms(id)
            ]);
            setContacts(contactsData || []);
            setShowrooms(showroomsData || []);
          } catch (error) {
            console.error('Error fetching subcollections:', error);
          } finally {
            setLoadingSubcollections(false);
          }
        };
        fetchSubcollections();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateClient(id, formData);
      
      // Log the update
      await logUpdate('client', id, {
        name: formData.name || client?.name || 'Unknown',
        changes: Object.keys(formData).filter(key => formData[key] !== client[key]).join(', ')
      });
      
      setClient(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating client:', error);
    }
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
              
              {/* Action buttons (hidden on mobile; sticky actions shown instead) */}
              <div className="hidden sm:flex absolute top-3 sm:top-6 right-3 sm:right-6 gap-2">
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
                onClick={() => setActiveTab('bookings')}
                className={`${
                  activeTab === 'bookings'
                    ? 'text-primary-600 border-primary-500 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
                } flex-1 py-3 px-1 text-center border-b-2 font-medium text-sm rounded-t-md transition-colors`}
              >
                Bookings
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`${
                  activeTab === 'contacts'
                    ? 'text-primary-600 border-primary-500 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
                } flex-1 py-3 px-1 text-center border-b-2 font-medium text-sm rounded-t-md transition-colors relative`}
              >
                Contacts
                {contacts.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                    {contacts.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('locations')}
                className={`${
                  activeTab === 'locations'
                    ? 'text-primary-600 border-primary-500 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
                } flex-1 py-3 px-1 text-center border-b-2 font-medium text-sm rounded-t-md transition-colors relative`}
              >
                Locations
                {showrooms.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                    {showrooms.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab content */}
          {activeTab === 'contacts' && (
            <div className="animate-fadeIn">
              <Card title="Contacts">
                {loadingSubcollections ? (
                  <div className="py-12 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                  </div>
                ) : contacts.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start p-1">
                          <div className="flex-shrink-0 mt-1 mr-4">
                            <div className="bg-primary-100 p-1.5 rounded-full text-primary-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-gray-900 font-medium">
                                  {contact.name || 'Unnamed Contact'}
                                </p>
                                {contact.role && (
                                  <p className="text-xs text-gray-500">{contact.role}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {contact.email && (
                                <div className="flex items-center">
                                  <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                                  <a
                                    href={`mailto:${contact.email}`}
                                    className="text-gray-600 hover:text-primary-600 hover:underline text-sm"
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
                                    className="text-gray-600 hover:text-primary-600 hover:underline text-sm"
                                  >
                                    {contact.phone}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
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
                    <p className="text-gray-400 text-xs mt-1">Contacts are added via the client portal.</p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'locations' && (
            <div className="animate-fadeIn">
              <Card title="Showroom Locations">
                {loadingSubcollections ? (
                  <div className="py-12 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                  </div>
                ) : showrooms.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {showrooms.map((showroom) => (
                      <div key={showroom.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3">
                            <div className="bg-primary-100 p-2 rounded-lg">
                              <MapPinIcon className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {showroom.city || 'Location'}
                            </h4>
                            <div className="mt-1 space-y-1 text-sm text-gray-600">
                              {showroom.address && (
                                <p className="truncate">{showroom.address}</p>
                              )}
                              <div className="flex flex-wrap gap-2 text-xs">
                                {showroom.buildingNumber && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                                    Building: {showroom.buildingNumber}
                                  </span>
                                )}
                                {showroom.floorNumber && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                                    Floor: {showroom.floorNumber}
                                  </span>
                                )}
                                {showroom.boothNumber && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                                    Booth: {showroom.boothNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-100 p-3 rounded-full text-gray-400 mb-3">
                      <MapPinIcon className="h-6 w-6" />
                    </div>
                    <p className="text-gray-500 text-sm">No showroom locations added yet.</p>
                    <p className="text-gray-400 text-xs mt-1">Locations are added via the client portal.</p>
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

          {/* Bottom buffer to prevent content from being covered by the sticky bar */}
          <div className="h-20 md:h-16"></div>
        </div>
      </DashboardLayout>

      {/* Mobile sticky actions */}
      {!isEditing ? (
        <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-black/20 bg-pink-600">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <Button
              variant="white"
              size="lg"
              className="w-full text-black border border-black/80"
              onClick={() => setIsEditing(true)}
              aria-label="Edit client"
            >
              Edit
            </Button>
          </div>
        </div>
      ) : (
        <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-secondary-200 bg-white/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="white" size="lg" className="w-full" type="button" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button
                variant="gradient"
                size="lg"
                className="w-full"
                onClick={(e) => { e.preventDefault(); handleSubmit(e); }}
                aria-label="Save client"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 