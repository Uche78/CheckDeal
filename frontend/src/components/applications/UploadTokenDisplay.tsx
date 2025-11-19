import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import LinkStatusBadge from './LinkStatusBadge';

interface UploadTokenDisplayProps {
  token: string;
  tokenData?: {
    id: string;
    expires_at: string;
    is_used: boolean;
    max_uploads: number | null;
    uploads_count: number;
    created_at: string;
  };
  onClose: () => void;
}

export default function UploadTokenDisplay({ token, tokenData, onClose }: UploadTokenDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
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

  // Calculate time until expiration
  const getTimeUntilExpiration = () => {
    if (!tokenData) return '';
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    const diff = expiresAt.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return 'Less than 1 hour';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">
            Upload Link Generated!
          </h2>
          {tokenData && (
            <LinkStatusBadge
              expiresAt={tokenData.expires_at}
              isUsed={tokenData.is_used}
              maxUploads={tokenData.max_uploads}
              uploadsCount={tokenData.uploads_count}
            />
          )}
        </div>
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

      {/* Link Stats */}
      {tokenData && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Expires In</p>
            <p className="text-lg font-semibold text-gray-900">{getTimeUntilExpiration()}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Uploads</p>
            <p className="text-lg font-semibold text-gray-900">
              {tokenData.uploads_count}
              {tokenData.max_uploads && ` / ${tokenData.max_uploads}`}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Created</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(tokenData.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Link Display */}
      <div className="mb-6">
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
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center gap-2 whitespace-nowrap"
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

      {/* QR Code Section */}
      <div className="mb-6">
        <button
          onClick={() => setShowQR(!showQR)}
          className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          {showQR ? 'Hide QR Code' : 'Show QR Code'}
        </button>
        
        {showQR && (
          <div className="mt-4 p-6 bg-white border border-gray-200 rounded-lg flex flex-col items-center">
            <QRCodeSVG 
              value={uploadUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
            <p className="text-sm text-gray-600 mt-4 text-center">
              Scan with a mobile device to open the upload page
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
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
