import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';

export default function NewStaff() {
  const router = useRouter();
  const { addStaff } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    instagram: '',
    experience: 'Beginner',
    payRate: 15, // Default to minimum
    badges: [], // Array of badge names
    sizes: {
      height: '',
      bust: '', // or chest
      waist: '',
      hips: '',
      inseam: '',
      dress: '',
      jacket: '',
      shoe: '',
    },
  });

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
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
    } else if (name === 'payRate') {
      // Ensure pay rate is within valid range
      const rate = Math.max(15, Math.min(22, parseFloat(value) || 15));
      setFormData({ ...formData, [name]: rate });
    } else {
      setFormData({ ...formData, [name]: value });
    }
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
      await addStaff(formData);
      router.push('/staff');
    } catch (err) {
      setError('Failed to add staff member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Add Staff | The Smith Agency</title>
      </Head>
      <DashboardLayout>
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Add New Staff Member</h2>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="mb-4">
            <label className="block mb-1 font-medium">Name</label>
            <input name="name" value={formData.name} onChange={handleChange} required className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Email</label>
            <input name="email" value={formData.email} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Phone</label>
            <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Instagram</label>
            <input name="instagram" value={formData.instagram} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Experience Level</label>
            <select name="experience" value={formData.experience} onChange={handleChange} className="w-full border rounded p-2">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          
          {/* Pay Rate */}
          <div className="mb-4">
            <label className="block mb-1 font-medium">Pay Rate ($15-$22/hour)</label>
            <input 
              type="number" 
              name="payRate" 
              value={formData.payRate} 
              onChange={handleChange} 
              min="15" 
              max="22" 
              step="0.25"
              className="w-full border rounded p-2" 
            />
            <div className="text-sm text-gray-500 mt-1">
              Current rate: ${formData.payRate}/hour
            </div>
          </div>

          {/* Badges */}
          <div className="mb-6">
            <label className="block mb-2 font-medium">Badges</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3 bg-gray-50">
              {availableBadges.map(badge => (
                <label key={badge} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={formData.badges.includes(badge)}
                    onChange={() => handleBadgeToggle(badge)}
                    className="rounded"
                  />
                  <span className="text-sm">{badge}</span>
                </label>
              ))}
            </div>
            {formData.badges.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {formData.badges.map(badge => (
                  <span key={badge} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Height</label>
            <input name="sizes.height" value={formData.sizes.height} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Bust/Chest</label>
            <input name="sizes.bust" value={formData.sizes.bust} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Waist</label>
            <input name="sizes.waist" value={formData.sizes.waist} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Hips</label>
            <input name="sizes.hips" value={formData.sizes.hips} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Inseam</label>
            <input name="sizes.inseam" value={formData.sizes.inseam} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Dress Size</label>
            <input name="sizes.dress" value={formData.sizes.dress} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Jacket Size</label>
            <input name="sizes.jacket" value={formData.sizes.jacket} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Shoe Size</label>
            <input name="sizes.shoe" value={formData.sizes.shoe} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Adding...' : 'Add Staff'}</Button>
        </form>
      </DashboardLayout>
    </>
  );
}
