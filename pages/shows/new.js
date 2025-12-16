import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { ArrowLeftIcon, CalendarDaysIcon, MapPinIcon, TagIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function NewShow() {
  const router = useRouter();
  const { addShow } = useStore();
  const [formData, setFormData] = useState({
    season: '',
    location: '',
    type: '',
    customType: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Auto-generate show name
  const typeNames = { gift: 'Gift', apparel: 'Apparel', bridal: 'Bridal' };
  const year = formData.startDate ? new Date(formData.startDate).getFullYear() : new Date().getFullYear();
  const typeDisplay = formData.type === 'custom' ? formData.customType : typeNames[formData.type] || '';
  const generatedName = [
    formData.location || '',
    formData.season || '',
    typeDisplay,
    year
  ].filter(Boolean).join(' ') || 'New Show';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const finalType = formData.type === 'custom' ? formData.customType : formData.type;
      await addShow({ ...formData, name: generatedName, type: finalType });
      router.push('/shows');
    } catch (err) {
      setError('Failed to add show.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Add Show | The Smith Agency</title>
      </Head>
      <DashboardLayout>
        <div className="min-h-full bg-gradient-to-b from-secondary-50 to-white">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-secondary-200 px-4 sm:px-6 py-4">
            <div className="max-w-2xl mx-auto flex items-center gap-4">
              <Link href="/shows" className="p-2 hover:bg-secondary-100 rounded-lg transition-colors">
                <ArrowLeftIcon className="w-5 h-5 text-secondary-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-secondary-900">New Show</h1>
                <p className="text-xs text-secondary-500">Add a new show to your directory</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Show Name Preview */}
              <div className="bg-gradient-to-r from-primary-50 to-pink-50 rounded-2xl border border-primary-200 p-5">
                <label className="block text-xs font-medium text-primary-600 mb-1">Show Name</label>
                <p className="text-xl font-bold text-secondary-900">{generatedName}</p>
              </div>

              {/* Location, Type & Season */}
              <div className="bg-white rounded-2xl border border-secondary-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TagIcon className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-semibold text-secondary-900">Show Details</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-secondary-600 mb-1.5">Location</label>
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-3 py-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                    >
                      <option value="">Select</option>
                      <option value="ATL">ATL</option>
                      <option value="LA">LA</option>
                      <option value="NYC">NYC</option>
                      <option value="DAL">DAL</option>
                      <option value="LV">LV</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-600 mb-1.5">Type</label>
                    {formData.type === 'custom' ? (
                      <input
                        type="text"
                        name="customType"
                        value={formData.customType || ''}
                        onChange={handleChange}
                        placeholder="Enter type"
                        className="w-full px-3 py-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                      />
                    ) : (
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-3 py-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                      >
                        <option value="">Select</option>
                        <option value="gift">Gift</option>
                        <option value="apparel">Apparel</option>
                        <option value="bridal">Bridal</option>
                        <option value="custom">Other...</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-600 mb-1.5">Season</label>
                    <select
                      name="season"
                      value={formData.season}
                      onChange={handleChange}
                      className="w-full px-3 py-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                    >
                      <option value="">Select</option>
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                      <option value="Fall">Fall</option>
                      <option value="Winter">Winter</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-white rounded-2xl border border-secondary-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDaysIcon className="w-5 h-5 text-primary-500" />
                  <span className="text-sm font-semibold text-secondary-900">Show Dates</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-secondary-600 mb-1.5">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-600 mb-1.5">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-secondary-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Link href="/shows">
                  <Button variant="outline" type="button">Cancel</Button>
                </Link>
                <Button type="submit" variant="primary" disabled={loading} className="flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" />
                  {loading ? 'Creating...' : 'Create Show'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
