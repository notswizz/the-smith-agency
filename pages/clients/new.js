import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import useStore from '@/lib/hooks/useStore';
import {
  BuildingOffice2Icon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function NewClient() {
  const router = useRouter();
  const { addClient } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    location: '',
    email: '',
    phone: '',
    website: '',
    contacts: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await addClient(formData);
      router.push('/clients');
    } catch (err) {
      setError('Failed to add client.');
    } finally {
      setLoading(false);
    }
  };

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

  const gradient = getGradient(formData.name?.charAt(0) || 'A');
  const initials = formData.name?.substring(0, 2).toUpperCase() || '??';

  return (
    <>
      <Head>
        <title>Add Client | The Smith Agency</title>
        <meta name="description" content="Add a new client to The Smith Agency database" />
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
              <h1 className="text-2xl font-bold text-secondary-900">New Client</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Preview column */}
            <div className="lg:col-span-1">
              <Card>
                <div className="flex flex-col items-center">
                  <div className={`w-full h-24 bg-gradient-to-r ${gradient} rounded-t-lg relative overflow-hidden -mx-6 -mt-6 mb-4`}>
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
                    <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/10 rounded-full -ml-6 -mb-6"></div>
                  </div>
                  
                  <div className="relative -mt-16 mb-4">
                    <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-2xl font-semibold shadow-md border-4 border-white">
                      <span className={`text-transparent bg-clip-text bg-gradient-to-br ${gradient}`}>{initials}</span>
                    </div>
                  </div>
                  
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-secondary-900">
                      {formData.name || 'New Client'}
                    </h3>
                    {formData.category && (
                      <div className="mt-1 inline-flex items-center px-3 py-1 rounded-full bg-secondary-100 text-secondary-800 text-xs font-medium">
                        <BuildingOffice2Icon className="h-3.5 w-3.5 mr-1" />
                        {formData.category}
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full space-y-4 p-4 bg-secondary-50 rounded-lg mt-2">
                    <p className="text-sm text-secondary-500 text-center">Client Preview</p>
                    
                    {formData.location && (
                      <div className="flex items-center text-sm text-secondary-700">
                        <div className="bg-white p-1.5 rounded-full mr-2.5 text-secondary-500">
                          <MapPinIcon className="h-4 w-4" />
                        </div>
                        <span>{formData.location}</span>
                      </div>
                    )}
                    
                    {formData.email && (
                      <div className="flex items-center text-sm text-secondary-700">
                        <div className="bg-white p-1.5 rounded-full mr-2.5 text-secondary-500">
                          <EnvelopeIcon className="h-4 w-4" />
                        </div>
                        <span className="truncate">{formData.email}</span>
                      </div>
                    )}
                    
                    {formData.phone && (
                      <div className="flex items-center text-sm text-secondary-700">
                        <div className="bg-white p-1.5 rounded-full mr-2.5 text-secondary-500">
                          <PhoneIcon className="h-4 w-4" />
                        </div>
                        <span>{formData.phone}</span>
                      </div>
                    )}
                    
                    {formData.website && (
                      <div className="flex items-center text-sm text-secondary-700">
                        <div className="bg-white p-1.5 rounded-full mr-2.5 text-secondary-500">
                          <GlobeAltIcon className="h-4 w-4" />
                        </div>
                        <span className="truncate">{formData.website.replace(/(^\w+:|^)\/\//, '')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          
            {/* Form column */}
            <div className="lg:col-span-2">
              <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-md">
                      {error}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor="name" className="block text-sm font-medium text-secondary-700">
                        Client Name *
                      </label>
                      <div className="mt-1">
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-secondary-700">
                        Category
                      </label>
                      <div className="mt-1">
                        <input
                          id="category"
                          name="category"
                          type="text"
                          value={formData.category}
                          onChange={handleChange}
                          className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-secondary-700">
                        Location
                      </label>
                      <div className="mt-1">
                        <input
                          id="location"
                          name="location"
                          type="text"
                          value={formData.location}
                          onChange={handleChange}
                          className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
                        Email
                      </label>
                      <div className="mt-1">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-secondary-700">
                        Phone
                      </label>
                      <div className="mt-1">
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="website" className="block text-sm font-medium text-secondary-700">
                        Website
                      </label>
                      <div className="mt-1">
                        <input
                          id="website"
                          name="website"
                          type="url"
                          value={formData.website}
                          onChange={handleChange}
                          className="block w-full rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          placeholder="https://"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-secondary-200 pt-4 flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => router.push('/clients')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                      className="flex items-center"
                    >
                      {loading ? 'Saving...' : (
                        <>
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Save Client
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
          </div>
      </DashboardLayout>
    </>
  );
}
