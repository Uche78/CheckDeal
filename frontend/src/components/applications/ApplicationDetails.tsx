import { useState, useEffect } from 'react';
import { getApplicationWithBorrowersById, deleteApplication } from '../../lib/supabase/applications';
import type { ApplicationWithBorrowers } from '../../lib/types/database';
import AddBorrowerModal from './AddBorrowerModal';
import { deleteBorrower } from '../../lib/supabase/borrowers';
import StatusChangeModal from './StatusChangeModal';
import StatusBadge from './StatusBadge';
import ActivityTimeline from './ActivityTimeline';

interface Props {
  applicationId: string;
}

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

export default function ApplicationDetails({ applicationId }: Props) {
  const [application, setApplication] = useState<ApplicationWithBorrowers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusChange, setShowStatusChange] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  async function loadApplication() {
    try {
      setLoading(true);
      setError(null);
      const data = await getApplicationWithBorrowersById(applicationId);
      setApplication(data);
    } catch (err) {
      console.error('Error loading application:', err);
      setError('Failed to load application');
    } finally {
      setLoading(false);
    }
  }

const [showAddBorrower, setShowAddBorrower] = useState(false);

async function handleRemoveBorrower(borrowerId: string) {
  if (!confirm('Are you sure you want to remove this co-borrower?')) {
    return;
  }

  try {
    await deleteBorrower(borrowerId);
    // Reload application
    loadApplication();
  } catch (err) {
    console.error('Error removing borrower:', err);
    alert('Failed to remove borrower');
  }
}

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteApplication(applicationId);
      window.location.href = '/applications';
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Failed to delete application');
    }
  }

const handleChangeStatus = () => {
  setShowStatusChange(true);
};

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Loading application...</p>
      </div>
    );
  }

  if (error || !application) {
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

  // Get primary borrower
  const primaryBorrower = application.borrowers?.find(b => b.borrower_type === 'primary');

  // Calculate metrics
  const ltvRatio = ((application.loan_amount / application.property_value) * 100).toFixed(1);
  const downPaymentPercent = ((application.down_payment / application.property_value) * 100).toFixed(1);
  const monthlyIncome = (primaryBorrower?.annual_income || 0) / 12;
  const estimatedMonthlyPayment = application.loan_amount * 0.004;
  const dtiRatio = monthlyIncome > 0 ? ((estimatedMonthlyPayment / monthlyIncome) * 100).toFixed(1) : '0';

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
            {primaryBorrower?.full_name || 'Unknown Borrower'}
          </h1>
          <p className="text-gray-600">
            Application #{application.id.substring(0, 8)} • Submitted {formatDate(application.created_at)}
          </p>
        </div>
        <StatusBadge status={application.status as any} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

{/* Borrower Information - Enhanced to show all borrowers */}
<div className="card">
  <div className="card-header flex items-center justify-between">
    <h2 className="text-xl font-semibold text-gray-900">Borrower Information</h2>
    <button
      onClick={() => setShowAddBorrower(true)}
      className="btn btn-sm btn-primary"
    >
      + Add Co-Borrower
    </button>
  </div>
  <div className="card-body space-y-6">
    {application.borrowers?.map((borrower, index) => (
      <div key={borrower.id} className={`${index > 0 ? 'pt-6 border-t border-gray-200' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-medium text-sm">
                {borrower.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '?'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{borrower.full_name}</h3>
              <span className="text-xs text-gray-500 capitalize">
                {borrower.borrower_type.replace('_', ' ')}
              </span>
            </div>
          </div>
          {borrower.borrower_type !== 'primary' && (
            <button
              onClick={() => handleRemoveBorrower(borrower.id)}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {borrower.email ? (
              <a href={`mailto:${borrower.email}`} className="text-primary-600 hover:text-primary-700">
                {borrower.email}
              </a>
            ) : (
              <p className="text-gray-900">N/A</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            {borrower.phone ? (
              <a href={`tel:${borrower.phone}`} className="text-primary-600 hover:text-primary-700">
                {borrower.phone}
              </a>
            ) : (
              <p className="text-gray-900">N/A</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <p className="text-gray-900">
              {borrower.date_of_birth ? formatDate(borrower.date_of_birth) : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
            <p className="text-gray-900 capitalize">
              {borrower.employment_status?.replace(/-/g, ' ') || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
            <p className="text-gray-900">{borrower.employer || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income</label>
            <p className="text-gray-900 font-semibold">
              {borrower.annual_income ? formatCurrency(borrower.annual_income) : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    ))}
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
                  <p className="text-gray-900">{application.property_address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                  <p className="text-gray-900">{formatPropertyType(application.property_type)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                  <p className="text-gray-900 font-semibold">{formatCurrency(application.property_value)}</p>
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
                  <p className="text-gray-900 capitalize">{application.loan_purpose?.replace(/-/g, ' ') || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount</label>
                  <p className="text-gray-900 font-semibold text-lg">{formatCurrency(application.loan_amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Down Payment</label>
                  <p className="text-gray-900">{formatCurrency(application.down_payment)} ({downPaymentPercent}%)</p>
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

          {/* Analysis Dashboard Button */}
              <button
                onClick={() => window.location.href = `/applications/${application.id}/analysis`}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analysis Dashboard
              </button>

              <button
                onClick={() => window.location.href = `/applications/${application.id}/documents`}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                View Documents
              </button>

              <a 
                href={`/applications/${application.id}/edit`}
                className="w-full btn bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              >
                Edit Application
              </a>
              {primaryBorrower?.email && (
                <a 
                  href={`mailto:${primaryBorrower.email}`}
                  className="w-full btn bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                >
                  Contact Applicant
                </a>
              )}
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
             <ActivityTimeline applicationId={applicationId} />
            </div>
          </div>
        </div>
      </div>
{/* Add Borrower Modal */}
{showAddBorrower && (
  <AddBorrowerModal
    applicationId={applicationId}
    onClose={() => setShowAddBorrower(false)}
    onSuccess={() => {
      setShowAddBorrower(false);
      loadApplication();
    }}
  />
)}

{/* Status Change Modal */}
{showStatusChange && (
  <StatusChangeModal
    applicationId={applicationId}
    currentStatus={application.status as any}
    onClose={() => setShowStatusChange(false)}
    onSuccess={() => {
      setShowStatusChange(false);
      loadApplication();
    }}
  />
)}

    </div>
  );
}
