import React, { useState, useEffect } from 'react';
import { getDocuments, deleteDocument } from '../../lib/supabase/documents';
import type { Document } from '../../lib/types/database';
import DocumentCard from './DocumentCard';
import DocumentPreviewModal from './DocumentPreviewModal';

interface DocumentsListProps {
  applicationId: string;
}

export default function DocumentsList({ applicationId }: DocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'new' | 'analyzed' | 'fraud_alert'>('all');
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  
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

  // Filter documents
  const filteredDocuments = filter === 'all' 
    ? documents 
    : documents.filter(doc => doc.status === filter);

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

      {/* Task 3.12: Bulk Actions Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {!selectionMode ? (
            <button
              onClick={toggleSelectionMode}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Select Documents
            </button>
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

      {/* Documents Grid */}
      {filteredDocuments.length > 0 && (
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
