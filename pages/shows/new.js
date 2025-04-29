import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';

export default function NewShow() {
  const router = useRouter();
  const { addShow } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    season: '',
    location: '',
    type: '',
    startDate: '',
    endDate: '',
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
      await addShow(formData);
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
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Add New Show</h2>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="mb-4">
            <label className="block mb-1 font-medium">Name</label>
            <input name="name" value={formData.name} onChange={handleChange} required className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Season</label>
            <input name="season" value={formData.season} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Location</label>
            <input name="location" value={formData.location} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Type</label>
            <input name="type" value={formData.type} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Start Date</label>
            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">End Date</label>
            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Adding...' : 'Add Show'}</Button>
        </form>
      </DashboardLayout>
    </>
  );
}
