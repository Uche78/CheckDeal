import { useState } from 'react';
import StatusBadge from './StatusBadge';

interface Application {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  propertyAddress: string;
  city: string;
  province: string;
  postalCode: string;
  propertyType: string;
  purchasePrice: number;
  downPayment: number;
  loanAmount: number;
  loanPurpose: string;
  employmentStatus: string;
  employer: string;
  annualIncome: number;
  status: 'pending' | 'in_progress' | 'approved' | 'denied' | 'flagged';
  submittedDate: string;
  lastUpdated: string;
}

interface Props {
  applicationId: string;
}

// Mock data - will be replaced with Supabase query
const MOCK_APPLICATIONS: Record<string, Application> = {
  '1': {
    id: '1',
    applicantName: 'John Smith',
    email: 'john.smith@example.com',
    phone: '(416) 555-0123',
    dateOfBirth: '1990-01-15',
    propertyAddress: '123 Main Street',
    city: 'Toronto',
    province: 'ON',
    postalCode: 'M5V 3A8',
    propertyType: 'single-family',
    purchasePrice: 500000,
    downPayment: 100000,
    loanAmount: 400000,
    loanPurpose: 'purchase',
    employmentStatus: 'full-time',
    employer: 'Tech Corp Inc.',
    annualIncome: 85000,
    status: 'pending',
    submittedDate: '2024-11-10',
    lastUpdated: '2024-11-15',
  },
  '2': {
    id: '2',
    applicantName: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '(416) 555-0456',
    dateOfBirth: '1985-06-22',
    propertyAddress: '456 Oak Avenue',
    city: 'Mississauga',
    province: 'ON',
    postalCode: 'L5B 1M2',
    propertyType: 'condo',
    purchasePrice: 650000,
    downPayment: 130000,
    loanAmount: 520000,
    loanPurpose: 'purchase',
    employmentStatus: 'self-employed',
    employer: 'Johnson Consulting',
    annualIncome: 120000,
    status: 'in_progress',
    submittedDate: '2024-11-08',
    lastUpdated: '2024-11-14',
  },
  '3': {
    id: '3',
    applicantName: 'Michael Chen',
    email: 'mchen@example.com',
    phone: '(647) 555-0789',
    dateOfBirth: '1992-03-30',
    propertyAddress: '789 Maple Drive',
    city: 'Markham',
    province: 'ON',
    postalCode: 'L3R 5K9',
    propertyType: 'townhouse',
    purchasePrice: 750000,
    downPayment: 150000,
    loanAmount: 600000,
    loanPurpose: 'purchase',
    employmentStatus: 'full-time',
    employer: 'Finance Solutions Ltd',
    annualIncome: 95000,
    status: 'approved',
    submittedDate: '2024-11-05',
    lastUpdated: '2024-11-12',
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
    month: 'long',
    day: 'numeric',
  });
};

const formatPropertyType = (type: string) => {
  return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatEmploymentStatus = (status: string) => {
  return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatLoanPurpose = (purpose: string) => {
  return purpose.charAt(0).toUpperCase() + purpose.slice(1);
};

export default function ApplicationDetails({ applicationId }: Props) {
  const [application] = useState<Application | null>(
    MOCK_APPLICATIONS[applicationId] || null
  );

  if (!application) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Not Found</h2>
        <p className="text-gray-600 mb-6">The application you're looking for doesn't exist.</p>
        <a href="/applications" className="btn btn-primary">
          Back to Applications
        </a>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      // TODO: Delete from Supabase
      alert('Delete functionality will be implemented when connected to Supabase');
      // window.location.href = '/applications';
    }
  };

  const handleChangeStatus = () => {
    // TODO: Show modal to change status
    alert('Status change functionality will be implemented with Supabase');
  };

  // Calculate metrics
  const ltvRatio = ((application.loanAmount / application.purchasePrice) * 100).toFixed(1);
  const downPaymentPercent = ((application.downPayment / application.purchasePrice) * 100).toFixed(1);
  const monthlyIncome = application.annualIncome / 12;
  const estimatedMonthlyPayment = application.loanAmount * 0.004; // Rough estimate for demo
  const dtiRatio = ((estimatedMonthlyPayment / monthlyIncome) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <a 
              href="/applications" 
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </a>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {application.applicantName}
          </h1>
          <p className="text-gray-600">
            Application #{application.id} • Submitted {formatDate(application.submittedDate)}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Borrower Information */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Borrower Information</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <p className="text-gray-900">{application.applicantName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <p className="text-gray-900">{formatDate(application.dateOfBirth)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <a href={`mailto:${application.email}`} className="text-primary-600 hover:text-primary-700">
                    {application.email}
                  </a>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <a href={`tel:${application.phone}`} className="text-primary-600 hover:text-primary-700">
                    {application.phone}
                  </a>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                  <p className="text-gray-900">{formatEmploymentStatus(application.employmentStatus)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
                  <p className="text-gray-900">{application.employer}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income</label>
                  <p className="text-gray-900 font-semibold">{formatCurrency(application.annualIncome)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Property Information */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Property Information</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <p className="text-gray-900">
                    {application.propertyAddress}<br />
                    {application.city}, {application.province} {application.postalCode}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                  <p className="text-gray-900">{formatPropertyType(application.propertyType)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                  <p className="text-gray-900 font-semibold">{formatCurrency(application.purchasePrice)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Loan Details */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Loan Details</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan Purpose</label>
                  <p className="text-gray-900">{formatLoanPurpose(application.loanPurpose)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount</label>
                  <p className="text-gray-900 font-semibold text-lg">{formatCurrency(application.loanAmount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Down Payment</label>
                  <p className="text-gray-900">{formatCurrency(application.downPayment)} ({downPaymentPercent}%)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LTV Ratio</label>
                  <p className="text-gray-900">{ltvRatio}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Est. Monthly Payment</label>
                  <p className="text-gray-900">{formatCurrency(estimatedMonthlyPayment)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DTI Ratio</label>
                  <p className="text-gray-900">{dtiRatio}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
            </div>
            <div className="card-body space-y-3">
              <button 
                onClick={handleChangeStatus}
                className="w-full btn btn-primary"
              >
                Change Status
              </button>
              <a 
                href={`/applications/${application.id}/edit`}
                className="w-full btn bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              >
                Edit Application
              </a>
              <a 
                href={`mailto:${application.email}`}
                className="w-full btn bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              >
                Contact Applicant
              </a>
              <button 
                onClick={handleDelete}
                className="w-full btn bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
              >
                Delete Application
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">LTV Ratio</span>
                  <span className="text-sm font-semibold text-gray-900">{ltvRatio}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(parseFloat(ltvRatio), 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">DTI Ratio</span>
                  <span className="text-sm font-semibold text-gray-900">{dtiRatio}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(parseFloat(dtiRatio), 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Down Payment</span>
                  <span className="text-sm font-semibold text-gray-900">{downPaymentPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(parseFloat(downPaymentPercent), 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Application Updated</p>
                    <p className="text-xs text-gray-500">{formatDate(application.lastUpdated)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Application Submitted</p>
                    <p className="text-xs text-gray-500">{formatDate(application.submittedDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
