import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import { ClockIcon, UserIcon, EyeIcon, PlusIcon, PencilIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    adminName: '',
    action: '',
    page: 1,
    limit: 50
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/admin-logs?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      
      const data = await response.json();
      setLogs(data.logs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'logout':
        return <UserIcon className="w-4 h-4" />;
      case 'page_view':
      case 'navigate':
        return <EyeIcon className="w-4 h-4" />;
      case 'create':
        return <PlusIcon className="w-4 h-4" />;
      case 'update':
        return <PencilIcon className="w-4 h-4" />;
      case 'delete':
        return <TrashIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getActionColor = (action) => {
    switch (action.toLowerCase()) {
      case 'login':
        return 'text-green-600 bg-green-50';
      case 'logout':
        return 'text-red-600 bg-red-50';
      case 'create':
        return 'text-blue-600 bg-blue-50';
      case 'update':
        return 'text-yellow-600 bg-yellow-50';
      case 'delete':
        return 'text-red-600 bg-red-50';
      case 'page_view':
      case 'navigate':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Activity Logs | The Smith Agency</title>
        <meta name="description" content="View all admin activity logs and actions" />
      </Head>

      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Activity Logs</h1>
            <p className="text-gray-600 mt-2">Track all data modifications with admin name and timestamp</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Name
                </label>
                <input
                  type="text"
                  value={filters.adminName}
                  onChange={(e) => setFilters(prev => ({ ...prev, adminName: e.target.value, page: 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Filter by admin name..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Type
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value, page: 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Actions</option>
                  <option value="LOGIN">Login</option>
                  <option value="LOGOUT">Logout</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="SEARCH">Search</option>
                  <option value="EXPORT">Export</option>
                  <option value="BULK_ACTION">Bulk Action</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => setFilters(prev => ({ ...prev, page: 1 }))}
                  className="w-full"
                >
                  Refresh Logs
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Data Modifications</h2>
            </div>

            {error && (
              <div className="px-6 py-4 bg-red-50 border-b border-red-200">
                <p className="text-red-600">Error: {error}</p>
              </div>
            )}

            <div className="divide-y divide-gray-200">
              {logs.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No admin activities match your current filters.
                  </p>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={`${log.id || index}`} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 p-2 rounded-full ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">{log.adminName}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{formatTimestamp(log.serverTimestamp || log.timestamp)}</p>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {log.details?.message || log.action}
                        </p>
                        
                        {log.details && Object.keys(log.details).length > 1 && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                              View details
                            </summary>
                            <pre className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2 overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {logs.length >= filters.limit && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <Button
                    variant="secondary"
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={filters.page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700">
                    Page {filters.page}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={logs.length < filters.limit}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}