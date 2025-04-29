import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';

export default function NewClient() {
  const router = useRouter();
  const { addClient } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    location: '',
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

  return (
    <>
      <Head>
        <title>Add Client | The Smith Agency</title>
      </Head>
      <DashboardLayout>
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Add New Client</h2>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="mb-4">
            <label className="block mb-1 font-medium">Name</label>
            <input name="name" value={formData.name} onChange={handleChange} required className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Category</label>
            <input name="category" value={formData.category} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Location</label>
            <input name="location" value={formData.location} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Adding...' : 'Add Client'}</Button>
        </form>
      </DashboardLayout>
    </>
  );
}
