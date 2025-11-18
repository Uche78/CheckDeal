import { useState } from 'react';

interface UploadTokenDisplayProps {
  token: string;
  onClose: () => void;
}

export default function UploadTokenDisplay({ token, onClose }: UploadTokenDisplayProps) {
  const [copied, setCopied] = useState(false);
  
  // Generate the full upload URL
  const uploadUrl = `${window.location.origin}/upload/${token}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(uploadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Upload Link Generated!
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Success!</h3>
            <p className="text-sm text-green-700 mt-1">
              Your upload link has been created. Share this link with the borrower to allow them to upload documents.
            </p>
          </div>
        </div>
      </div>

      {/* Link Display */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Link
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={uploadUrl}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 font-mono text-sm"
          />
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Send this link to the borrower via email or SMS
        </p>
      </div>

      {/* Close Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Done
        </button>
      </div>
    </div>
  );
}
