import React, { useState, useEffect } from 'react';
import { getDocuments, deleteDocument } from '../../lib/supabase/documents';
import type { Document } from '../../lib/types/database';
import DocumentCard from './DocumentCard';
import DocumentPreviewModal from './DocumentPreviewModal';
import DocumentTypeBadge from './DocumentTypeBadge';
import UploadZone from '../upload/UploadZone';

interface DocumentsListProps {
  applicationId: string;
}

export default function DocumentsList({ applicationId }: DocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'new' | 'analyzed' | 'fraud_alert'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Task 3.12: Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Load documents
  useEffect(() => {
    loadDocuments();
  }, [applicationId]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getDocuments(applicationId);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setDocuments(data || []);
    }

    setLoading(false);
  };

  // Filter documents by status and type
  let filteredDocuments = filter === 'all' 
    ? documents 
    : documents.filter(doc => doc.status === filter);
  
  // Apply type filter
  if (typeFilter !== 'all') {
    filteredDocuments = filteredDocuments.filter(doc => 
      doc.document_type === typeFilter || doc.category === typeFilter
    );
  }

  // Get counts by status
  const counts = {
    all: documents.length,
    new: documents.filter(d => d.status === 'new').length,
    analyzed: documents.filter(d => d.status === 'analyzed').length,
    fraud_alert: documents.filter(d => d.status === 'fraud_alert').length,
  };

  // Handle preview navigation
  const handlePreviewNavigate = (direction: 'prev' | 'next') => {
    if (!previewDocument) return;

    const currentIndex = filteredDocuments.findIndex(d => d.id === previewDocument.id);
    
    if (direction === 'prev' && currentIndex > 0) {
      setPreviewDocument(filteredDocuments[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < filteredDocuments.length - 1) {
      setPreviewDocument(filteredDocuments[currentIndex + 1]);
    }
  };

  // Task 3.12: Toggle selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds(new Set());
  };

  // Task 3.12: Select/deselect all
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDocuments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocuments.map(d => d.id)));
    }
  };

  // Task 3.12: Toggle individual document
  const toggleDocumentSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Task 3.12: Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const count = selectedIds.size;
    if (!confirm(`Are you sure you want to delete ${count} document${count !== 1 ? 's' : ''}?`)) {
      return;
    }

    // Delete each selected document
    const deletePromises = Array.from(selectedIds).map(async (id) => {
      const doc = documents.find(d => d.id === id);
      if (!doc) return;
      
      return deleteDocument(id, doc.file_path);
    });

    await Promise.all(deletePromises);

    // Refresh list
    await loadDocuments();
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  // Task 3.12: Download all as ZIP
  const handleDownloadAll = async () => {
    if (selectedIds.size === 0) return;

    try {
      const response = await fetch('/api/documents/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_ids: Array.from(selectedIds)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create ZIP');
      }

      // Download the ZIP file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documents-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download documents');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-800">Failed to load documents</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilter('all')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              filter === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Documents
            <span className="ml-2 py-0.5 px-2 rounded-full bg-gray-100 text-gray-900 text-xs">
              {counts.all}
            </span>
          </button>
          <button
            onClick={() => setFilter('new')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              filter === 'new'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            New
            {counts.new > 0 && (
              <span className="ml-2 py-0.5 px-2 rounded-full bg-blue-100 text-blue-900 text-xs">
                {counts.new}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('analyzed')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              filter === 'analyzed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analyzed
            {counts.analyzed > 0 && (
              <span className="ml-2 py-0.5 px-2 rounded-full bg-gray-100 text-gray-900 text-xs">
                {counts.analyzed}
              </span>
            )}
          </button>
          {counts.fraud_alert > 0 && (
            <button
              onClick={() => setFilter('fraud_alert')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                filter === 'fraud_alert'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-red-500 hover:text-red-700 hover:border-red-300'
              }`}
            >
              Fraud Alerts
              <span className="ml-2 py-0.5 px-2 rounded-full bg-red-100 text-red-900 text-xs">
                {counts.fraud_alert}
              </span>
            </button>
          )}
        </nav>
      </div>

      {/* Upload Documents Button
      <div className="mb-4">
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload Documents
        </button>
      </div>*/}

      {/* Document Type Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Filter by Type:</label>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Types</option>
          <option value="bank_statement">Bank Statements</option>
          <option value="pay_stub">Pay Stubs</option>
          <option value="tax_return">Tax Returns</option>
          <option value="T4">T4s</option>
          <option value="employment_letter">Employment Letters</option>
          <option value="mortgage_statement">Mortgage Statements</option>
          <option value="credit_report">Credit Reports</option>
          <option value="income_employment">Income/Employment</option>
          <option value="property">Property</option>
          <option value="assets_liabilities">Assets/Liabilities</option>
          <option value="borrower_details">Borrower Details</option>
        </select>
      </div>
      </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2 border border-gray-300 rounded-md p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Grid View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="List View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      

      {/* Task 3.12: Bulk Actions Toolbar */}
       <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {!selectionMode ? (
            <>
              <button
                onClick={toggleSelectionMode}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Select Documents
              </button>
              
              {/* Refresh Button */}
              <button
                onClick={loadDocuments}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </>
          ) : (
            <>
            
              {/* Selection Mode Active */}
              <button
                onClick={toggleSelectAll}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {selectedIds.size === filteredDocuments.length ? (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Deselect All
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Select All
                  </>
                )}
              </button>

              <span className="text-sm text-gray-600">
                {selectedIds.size} of {filteredDocuments.length} selected
              </span>

              {selectedIds.size > 0 && (
                <>
                  <button
                    onClick={handleDownloadAll}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download ZIP
                  </button>

                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Selected
                  </button>
                </>
              )}

              <button
                onClick={toggleSelectionMode}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'No documents have been uploaded yet.'
              : `No ${filter.replace('_', ' ')} documents.`}
          </p>
        </div>
      )}

      {/* Documents Grid/List View */}
      {filteredDocuments.length > 0 && (
        <>
          {viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(doc.id)}
                  onSelect={() => toggleDocumentSelection(doc.id)}
                  onDelete={(documentId) => {
                    setDocuments(prev => prev.filter(d => d.id !== documentId));
                  }}
                  onView={(document) => {
                    if (!selectionMode) {
                      setPreviewDocument(document);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            // List View
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {selectionMode && (
                      <th className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === filteredDocuments.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded By
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.map((doc) => (
                    <DocumentListRow
                      key={doc.id}
                      document={doc}
                      selectionMode={selectionMode}
                      isSelected={selectedIds.has(doc.id)}
                      onSelect={() => toggleDocumentSelection(doc.id)}
                      onView={() => setPreviewDocument(doc)}
                      onDelete={(documentId) => {
                        setDocuments(prev => prev.filter(d => d.id !== documentId));
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

{/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowUploadModal(false)}
            />

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Upload Documents
                  </h3>
                  
                  <UploadZone
                    applicationId={applicationId}
                    uploadedBy="broker"
                    onUploadComplete={(doc) => {
                      console.log('Document uploaded:', doc);
                      loadDocuments(); // Refresh the list
                    }}
                  />

                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      onClick={() => setShowUploadModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

{/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  );
}

// List Row Component
interface DocumentListRowProps {
  document: Document;
  selectionMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onDelete: (id: string) => void;
}

function DocumentListRow({ 
  document, 
  selectionMode, 
  isSelected, 
  onSelect, 
  onView,
  onDelete 
}: DocumentListRowProps) {
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${document.file_name}?`)) {
      return;
    }

    setDeleting(true);
    const { error } = await deleteDocument(document.id, document.file_path);

    if (error) {
      alert(`Failed to delete: ${error.message}`);
    } else {
      onDelete(document.id);
    }

    setDeleting(false);
  };

  const handleDownload = async () => {
    setDownloading(true);
    const { error } = await downloadDocument(document.file_path, document.file_name);
    if (error) {
      alert(`Failed to download: ${error.message}`);
    }
    setDownloading(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = () => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing' },
      clean: { bg: 'bg-green-100', text: 'text-green-800', label: 'Clean' },
      analyzed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Analyzed' },
      flagged: { bg: 'bg-red-100', text: 'text-red-800', label: 'Flagged' },
      organized: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Organized' },
    };

    const badge = badges[document.status as keyof typeof badges] || badges.pending;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <tr 
      className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={() => selectionMode && onSelect()}
    >
      {selectionMode && (
        <td className="px-4 py-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
        </td>
      )}
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {document.file_type === 'application/pdf' ? (
              <svg className="h-10 w-10 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-10 w-10 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={document.file_name}>
              {document.file_name}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <DocumentTypeBadge 
          documentType={document.document_type} 
          category={document.category}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatFileSize(document.file_size)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(document.uploaded_at)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span className="capitalize">{document.uploaded_by === 'broker' ? 'Broker' : 'Borrower'}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="text-primary-600 hover:text-primary-900"
            title="View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            disabled={downloading}
            className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
            title="Download"
          >
            {downloading ? (
              <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            disabled={deleting}
            className="text-red-600 hover:text-red-900 disabled:opacity-50"
            title="Delete"
          >
            {deleting ? (
              <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
