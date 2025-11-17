import React, { useState } from 'react';

interface SuccessMessageProps {
  documentsCount: number;
  borrowerName?: string;
  onNotifyBroker?: () => void;
  onDone?: () => void;
}

export default function SuccessMessage({ 
  documentsCount, 
  borrowerName,
  onNotifyBroker,
  onDone 
}: SuccessMessageProps) {
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);

  const handleNotify = async () => {
    if (onNotifyBroker) {
      setNotifying(true);
      await onNotifyBroker();
      setNotified(true);
      setNotifying(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="text-center">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Documents Uploaded Successfully!
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {documentsCount === 1 
            ? 'Your document has been securely uploaded.' 
            : `All ${documentsCount} documents have been securely uploaded.`
          } Your mortgage broker will be notified and will review them shortly.
        </p>

        {/* Upload Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 max-w-md mx-auto text-left">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Documents uploaded:</span>
            <span className="font-semibold text-gray-900">{documentsCount}</span>
          </div>
          {borrowerName && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">Applicant:</span>
              <span className="font-semibold text-gray-900">{borrowerName}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600">Status:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Submitted
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center space-x-4">
          {onNotifyBroker && !notified && (
            <button
              onClick={handleNotify}
              disabled={notifying}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {notifying ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Notifying...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Notify Broker Now
                </>
              )}
            </button>
          )}

          {notified && (
            <div className="inline-flex items-center px-6 py-3 text-base font-medium text-green-600">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Broker Notified
            </div>
          )}

          {onDone && (
            <button
              onClick={onDone}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Done
            </button>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need to upload more documents?{' '}
            <button 
              onClick={() => window.location.reload()} 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Upload more files
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
