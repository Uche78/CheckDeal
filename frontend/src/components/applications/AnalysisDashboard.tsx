import { useState, useEffect } from 'react';
import { getDocuments } from '../../lib/supabase/documents';
import { getAnalysisSummaryClient } from '../../lib/supabase/analysis-results';
import AnalyzeButton from '../analysis/AnalyzeButton';
import AnalysisStatus from '../analysis/AnalysisStatus';
import AnalysisResults from '../analysis/AnalysisResults';
import KeyMetrics from '../analysis/KeyMetrics';
import type { Document, AnalysisResult } from '../../lib/types/database';

interface AnalysisDashboardProps {
  applicationId: string;
}

export default function AnalysisDashboard({ applicationId }: AnalysisDashboardProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Analysis state
  const [analysisResults, setAnalysisResults] = useState<{
    income_employment: AnalysisResult | null;
    property: AnalysisResult | null;
    borrower_details: AnalysisResult | null;
    assets_liabilities: AnalysisResult | null;
    overall_summary: AnalysisResult | null;
  }>({
    income_employment: null,
    property: null,
    borrower_details: null,
    assets_liabilities: null,
    overall_summary: null,
  });

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [stressTestEnabled, setStressTestEnabled] = useState(false);

  useEffect(() => {
    loadDocuments();
    loadAnalysis();
  }, [applicationId]);

  const loadDocuments = async () => {
    setLoading(true);
    setError('');

    const { data, error: err } = await getDocuments(applicationId);

    if (err || !data) {
      setError('Failed to load documents');
      setLoading(false);
      return;
    }

    setDocuments(data);
    setLoading(false);
  };

  const loadAnalysis = async () => {
    const { data } = await getAnalysisSummaryClient(applicationId);
    if (data) {
      setAnalysisResults(data);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  // Calculate statistics
  const totalDocuments = documents.length;
  const analyzedDocuments = documents.filter(d => d.status === 'analyzed').length;
  const pendingDocuments = documents.filter(d => d.status === 'pending' || d.status === 'processing').length;
  
  // Documents by category
  const categoryBreakdown = documents.reduce((acc, doc) => {
    const category = doc.category || 'uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Documents by type
  const typeBreakdown = documents.reduce((acc, doc) => {
    if (doc.document_type) {
      acc[doc.document_type] = (acc[doc.document_type] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Extract financial insights
  const bankStatements = documents.filter(d => d.document_type === 'bank_statement' && d.extracted_data);
  const payStubs = documents.filter(d => d.document_type === 'pay_stub' && d.extracted_data);

  const totalBalance = bankStatements.reduce((sum, doc) => {
    return sum + (doc.extracted_data?.closing_balance || 0);
  }, 0);

  const totalIncome = payStubs.reduce((sum, doc) => {
    return sum + (doc.extracted_data?.gross_income || 0);
  }, 0);

  const allLargeTransactions = bankStatements.flatMap(doc => 
    doc.extracted_data?.large_transactions || []
  );

  // Required documents checklist
  const requiredDocs = {
    'bank_statement': { label: 'Bank Statements', required: 2 },
    'pay_stub': { label: 'Pay Stubs', required: 2 },
    'T4': { label: 'T4 Slips', required: 1 },
    'employment_letter': { label: 'Employment Letter', required: 1 },
    'drivers_license': { label: "Driver's License", required: 1 },
  };

  const completeness = Object.entries(requiredDocs).map(([type, config]) => {
    const count = documents.filter(d => d.document_type === type).length;
    return {
      type,
      label: config.label,
      required: config.required,
      current: count,
      complete: count >= config.required
    };
  });

  const completionPercentage = Math.round(
    (completeness.filter(c => c.complete).length / completeness.length) * 100
  );

  // Recent activity
  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      <AnalysisStatus
        type={statusMessage.type}
        message={statusMessage.message}
        onDismiss={() => setStatusMessage({ type: null, message: '' })}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Documents</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalDocuments}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Analyzed</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{analyzedDocuments}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingDocuments}</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{completionPercentage}%</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis by Category */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">AI Analysis by Category</h2>
        
        <div className="space-y-6">
          {/* Income & Employment Analysis */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Income & Employment</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {categoryBreakdown['income_employment'] || 0} documents
                </p>
              </div>
              <AnalyzeButton
                applicationId={applicationId}
                section="income_employment"
                documentCount={categoryBreakdown['income_employment'] || 0}
                hasExistingAnalysis={!!analysisResults.income_employment}
                stressTestEnabled={stressTestEnabled}
                onAnalysisComplete={() => {
                  setStatusMessage({
                    type: 'success',
                    message: 'Income & Employment analysis completed successfully!'
                  });
                  loadAnalysis();
                }}
                onAnalysisError={(error) => {
                  setStatusMessage({ type: 'error', message: error });
                }}
              />
            </div>
            
            {analysisResults.income_employment && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Risk Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analysisResults.income_employment.risk_score}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Risk Level</p>
                    <p className={`text-lg font-semibold capitalize ${
                      analysisResults.income_employment.risk_level === 'low' ? 'text-green-600' :
                      analysisResults.income_employment.risk_level === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {analysisResults.income_employment.risk_level}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Approval Likelihood</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analysisResults.income_employment.approval_likelihood}%
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Analysis completed {new Date(analysisResults.income_employment.analyzed_at || '').toLocaleString()}
                </p>
                
                <KeyMetrics 
                  section="income_employment" 
                  metrics={analysisResults.income_employment.key_metrics} 
                />
                
                <div className="mt-6">
                  <AnalysisResults
                    analysis={analysisResults.income_employment}
                    sectionName="Income & Employment"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Property Analysis */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Property</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {categoryBreakdown['property'] || 0} documents
                </p>
              </div>
              <AnalyzeButton
                applicationId={applicationId}
                section="property"
                documentCount={categoryBreakdown['property'] || 0}
                hasExistingAnalysis={!!analysisResults.property}
                onAnalysisComplete={() => {
                  setStatusMessage({
                    type: 'success',
                    message: 'Property analysis completed successfully!'
                  });
                  loadAnalysis();
                }}
                onAnalysisError={(error) => {
                  setStatusMessage({ type: 'error', message: error });
                }}
              />
            </div>
            
            {analysisResults.property && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Risk Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analysisResults.property.risk_score}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Risk Level</p>
                    <p className={`text-lg font-semibold capitalize ${
                      analysisResults.property.risk_level === 'low' ? 'text-green-600' :
                      analysisResults.property.risk_level === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {analysisResults.property.risk_level}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Approval Likelihood</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analysisResults.property.approval_likelihood}%
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Analysis completed {new Date(analysisResults.property.analyzed_at || '').toLocaleString()}
                </p>
                
                <KeyMetrics 
                  section="property" 
                  metrics={analysisResults.property.key_metrics} 
                />
                
                <div className="mt-6">
                  <AnalysisResults
                    analysis={analysisResults.property}
                    sectionName="Property"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Borrower Details Analysis */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Borrower Details</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {categoryBreakdown['borrower_details'] || 0} documents
                </p>
              </div>
              <AnalyzeButton
                applicationId={applicationId}
                section="borrower_details"
                documentCount={categoryBreakdown['borrower_details'] || 0}
                hasExistingAnalysis={!!analysisResults.borrower_details}
                onAnalysisComplete={() => {
                  setStatusMessage({
                    type: 'success',
                    message: 'Borrower Details analysis completed successfully!'
                  });
                  loadAnalysis();
                }}
                onAnalysisError={(error) => {
                  setStatusMessage({ type: 'error', message: error });
                }}
              />
            </div>
            
            {analysisResults.borrower_details && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Risk Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analysisResults.borrower_details.risk_score}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Risk Level</p>
                    <p className={`text-lg font-semibold capitalize ${
                      analysisResults.borrower_details.risk_level === 'low' ? 'text-green-600' :
                      analysisResults.borrower_details.risk_level === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {analysisResults.borrower_details.risk_level}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Approval Likelihood</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analysisResults.borrower_details.approval_likelihood}%
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Analysis completed {new Date(analysisResults.borrower_details.analyzed_at || '').toLocaleString()}
                </p>
                
                <KeyMetrics 
                  section="borrower_details" 
                  metrics={analysisResults.borrower_details.key_metrics} 
                />
                
                <div className="mt-6">
                  <AnalysisResults
                    analysis={analysisResults.borrower_details}
                    sectionName="Borrower Details"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Assets & Liabilities Analysis */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Assets & Liabilities</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {categoryBreakdown['assets_liabilities'] || 0} documents
                </p>
              </div>
              <AnalyzeButton
                applicationId={applicationId}
                section="assets_liabilities"
                documentCount={categoryBreakdown['assets_liabilities'] || 0}
                hasExistingAnalysis={!!analysisResults.assets_liabilities}
                onAnalysisComplete={() => {
                  setStatusMessage({
                    type: 'success',
                    message: 'Assets & Liabilities analysis completed successfully!'
                  });
                  loadAnalysis();
                }}
                onAnalysisError={(error) => {
                  setStatusMessage({ type: 'error', message: error });
                }}
              />
            </div>
            
            {analysisResults.assets_liabilities && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Risk Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analysisResults.assets_liabilities.risk_score}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Risk Level</p>
                    <p className={`text-lg font-semibold capitalize ${
                      analysisResults.assets_liabilities.risk_level === 'low' ? 'text-green-600' :
                      analysisResults.assets_liabilities.risk_level === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {analysisResults.assets_liabilities.risk_level}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Approval Likelihood</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analysisResults.assets_liabilities.approval_likelihood}%
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Analysis completed {new Date(analysisResults.assets_liabilities.analyzed_at || '').toLocaleString()}
                </p>
                
                <KeyMetrics 
                  section="assets_liabilities" 
                  metrics={analysisResults.assets_liabilities.key_metrics} 
                />
                
                <div className="mt-6">
                  <AnalysisResults
                    analysis={analysisResults.assets_liabilities}
                    sectionName="Assets & Liabilities"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Insights */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Insights</h3>
          
          {(totalBalance > 0 || totalIncome > 0) ? (
            <div className="space-y-4">
              {totalBalance > 0 && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Account Balance</p>
                    <p className="text-sm text-blue-500 mt-1">From {bankStatements.length} bank statement(s)</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              {totalIncome > 0 && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Income</p>
                    <p className="text-sm text-green-500 mt-1">From {payStubs.length} pay stub(s)</p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              {allLargeTransactions.length > 0 && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-600 font-medium mb-2">Large Transactions Detected</p>
                  <p className="text-2xl font-bold text-orange-900">{allLargeTransactions.length}</p>
                  <p className="text-sm text-orange-500 mt-1">Transactions over $500 requiring review</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 mt-2">No financial data extracted yet</p>
            </div>
          )}
        </div>

        {/* Document Completeness */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
          
          <div className="space-y-3">
            {completeness.map((item) => (
              <div key={item.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {item.complete ? (
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.current} of {item.required} required</p>
                  </div>
                </div>
                <span className={`text-sm font-medium ${item.complete ? 'text-green-600' : 'text-red-600'}`}>
                  {item.complete ? 'Complete' : 'Missing'}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-semibold text-gray-900">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Documents by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents by Category</h3>
          <div className="space-y-3">
            {Object.entries(categoryBreakdown).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 capitalize">{category.replace('_', ' ')}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents by Type</h3>
          <div className="space-y-3">
            {Object.entries(typeBreakdown).length > 0 ? (
              Object.entries(typeBreakdown).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{type.replace('_', ' ')}</span>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No documents classified yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentDocuments.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {doc.file_type === 'application/pdf' ? (
                    <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(doc.uploaded_at).toLocaleString()} • {doc.status}
                  </p>
                </div>
              </div>
              <a
                href={`/applications/${applicationId}/documents`}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
