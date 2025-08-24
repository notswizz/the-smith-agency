import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import useStore from '@/lib/hooks/useStore';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAdminLogger } from '@/components/LoggingWrapper';

export default function EditStaffMember() {
  const router = useRouter();
  const { id } = router.query;
  const { getStaffById, updateStaff, deleteStaff, fetchStaff } = useStore();
  const { logUpdate, logDelete } = useAdminLogger();

  // Available badges
  const availableBadges = [
    'Travel Team',
    'Solo Worker', 
    'Training Complete',
    '10 Shows Worked',
    '25 Shows Worked',
    '50 Shows Worked',
    '100 Shows Worked',
    'Lead Staff',
    'Mentor',
    'Emergency Contact',
    'Vehicle Owner',
    'Specialty Skills',
    'Reliable Attendance',
    'Customer Favorite'
  ];
  const [staffMember, setStaffMember] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  
  useEffect(() => {
    if (id) {
      const member = getStaffById(id);
      if (member) {
        setStaffMember(member);
        // Convert to standardized format
        const initialFormData = { ...member };
        
        // Ensure name field is set
        if (!initialFormData.name && (initialFormData.firstName || initialFormData.lastName)) {
          initialFormData.name = `${initialFormData.firstName || ''} ${initialFormData.lastName || ''}`.trim();
        }
        
        // Handle legacy phone field migration
        if (!initialFormData.phone && initialFormData.phoneNumber) {
          initialFormData.phone = initialFormData.phoneNumber;
        }
        
        // Convert legacy sizes object to flat fields
        if (initialFormData.sizes) {
          if (!initialFormData.shoeSize && initialFormData.sizes.shoe) {
            initialFormData.shoeSize = initialFormData.sizes.shoe;
          }
          if (!initialFormData.dressSize && initialFormData.sizes.dress) {
            initialFormData.dressSize = initialFormData.sizes.dress;
          }
        }
        
        // Ensure new fields have defaults
        if (!initialFormData.payRate) {
          initialFormData.payRate = 15; // Default pay rate
        }
        if (!initialFormData.badges || !Array.isArray(initialFormData.badges)) {
          initialFormData.badges = []; // Default empty badges array
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

  const handleInputChange = async (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle legacy sizes.* fields by converting to flat structure
    if (name.startsWith('sizes.')) {
      const sizeKey = name.split('.')[1];
      let flatFieldName = sizeKey;
      
      // Convert to standardized field names
      if (sizeKey === 'shoe') flatFieldName = 'shoeSize';
      if (sizeKey === 'dress') flatFieldName = 'dressSize';
      
      setFormData({
        ...formData,
        [flatFieldName]: value,
      });
      return;
    }

    // Regular numeric input handling for pay rate (no clamping)
    if (name === 'payRate') {
      setFormData({ ...formData, [name]: value });
      return;
    }
    
    // Handle form approval toggles
    if (name.startsWith('formApproval.')) {
      const formType = name.split('.')[1];
      
      // Update the individual approval fields
      const updatedFormData = {
        ...formData,
        [`${formType}FormApproved`]: checked,
        [`${formType}FormApprovedDate`]: checked ? new Date().toISOString() : null,
      };
      
      // Also update the completedForms array structure for portal compatibility
      if (updatedFormData.completedForms && Array.isArray(updatedFormData.completedForms) && updatedFormData.completedForms.length > 0) {
        updatedFormData.completedForms = updatedFormData.completedForms.map(form => {
          if (form.formType === formType) {
            // When approving a form, ensure it's marked as completed
            // Check both individual fields and existing completed status
            const wasCompleted = form.completed || 
                               (formType === 'application' && formData.applicationFormCompleted) ||
                               (formType === 'interview' && formData.interviewFormCompleted);
            
            return {
              ...form,
              completed: wasCompleted,
              enabled: checked,
              dateEnabled: checked ? new Date().toISOString() : null
            };
          }
          // When approving application, also enable the interview form
          if (formType === 'application' && checked && form.formType === 'interview') {
            return {
              ...form,
              enabled: true,
              dateEnabled: new Date().toISOString()
            };
          }
          return form;
        });
      } else {
        // Create completedForms array if it doesn't exist (only application and interview)
        updatedFormData.completedForms = [
          {
            completed: formData.applicationFormCompleted || false,
            dateCompleted: formData.applicationFormCompleted ? (formData.applicationFormCompletedDate || new Date().toISOString()) : null,
            dateEnabled: "2025-07-27T02:48:43.018Z",
            enabled: true,
            formType: 'application'
          },
          {
            completed: formData.interviewFormCompleted || false,
            dateCompleted: formData.interviewFormCompleted ? (formData.interviewFormCompletedDate || new Date().toISOString()) : null,
            dateEnabled: (formType === 'application' && checked) || (formType === 'interview' && checked) ? new Date().toISOString() : null,
            enabled: (formType === 'application' && checked) || (formType === 'interview' && checked),
            formType: 'interview'
          }
        ];
      }
      
      setFormData(updatedFormData);
      
      // Auto-save the form approval changes to Firebase immediately
      try {
        const submitData = { ...updatedFormData };
        delete submitData.firstName;
        delete submitData.lastName;
        
        console.log(`Saving ${formType} approval to Firebase:`, {
          [`${formType}FormApproved`]: submitData[`${formType}FormApproved`],
          completedForms: submitData.completedForms
        });
        
        await updateStaff(id, submitData);
        console.log(`${formType} form approval saved to Firebase successfully`);
      } catch (error) {
        console.error('Error auto-saving form approval:', error);
      }
      
      return;
    }
    
    // Simple field update
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleBadgeToggle = (badge) => {
    const currentBadges = formData.badges || [];
    const updatedBadges = currentBadges.includes(badge)
      ? currentBadges.filter(b => b !== badge)
      : [...currentBadges, badge];
    
    setFormData({ ...formData, badges: updatedBadges });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Clean up data before saving
      const submitData = { ...formData };
      delete submitData.firstName;
      delete submitData.lastName;
      
      // Remove legacy fields
      delete submitData.phoneNumber; // Remove old phoneNumber field
      if (submitData.shoeSize || submitData.dressSize) {
        delete submitData.sizes; // Remove old sizes object
      }
      
      await updateStaff(id, submitData);
      
      // Log the update
      await logUpdate('staff', id, {
        name: submitData.name || staffMember?.name || 'Unknown',
        changes: Object.keys(submitData).join(', ')
      });
      
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
        // Log the deletion before removing
        await logDelete('staff', id, {
          name: staffMember?.name || 'Unknown'
        });
        
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
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={async () => {
                  await fetchStaff();
                  window.location.reload(); // Force full reload to clear cache
                }}
              >
                Refresh Data
              </Button>
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

                  <div>
                    <label htmlFor="payRate" className="block text-sm font-medium text-secondary-700">
                      Pay Rate (hourly)
                    </label>
                    <input
                      type="number"
                      id="payRate"
                      name="payRate"
                      value={formData.payRate ?? ''}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    {formData.payRate !== undefined && formData.payRate !== '' && (
                      <div className="mt-1 text-sm text-gray-500">
                        Current rate: ${formData.payRate}/hour
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Badges
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-secondary-200 rounded-md p-3 bg-gray-50">
                      {availableBadges.map(badge => (
                        <label key={badge} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded text-sm">
                          <input
                            type="checkbox"
                            checked={(formData.badges || []).includes(badge)}
                            onChange={() => handleBadgeToggle(badge)}
                            className="rounded text-primary-600 focus:ring-primary-500"
                          />
                          <span>{badge}</span>
                        </label>
                      ))}
                    </div>
                    {(formData.badges || []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(formData.badges || []).map(badge => (
                          <span key={badge} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card title="Physical Details">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="shoeSize" className="block text-sm font-medium text-secondary-700">
                      Shoe Size
                    </label>
                    <input
                      type="text"
                      id="shoeSize"
                      name="shoeSize"
                      value={formData.shoeSize || formData.sizes?.shoe || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="dressSize" className="block text-sm font-medium text-secondary-700">
                      Dress Size
                    </label>
                    <input
                      type="text"
                      id="dressSize"
                      name="dressSize"
                      value={formData.dressSize || formData.sizes?.dress || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-secondary-700">
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-secondary-200 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
              </Card>

              <Card title="Form Approvals">
                <div className="space-y-6">
                  <p className="text-sm text-secondary-600 mb-4">
                    Control which forms this staff member can access and complete. Enable forms progressively as they complete each step.
                  </p>
                  
                  {/* Manual Status Override */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-start space-x-2">
                      <div className="text-red-600 mt-0.5">⚡</div>
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-red-800 mb-2">Manual Status Override</h5>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                name="formOverride.applicationCompleted"
                                checked={formData.applicationFormCompleted || false}
                                      onChange={async (e) => {
                                  const checked = e.target.checked;
                                  const now = new Date();
                                  const updatedFormData = {
                                    ...formData,
                                    applicationFormCompleted: checked,
                                    applicationFormCompletedDate: checked ? now : null,
                                    // Also update completedForms array to stay in sync
                                    completedForms: (formData.completedForms || []).map(form => {
                                      if (form.formType === 'application') {
                                        return {
                                          ...form,
                                          completed: checked,
                                          dateCompleted: checked ? now.toISOString() : null
                                        };
                                      }
                                      return form;
                                    })
                                  };
                                  
                                  setFormData(updatedFormData);
                                  
                                  // Auto-save immediately to prevent losing changes
                                  try {
                                    const submitData = { ...updatedFormData };
                                    delete submitData.firstName;
                                    delete submitData.lastName;
                                    delete submitData.phoneNumber;
                                    if (submitData.shoeSize || submitData.dressSize) {
                                      delete submitData.sizes;
                                    }
                                    
                                    await updateStaff(id, submitData);
                                  } catch (error) {
                                    console.error('Error auto-saving application completion:', error);
                                  }
                                }}
                                className="rounded border-red-300 text-red-600 focus:ring-red-500"
                              />
                              <span className="text-xs font-medium text-red-700">Force Application Completed</span>
                            </label>
                          </div>
                          <div>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                name="formOverride.interviewCompleted"
                                checked={formData.interviewFormCompleted || false}
                                onChange={async (e) => {
                                  const checked = e.target.checked;
                                  const now = new Date();
                                  const updatedFormData = {
                                    ...formData,
                                    interviewFormCompleted: checked,
                                    interviewFormCompletedDate: checked ? now : null,
                                    // Also update completedForms array to stay in sync
                                    completedForms: (formData.completedForms || []).map(form => {
                                      if (form.formType === 'interview') {
                                        return {
                                          ...form,
                                          completed: checked,
                                          dateCompleted: checked ? now.toISOString() : null
                                        };
                                      }
                                      return form;
                                    })
                                  };
                                  
                                  setFormData(updatedFormData);
                                  
                                  // Auto-save immediately to prevent losing changes
                                  try {
                                    const submitData = { ...updatedFormData };
                                    delete submitData.firstName;
                                    delete submitData.lastName;
                                    delete submitData.phoneNumber;
                                    if (submitData.shoeSize || submitData.dressSize) {
                                      delete submitData.sizes;
                                    }
                                    
                                    await updateStaff(id, submitData);
                                  } catch (error) {
                                    console.error('Error auto-saving interview completion:', error);
                                  }
                                }}
                                className="rounded border-red-300 text-red-600 focus:ring-red-500"
                              />
                              <span className="text-xs font-medium text-red-700">Force Interview Completed</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Application Form */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-blue-900">Application Form</h4>
                          <p className="text-xs text-blue-600">Initial staff application</p>
                        </div>
                        <div className="text-lg">
                          {formData.applicationFormCompleted ? '✅' : '📝'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs text-blue-700">
                          <span className="font-medium">Status:</span> {formData.applicationFormCompleted ? 'Completed' : 'Pending'}
                        </div>
                        
                        {formData.applicationFormCompleted && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  name="formApproval.application"
                                  checked={formData.applicationFormApproved || false}
                                  onChange={handleInputChange}
                                  className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-xs font-medium text-blue-700">Approve Application</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => setShowApplicationModal(true)}
                                className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded transition-colors duration-200"
                              >
                                Review
                              </button>
                            </div>
                            {formData.applicationFormApproved && (
                              <p className="text-xs text-green-600 mt-1">✓ Enables Interview Form</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Interview Form */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-green-900">Interview Form</h4>
                          <p className="text-xs text-green-600">Interview scheduling & details</p>
                        </div>
                        <div className="text-lg">
                          {formData.interviewFormCompleted ? '✅' : 
                           formData.applicationFormApproved ? '🎤' : '🔒'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs text-green-700">
                          <span className="font-medium">Status:</span> 
                          {!formData.applicationFormApproved ? 'Locked' :
                           formData.interviewFormCompleted ? 'Completed' : 'Available'}
                        </div>
                        
                        {formData.interviewFormCompleted && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  name="formApproval.interview"
                                  checked={formData.interviewFormApproved || false}
                                  onChange={handleInputChange}
                                  className="rounded border-green-300 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-xs font-medium text-green-700">Approve Interview</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => setShowInterviewModal(true)}
                                className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded transition-colors duration-200"
                              >
                                Review
                              </button>
                            </div>
                            {formData.interviewFormApproved && (
                              <p className="text-xs text-green-600 mt-1">✓ Completes Onboarding Process</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

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

        {/* Application Review Modal */}
        {showApplicationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="bg-blue-500 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Application Review</h3>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-96">
                {formData.applicationFormData ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{formData.applicationFormData.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{formData.applicationFormData.location || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{formData.applicationFormData.college || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{formData.applicationFormData.size || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Handle</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{formData.applicationFormData.instagram || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about us?</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{formData.applicationFormData.referral || 'Not provided'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No application data available</p>
                )}
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interview Review Modal */}
        {showInterviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="bg-green-500 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Interview Review</h3>
                <button
                  onClick={() => setShowInterviewModal(false)}
                  className="text-white hover:text-green-200 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-96">
                {formData.interviewFormData ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Interview Date</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{formData.interviewFormData.interviewDate || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{formData.interviewFormData.interviewTime || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Interview Format Preference</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{formData.interviewFormData.interviewFormat || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Why do you want to work with The Smith Agency?</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{formData.interviewFormData.motivation || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Previous Experience</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{formData.interviewFormData.experience || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Questions for Us</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{formData.interviewFormData.questions || 'Not provided'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No interview data available</p>
                )}
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={() => setShowInterviewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </>
  );
} 