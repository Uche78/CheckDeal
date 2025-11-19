import { useState, useEffect } from 'react';
import { getDocumentUrl } from '../../lib/supabase/documents';

interface DocumentPreviewModalProps {
  document: {
    id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
  } | null;
  onClose: () => void;
}

export default function DocumentPreviewModal({ document, onClose }: DocumentPreviewModalProps) {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
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

          {/* Document Viewer */}
          <div className="flex-1 overflow-auto bg-gray-100 p-4">
            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {!loading && !error && documentUrl && (
              <>
                {/* PDF Preview */}
                {isPDF && (
                  <iframe
                    src={documentUrl}
                    className="w-full h-full min-h-[600px] rounded border-0"
                    title={document.file_name}
                  />
                )}

                {/* Image Preview */}
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
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {isPDF && 'Use your browser controls to zoom and navigate'}
              {isImage && 'Right-click to save or open in new tab'}
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
