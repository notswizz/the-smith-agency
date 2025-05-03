import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import useStore from '@/lib/hooks/useStore';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EditStaffMember() {
  const router = useRouter();
  const { id } = router.query;
  const { getStaffById, updateStaff, deleteStaff } = useStore();
  const [staffMember, setStaffMember] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (id) {
      const member = getStaffById(id);
      if (member) {
        setStaffMember(member);
        // Convert to name-only format
        const initialFormData = { ...member };
        
        // Ensure name field is set
        if (!initialFormData.name && (initialFormData.firstName || initialFormData.lastName)) {
          initialFormData.name = `${initialFormData.firstName || ''} ${initialFormData.lastName || ''}`.trim();
        }
        
        // Remove firstName and lastName fields
        delete initialFormData.firstName;
        delete initialFormData.lastName;
        
        setFormData(initialFormData);
      } else {
        router.push('/staff');
      }
    }
  }, [id, getStaffById, router]);

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
      return;
    }
    
    // Simple field update
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Ensure firstName and lastName fields are removed
      const submitData = { ...formData };
      delete submitData.firstName;
      delete submitData.lastName;
      
      await updateStaff(id, submitData);
      router.push(`/staff/${id}`);
    } catch (err) {
      setError('Failed to update staff member.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      try {
        await deleteStaff(id);
        router.push('/staff');
      } catch (err) {
        setError('Failed to delete staff member.');
      }
    }
  };

  if (!staffMember) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-secondary-500">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Edit {formData.name} | The Smith Agency</title>
        <meta name="description" content={`Edit staff profile for ${formData.name}`} />
      </Head>

      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header with title and actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/staff/${id}`)}
                className="flex items-center"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Profile
              </Button>
              <h1 className="text-2xl font-bold text-secondary-900">Edit {formData.name}</h1>
            </div>
            <div className="flex space-x-3">
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <Card title="Basic Information">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-secondary-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      required
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
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      required
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
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="college" className="block text-sm font-medium text-secondary-700">
                      College
                    </label>
                    <input
                      type="text"
                      id="college"
                      name="college"
                      value={formData.college || ''}
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
                      value={formData.experience || 'Beginner'}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </Card>

              <Card title="Physical Details">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
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
                  <div>
                    <label htmlFor="sizes.bust" className="block text-sm font-medium text-secondary-700">
                      Bust/Chest
                    </label>
                    <input
                      type="text"
                      id="sizes.bust"
                      name="sizes.bust"
                      value={formData.sizes?.bust || formData.sizes?.chest || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="sizes.waist" className="block text-sm font-medium text-secondary-700">
                      Waist
                    </label>
                    <input
                      type="text"
                      id="sizes.waist"
                      name="sizes.waist"
                      value={formData.sizes?.waist || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="sizes.hips" className="block text-sm font-medium text-secondary-700">
                      Hips
                    </label>
                    <input
                      type="text"
                      id="sizes.hips"
                      name="sizes.hips"
                      value={formData.sizes?.hips || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="sizes.inseam" className="block text-sm font-medium text-secondary-700">
                      Inseam
                    </label>
                    <input
                      type="text"
                      id="sizes.inseam"
                      name="sizes.inseam"
                      value={formData.sizes?.inseam || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="sizes.dress" className="block text-sm font-medium text-secondary-700">
                      Dress Size
                    </label>
                    <input
                      type="text"
                      id="sizes.dress"
                      name="sizes.dress"
                      value={formData.sizes?.dress || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="sizes.shoe" className="block text-sm font-medium text-secondary-700">
                      Shoe Size
                    </label>
                    <input
                      type="text"
                      id="sizes.shoe"
                      name="sizes.shoe"
                      value={formData.sizes?.shoe || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="sizes.jacket" className="block text-sm font-medium text-secondary-700">
                      Jacket Size
                    </label>
                    <input
                      type="text"
                      id="sizes.jacket"
                      name="sizes.jacket"
                      value={formData.sizes?.jacket || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
              </Card>

              <div className="flex justify-end space-x-3">
                <Link href={`/staff/${id}`}>
                  <Button variant="secondary" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </>
  );
} 