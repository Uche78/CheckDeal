import { useState, useEffect } from 'react';
import { getDocumentUrl } from '../../lib/supabase/documents';
import StructuredDataView from './StructuredDataView';

interface DocumentPreviewModalProps {
  document: {
    id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    extracted_text?: string | null;
    extracted_data?: any | null;
  } | null;
  onClose: () => void;
}

export default function DocumentPreviewModal({ document, onClose }: DocumentPreviewModalProps) {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'text' | 'data'>('preview');

  useEffect(() => {
    if (document) {
      loadDocument();
    }
  }, [document]);

  const loadDocument = async () => {
    if (!document) return;

    setLoading(true);
    setError('');

    const { data, error: err } = await getDocumentUrl(document.file_path);

    if (err || !data) {
      setError('Failed to load document');
      setLoading(false);
      return;
    }

    setDocumentUrl(data);
    setLoading(false);
  };

  if (!document) return null;

  const isPDF = document.file_type === 'application/pdf';
  const isImage = document.file_type.startsWith('image/');
  const hasExtractedText = document.extracted_text && document.extracted_text.trim().length > 0;
  const hasStructuredData = document.extracted_data && Object.keys(document.extracted_data).length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {document.file_name}
              </h2>
              <p className="text-sm text-gray-500">
                {(document.file_size / 1024).toFixed(2)} KB
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-4">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
                activeTab === 'preview'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Document Preview
            </button>
            {hasExtractedText && (
              <button
                onClick={() => setActiveTab('text')}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
                  activeTab === 'text'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Extracted Text
              </button>
            )}
            {hasStructuredData && (
              <button
                onClick={() => setActiveTab('data')}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px ${
                  activeTab === 'data'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Financial Data
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            {loading && activeTab === 'preview' && (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            )}

            {error && activeTab === 'preview' && (
              <div className="flex items-center justify-center h-full">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && activeTab === 'preview' && documentUrl && (
              <>
                {isPDF && (
                  <iframe
                    src={documentUrl}
                    className="w-full h-full min-h-[600px] rounded border-0"
                    title={document.file_name}
                  />
                )}

                {isImage && (
                  <div className="flex items-center justify-center h-full">
                    <img
                      src={documentUrl}
                      alt={document.file_name}
                      className="max-w-full max-h-full object-contain rounded shadow-lg"
                    />
                  </div>
                )}
              </>
            )}

            {activeTab === 'text' && hasExtractedText && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Extracted Text Content</h3>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded border border-gray-200 max-h-[600px] overflow-auto">
                  {document.extracted_text}
                </pre>
              </div>
            )}

            {activeTab === 'text' && !hasExtractedText && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No text extracted yet</h3>
                  <p className="mt-2 text-gray-600">
                    Text extraction is in progress or not available for this document.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'data' && hasStructuredData && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <StructuredDataView data={document.extracted_data} />
              </div>
            )}

            {activeTab === 'data' && !hasStructuredData && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No structured data available</h3>
                  <p className="mt-2 text-gray-600">
                    Financial data extraction is in progress or not available for this document.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {activeTab === 'preview' && isPDF && 'Use your browser controls to zoom and navigate'}
              {activeTab === 'preview' && isImage && 'Right-click to save or open in new tab'}
              {activeTab === 'text' && hasExtractedText && `${document.extracted_text?.length} characters extracted`}
              {activeTab === 'data' && hasStructuredData && 'Structured financial data extracted'}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
