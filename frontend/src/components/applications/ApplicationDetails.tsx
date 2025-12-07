import { useState, useEffect } from 'react';
import { getApplicationWithBorrowersById, deleteApplication } from '../../lib/supabase/applications';
import type { ApplicationWithBorrowers } from '../../lib/types/database';
import AddBorrowerModal from './AddBorrowerModal';
import { deleteBorrower } from '../../lib/supabase/borrowers';
import StatusChangeModal from './StatusChangeModal';
import StatusBadge from './StatusBadge';
import ActivityTimeline from './ActivityTimeline';
import AnalysisDashboard from './AnalysisDashboard';
import DocumentsList from './DocumentsList';
import RequiredDocumentsChecklist from './RequiredDocumentsChecklist';
import DocumentUploadSidebar from './DocumentUploadSidebar';

interface Props {
  applicationId: string;
}

type TabType = 'overview' | 'analysis' | 'documents' | 'contact';

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
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showAddBorrower, setShowAddBorrower] = useState(false);

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

  async function handleRemoveBorrower(borrowerId: string) {
    if (!confirm('Are you sure you want to remove this co-borrower?')) {
      return;
    }

    try {
      await deleteBorrower(borrowerId);
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
            <span className="font-semibold text-gray-800">Application#:</span> {application.id.substring(0, 8)}
            <br /> 
            <span className="font-semibold text-gray-800">Submitted:</span> {formatDate(application.created_at)}
          </p>
        </div>
        <StatusBadge status={application.status as any} />
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'overview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Overview
            </div>
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'analysis'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analysis
            </div>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'documents'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Documents
            </div>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'contact'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact
            </div>
          </button>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Tab Content */}
        <div className="lg:col-span-2">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Borrower Information */}
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
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <AnalysisDashboard applicationId={applicationId} />
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <DocumentsList applicationId={applicationId} />
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <ContactApplicant 
              application={application}
              primaryBorrower={primaryBorrower}
            />
          )}
        </div>

        {/* Sidebar - Dynamic based on active tab */}
        <div className="space-y-6">
          {/* Overview Tab Sidebar */}
          {activeTab === 'overview' && (
            <>
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

                  <button 
                    onClick={() => window.location.href = `/applications/${application.id}/edit`}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Edit Application
                  </button>

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
            </>
          )}

          {/* Analysis Tab Sidebar */}
          {activeTab === 'analysis' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Required Documents</h3>
              </div>
              <div className="card-body">
                <RequiredDocumentsChecklist applicationId={applicationId} />
              </div>
            </div>
          )}

          {/* Documents Tab Sidebar */}
          {activeTab === 'documents' && (
            <>
              {/* Upload Links Management */}
              <div className="card mb-6">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Upload Links</h3>
                </div>
                <div className="card-body space-y-3">
                  <p className="text-sm text-gray-600">
                    Generate secure links for borrowers to upload documents.
                  </p>
                  <a
                    href={`/applications/${application.id}/upload-link`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Generate New Link
                  </a>
                  <a
                    href={`/applications/${application.id}/upload-links`}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Manage All Links
                  </a>
                </div>
              </div>

              {/* Upload Document */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
                </div>
                <div className="card-body">
                  <DocumentUploadSidebar 
                    applicationId={applicationId}
                    onUploadSuccess={() => {
                      // Refresh the documents list when upload succeeds
                      window.location.reload();
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Contact Tab Sidebar */}
          {activeTab === 'contact' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">SMS</h3>
              </div>
              <div className="card-body text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="mt-3 text-sm font-medium text-gray-900">Coming Soon</p>
                <p className="mt-1 text-xs text-gray-500">
                  Send SMS notifications to borrowers
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
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

// Contact Applicant Component
function ContactApplicant({ application, primaryBorrower }: { 
  application: ApplicationWithBorrowers; 
  primaryBorrower: any;
}) {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!primaryBorrower?.email) {
      alert('No email address available for this applicant');
      return;
    }

    setSending(true);

    // Create mailto link with subject and body
    const mailtoLink = `mailto:${primaryBorrower.email}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(formData.message)}`;
    
    // Open default email client
    window.location.href = mailtoLink;
    
    setSending(false);
    setSent(true);
    
    // Reset form after 2 seconds
    setTimeout(() => {
      setFormData({ subject: '', message: '' });
      setSent(false);
    }, 2000);
  };

  if (!primaryBorrower?.email) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Email Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            This applicant doesn't have an email address on file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold text-gray-900">Contact Applicant</h2>
        <p className="text-sm text-gray-600 mt-1">Send an email to {primaryBorrower.full_name}</p>
      </div>
      <div className="card-body">
        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <svg className="mx-auto h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="mt-2 text-sm font-medium text-green-900">Email client opened!</p>
            <p className="text-xs text-green-700">Your default email application should now be open.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To:
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-600 font-medium text-sm">
                    {primaryBorrower.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || '?'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{primaryBorrower.full_name}</p>
                  <p className="text-xs text-gray-600">{primaryBorrower.email}</p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Re: Your Mortgage Application"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                id="message"
                rows={8}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={`Dear ${primaryBorrower.full_name},\n\nI wanted to follow up regarding your mortgage application...\n\nBest regards`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={sending}
                className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Opening...' : 'Open Email Client'}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ subject: '', message: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    This will open your default email application with the subject and message pre-filled. 
                    You can review and modify before sending.
                  </p>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
