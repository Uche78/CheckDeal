import { useState, useMemo } from 'react';

interface Application {
  id: string;
  applicantName: string;
  propertyAddress: string;
  loanAmount: number;
  status: 'pending' | 'in_progress' | 'approved' | 'denied' | 'flagged';
  submittedDate: string;
  lastUpdated: string;
}

const MOCK_APPLICATIONS: Application[] = [
  {
    id: '1',
    applicantName: 'John Smith',
    propertyAddress: '123 Main St, Toronto, ON',
    loanAmount: 450000,
    status: 'pending',
    submittedDate: '2024-11-10',
    lastUpdated: '2024-11-15',
  },
  {
    id: '2',
    applicantName: 'Sarah Johnson',
    propertyAddress: '456 Oak Ave, Mississauga, ON',
    loanAmount: 625000,
    status: 'in_progress',
    submittedDate: '2024-11-08',
    lastUpdated: '2024-11-14',
  },
  {
    id: '3',
    applicantName: 'Michael Brown',
    propertyAddress: '789 Elm St, Brampton, ON',
    loanAmount: 380000,
    status: 'approved',
    submittedDate: '2024-11-05',
    lastUpdated: '2024-11-13',
  },
  {
    id: '4',
    applicantName: 'Emily Davis',
    propertyAddress: '321 Maple Dr, Vaughan, ON',
    loanAmount: 550000,
    status: 'pending',
    submittedDate: '2024-11-12',
    lastUpdated: '2024-11-15',
  },
  {
    id: '5',
    applicantName: 'Robert Wilson',
    propertyAddress: '654 Pine Rd, Markham, ON',
    loanAmount: 720000,
    status: 'in_progress',
    submittedDate: '2024-11-07',
    lastUpdated: '2024-11-14',
  },
  {
    id: '6',
    applicantName: 'Jane Martinez',
    propertyAddress: '987 Cedar Ln, Richmond Hill, ON',
    loanAmount: 495000,
    status: 'flagged',
    submittedDate: '2024-11-09',
    lastUpdated: '2024-11-13',
  },
  {
    id: '7',
    applicantName: 'David Lee',
    propertyAddress: '147 Birch Ct, Ajax, ON',
    loanAmount: 425000,
    status: 'approved',
    submittedDate: '2024-11-03',
    lastUpdated: '2024-11-10',
  },
  {
    id: '8',
    applicantName: 'Lisa Anderson',
    propertyAddress: '258 Spruce Way, Pickering, ON',
    loanAmount: 685000,
    status: 'denied',
    submittedDate: '2024-11-01',
    lastUpdated: '2024-11-12',
  },
];

const statusConfig = {
  pending: {
    label: 'Pending',
    classes: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  in_progress: {
    label: 'In Progress',
    classes: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  approved: {
    label: 'Approved',
    classes: 'bg-green-100 text-green-800 border-green-200',
  },
  denied: {
    label: 'Denied',
    classes: 'bg-red-100 text-red-800 border-red-200',
  },
  flagged: {
    label: 'Flagged',
    classes: 'bg-orange-100 text-orange-800 border-orange-200',
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Filter applications based on search and filters
  const filteredApplications = useMemo(() => {
    let filtered = [...MOCK_APPLICATIONS];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.applicantName.toLowerCase().includes(query) ||
          app.propertyAddress.toLowerCase().includes(query) ||
          app.id.includes(query)
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Date filter
    if (dateFilter) {
      const now = new Date();
      filtered = filtered.filter((app) => {
        const appDate = new Date(app.submittedDate);
        
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
  }, [searchQuery, statusFilter, dateFilter]);

  // Calculate summary stats from filtered results
  const summaryStats = useMemo(() => {
    return {
      total: filteredApplications.length,
      pending: filteredApplications.filter((app) => app.status === 'pending').length,
      in_progress: filteredApplications.filter((app) => app.status === 'in_progress').length,
      approved: filteredApplications.filter((app) => app.status === 'approved').length,
      denied: filteredApplications.filter((app) => app.status === 'denied').length,
      flagged: filteredApplications.filter((app) => app.status === 'flagged').length,
    };
  }, [filteredApplications]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateFilter('');
  };

  const hasActiveFilters = searchQuery || statusFilter || dateFilter;

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total</div>
          <div className="text-2xl font-bold text-gray-900">{summaryStats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{summaryStats.pending}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">In Progress</div>
          <div className="text-2xl font-bold text-blue-600">{summaryStats.in_progress}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Approved</div>
          <div className="text-2xl font-bold text-green-600">{summaryStats.approved}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Denied</div>
          <div className="text-2xl font-bold text-red-600">{summaryStats.denied}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Flagged</div>
          <div className="text-2xl font-bold text-orange-600">{summaryStats.flagged}</div>
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
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="flagged">Flagged</option>
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
                Status: {statusConfig[statusFilter as keyof typeof statusConfig].label}
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
                  Submitted
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
                      <p className="mt-1 text-sm">Try adjusting your search or filters</p>
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
                              {app.applicantName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{app.applicantName}</div>
                          <div className="text-sm text-gray-500">ID: {app.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{app.propertyAddress.split(',')[0]}</div>
                      <div className="text-sm text-gray-500">{app.propertyAddress.split(',').slice(1).join(',').trim()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(app.loanAmount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${statusConfig[app.status].classes}`}>
                        {statusConfig[app.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(app.submittedDate)}</div>
                      <div className="text-sm text-gray-500">Updated {formatDate(app.lastUpdated)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <a href={`/applications/${app.id}`} className="text-primary-600 hover:text-primary-900">
                          View
                        </a>
                        <a href={`/applications/${app.id}/edit`} className="text-gray-600 hover:text-gray-900">
                          Edit
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredApplications.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Previous
              </button>
              <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredApplications.length}</span> of{' '}
                  <span className="font-medium">{filteredApplications.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-gray-50 text-sm font-medium text-primary-600">
                    1
                  </button>
                  <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
