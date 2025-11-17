import React, { useState } from 'react';
import type { Document } from '../../lib/types/database';
import { deleteDocument, getDocumentUrl, downloadDocument } from '../../lib/supabase/documents';

interface DocumentCardProps {
  document: Document;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: (documentId: string) => void;
  onView?: (document: Document) => void;
}

export default function DocumentCard({ 
  document, 
  selectionMode = false,
  isSelected = false,
  onSelect,
  onDelete, 
  onView 
}: DocumentCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Handle delete
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete ${document.file_name}?`)) {
      return;
    }

    setDeleting(true);

    const { error } = await deleteDocument(document.id, document.file_path);

    if (error) {
      alert(`Failed to delete: ${error.message}`);
    } else {
      if (onDelete) {
        onDelete(document.id);
      }
    }

    setDeleting(false);
  };

  // Handle download
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setDownloading(true);

    const { error } = await downloadDocument(document.file_path, document.file_name);

    if (error) {
      alert(`Failed to download: ${error.message}`);
    }

    setDownloading(false);
  };

  // Handle view
  const handleView = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onView) {
      onView(document);
    } else {
      // Default: open in new tab
      const { data: url, error } = await getDocumentUrl(document.file_path);
      if (error || !url) {
        alert('Failed to load document');
        return;
      }
      window.open(url, '_blank');
    }
  };

  // Get file icon
  const getFileIcon = () => {
    if (document.file_type === 'application/pdf') {
      return (
        <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          <text x="10" y="14" fontSize="6" textAnchor="middle" fill="white" fontWeight="bold">PDF</text>
        </svg>
      );
    }
    return (
      <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    );
  };

  // Get status badge
  const getStatusBadge = () => {
    const badges = {
      new: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🆕', label: 'New' },
      analyzed: { bg: 'bg-green-100', text: 'text-green-800', icon: '✓', label: 'Analyzed' },
      fraud_alert: { bg: 'bg-red-100', text: 'text-red-800', icon: '⚠️', label: 'Fraud Alert' },
      organized: { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📁', label: 'Organized' },
    };

    const badge = badges[document.status as keyof typeof badges] || badges.new;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <span className="mr-1">{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
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

  return (
    <div 
      className={`bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 group relative ${
        selectionMode ? 'cursor-pointer' : ''
      } ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'
      }`}
      onClick={() => {
        if (selectionMode && onSelect) {
          onSelect();
        }
      }}
    >
      {/* Selection Checkbox Overlay */}
      {selectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          />
        </div>
      )}

      {/* Card Header - File Icon */}
      <div className={`bg-gray-50 p-6 flex justify-center border-b border-gray-200 ${
        selectionMode && isSelected ? 'bg-blue-50' : ''
      }`}>
        {getFileIcon()}
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* File Name */}
        <h3 className="text-sm font-semibold text-gray-900 truncate mb-2" title={document.file_name}>
          {document.file_name}
        </h3>

        {/* Status Badge */}
        <div className="mb-3">
          {getStatusBadge()}
        </div>

        {/* Metadata */}
        <div className="space-y-1.5 text-xs text-gray-500 mb-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span>{formatFileSize(document.file_size)}</span>
          </div>
          
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatDate(document.uploaded_at)}</span>
          </div>
          
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="capitalize">{document.uploaded_by}</span>
          </div>
        </div>

        {/* Fraud Alert Info */}
        {document.status === 'fraud_alert' && document.fraud_score && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-xs">
            <div className="flex items-center text-red-800">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Risk Score: {Math.round(document.fraud_score * 100)}%</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* View Button */}
          <button
            onClick={handleView}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Download"
          >
            {downloading ? (
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center justify-center px-3 py-2 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Delete"
          >
            {deleting ? (
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
