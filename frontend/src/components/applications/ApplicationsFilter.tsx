import { useState, useEffect, useMemo } from 'react';
import { getApplicationsWithBorrowers, subscribeToApplications } from '../../lib/supabase/applications';
import type { ApplicationWithBorrowers } from '../../lib/types/database';

const statusConfig = {
  draft: {
    label: 'Draft',
    classes: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  collecting: {
    label: 'Collecting',
    classes: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  organized: {
    label: 'Organized',
    classes: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  analyzed: {
    label: 'Analyzed',
    classes: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  submitted: {
    label: 'Submitted',
    classes: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  approved: {
    label: 'Approved',
    classes: 'bg-green-100 text-green-800 border-green-200',
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-red-100 text-red-800 border-red-200',
  },
  complete: {
    label: 'Complete',
    classes: 'bg-green-100 text-green-800 border-green-200',
  },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function ApplicationsFilter() {
  // Real data from Supabase
  const [allApplications, setAllApplications] = useState<ApplicationWithBorrowers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Load applications from Supabase
  useEffect(() => {
    loadApplications();
    
    // Subscribe to real-time updates
    const subscription = subscribeToApplications(() => {
      loadApplications();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadApplications() {
    try {
      setLoading(true);
      setError(null);
      const data = await getApplicationsWithBorrowers();
      setAllApplications(data);
    } catch (err) {
      console.error('Error loading applications:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  // Helper function to get primary borrower name
  const getPrimaryBorrowerName = (app: ApplicationWithBorrowers) => {
    const primary = app.borrowers?.find(b => b.borrower_type === 'primary');
    return primary?.full_name || 'Unknown';
  };

  // Filter applications based on search and filters
  const filteredApplications = useMemo(() => {
    let filtered = [...allApplications];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((app) => {
        const borrowerName = getPrimaryBorrowerName(app).toLowerCase();
        return (
          borrowerName.includes(query) ||
          app.property_address.toLowerCase().includes(query) ||
          app.city.toLowerCase().includes(query) ||
          app.id.includes(query)
        );
      });
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Date filter
    if (dateFilter) {
      const now = new Date();
      filtered = filtered.filter((app) => {
        const appDate = new Date(app.created_at);
        
        switch (dateFilter) {
          case 'today':
            return appDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return appDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return appDate >= monthAgo;
          case 'quarter':
            const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            return appDate >= quarterAgo;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [allApplications, searchQuery, statusFilter, dateFilter]);

  // Calculate summary stats from filtered results
  const summaryStats = useMemo(() => {
    return {
      total: filteredApplications.length,
      draft: filteredApplications.filter((app) => app.status === 'draft').length,
      collecting: filteredApplications.filter((app) => app.status === 'collecting').length,
      organized: filteredApplications.filter((app) => app.status === 'organized').length,
      analyzed: filteredApplications.filter((app) => app.status === 'analyzed').length,
      submitted: filteredApplications.filter((app) => app.status === 'submitted').length,
      approved: filteredApplications.filter((app) => app.status === 'approved').length,
      rejected: filteredApplications.filter((app) => app.status === 'rejected').length,
    };
  }, [filteredApplications]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateFilter('');
  };

  const hasActiveFilters = searchQuery || statusFilter || dateFilter;

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Loading applications...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={loadApplications} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total</div>
          <div className="text-2xl font-bold text-gray-900">{summaryStats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Draft</div>
          <div className="text-2xl font-bold text-gray-600">{summaryStats.draft}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Collecting</div>
          <div className="text-2xl font-bold text-yellow-600">{summaryStats.collecting}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Organized</div>
          <div className="text-2xl font-bold text-blue-600">{summaryStats.organized}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Analyzed</div>
          <div className="text-2xl font-bold text-purple-600">{summaryStats.analyzed}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Submitted</div>
          <div className="text-2xl font-bold text-indigo-600">{summaryStats.submitted}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Approved</div>
          <div className="text-2xl font-bold text-green-600">{summaryStats.approved}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Rejected</div>
          <div className="text-2xl font-bold text-red-600">{summaryStats.rejected}</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="Search by name, address, or ID..."
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="collecting">Collecting</option>
              <option value="organized">Organized</option>
              <option value="analyzed">Analyzed</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="complete">Complete</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              id="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Search: "{searchQuery}"
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Status: {statusConfig[statusFilter as keyof typeof statusConfig]?.label || statusFilter}
              </span>
            )}
            {dateFilter && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Date: {dateFilter === 'week' ? 'This Week' : dateFilter === 'month' ? 'This Month' : dateFilter === 'quarter' ? 'This Quarter' : 'Today'}
              </span>
            )}
            <button onClick={clearFilters} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property Address
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <p className="mt-2 text-sm font-medium">No applications found</p>
                      <p className="mt-1 text-sm">
                        {allApplications.length === 0 
                          ? 'Create your first application to get started'
                          : 'Try adjusting your search or filters'}
                      </p>
                      {allApplications.length === 0 && (
                        <a href="/applications/new" className="mt-4 inline-block btn btn-primary">
                          Create Application
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-sm">
                              {getPrimaryBorrowerName(app).split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{getPrimaryBorrowerName(app)}</div>
                          <div className="text-sm text-gray-500">ID: {app.id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{app.property_address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(app.loan_amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${statusConfig[app.status]?.classes || statusConfig.draft.classes}`}>
                        {statusConfig[app.status]?.label || app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(app.created_at)}</div>
                      <div className="text-sm text-gray-500">Updated {formatDate(app.updated_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a href={`/applications/${app.id}`} className="text-primary-600 hover:text-primary-900">
                        View
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredApplications.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{filteredApplications.length}</span> of{' '}
                  <span className="font-medium">{allApplications.length}</span> applications
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
