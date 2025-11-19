import { useState } from 'react';
import { createUploadToken } from '../../lib/supabase/upload-tokens';

interface GenerateUploadTokenProps {
  applicationId: string;
  onTokenGenerated: (token: string, tokenId: string, tokenData?: any) => void;
}

export default function GenerateUploadToken({ 
  applicationId, 
  onTokenGenerated 
}: GenerateUploadTokenProps) {
  const [expirationDays, setExpirationDays] = useState<number>(7);
  const [maxUploads, setMaxUploads] = useState<string>('');
  const [unlimitedUploads, setUnlimitedUploads] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate inputs
      if (expirationDays < 1 || expirationDays > 30) {
        setError('Expiration must be between 1 and 30 days');
        setLoading(false);
        return;
      }

      const maxUploadsValue = unlimitedUploads ? null : parseInt(maxUploads);
      
      if (!unlimitedUploads && (!maxUploadsValue || maxUploadsValue < 1)) {
        setError('Max uploads must be at least 1');
        setLoading(false);
        return;
      }

      // Create the token
      const { data, error: apiError } = await createUploadToken(
        applicationId,
        expirationDays,
        maxUploadsValue
      );

      if (apiError || !data) {
        setError(apiError?.message || 'Failed to generate link');
        setLoading(false);
        return;
      }

// Success - notify parent component with full token data
onTokenGenerated(data.token, data.id, data);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Generate token error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Generate Upload Link
      </h2>
      
      <p className="text-gray-600 mb-6">
        Create a secure link that borrowers can use to upload documents.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Expiration Days */}
        <div>
          <label 
            htmlFor="expirationDays" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Link Expiration
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              id="expirationDays"
              min="1"
              max="30"
              value={expirationDays}
              onChange={(e) => setExpirationDays(parseInt(e.target.value))}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              required
            />
            <span className="text-gray-600">days</span>
            <span className="text-sm text-gray-500">
              (Expires: {new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toLocaleDateString()})
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Link will expire after this many days (1-30)
          </p>
        </div>

        {/* Max Uploads */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Limit
          </label>
          
          <div className="space-y-3">
            {/* Unlimited Option */}
            <div className="flex items-center">
              <input
                type="radio"
                id="unlimited"
                name="uploadLimit"
                checked={unlimitedUploads}
                onChange={() => setUnlimitedUploads(true)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <label 
                htmlFor="unlimited" 
                className="ml-3 text-sm text-gray-700"
              >
                Unlimited uploads
              </label>
            </div>

            {/* Limited Option */}
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="limited"
                name="uploadLimit"
                checked={!unlimitedUploads}
                onChange={() => setUnlimitedUploads(false)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <label 
                htmlFor="limited" 
                className="text-sm text-gray-700"
              >
                Limit to
              </label>
              <input
                type="number"
                min="1"
                value={maxUploads}
                onChange={(e) => setMaxUploads(e.target.value)}
                disabled={unlimitedUploads}
                placeholder="10"
                className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
              <span className="text-sm text-gray-700">uploads</span>
            </div>
          </div>
          
          <p className="mt-1 text-sm text-gray-500">
            {unlimitedUploads 
              ? 'Borrower can upload any number of documents' 
              : 'Link will become inactive after maximum uploads reached'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Link'}
          </button>
        </div>
      </form>
    </div>
  );
}
