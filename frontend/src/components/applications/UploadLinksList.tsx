import { useState, useEffect } from 'react';
import { getUploadTokens, deleteUploadToken } from '../../lib/supabase/upload-tokens';
import LinkStatusBadge from './LinkStatusBadge';
import type { UploadToken } from '../../lib/types/database';

interface UploadLinksListProps {
  applicationId: string;
}

export default function UploadLinksList({ applicationId }: UploadLinksListProps) {
  const [tokens, setTokens] = useState<UploadToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'exhausted'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadTokens();
  }, [applicationId]);

  const loadTokens = async () => {
    setLoading(true);
    setError('');

    const { data, error: err } = await getUploadTokens(applicationId);

    if (err || !data) {
      setError('Failed to load upload links');
      setLoading(false);
      return;
    }

    setTokens(data);
    setLoading(false);
  };

  const filteredTokens = tokens.filter(token => {
    if (filter === 'all') return true;

    const now = new Date();
    const expiresAt = new Date(token.expires_at);
    const isExpired = expiresAt < now;
    const isExhausted = token.max_uploads !== null && token.uploads_count >= token.max_uploads;

    if (filter === 'active') return !isExpired && !isExhausted;
    if (filter === 'expired') return isExpired;
    if (filter === 'exhausted') return isExhausted;

    return true;
  });

  const copyLink = async (token: string, id: string) => {
    const uploadUrl = `${window.location.origin}/upload/${token}`;
    try {
      await navigator.clipboard.writeText(uploadUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDelete = async (tokenId: string) => {
    if (!confirm('Are you sure you want to delete this upload link?')) {
      return;
    }

    const { error: err } = await deleteUploadToken(tokenId);

    if (err) {
      alert('Failed to delete link');
      return;
    }

    setTokens(tokens.filter(t => t.id !== tokenId));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilExpiration = (expiresAt: string) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diff = expiration.getTime() - now.getTime();
    
    if (diff < 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Less than 1h';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
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

  if (tokens.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No upload links yet</h3>
        <p className="mt-2 text-gray-600">
          Create your first upload link to allow borrowers to upload documents.
        </p>
        <div className="mt-6">
          <button
            onClick={() => window.location.href =`/applications/${applicationId}/upload-link`}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Generate Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'all'
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({tokens.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'active'
                ? 'bg-green-100 text-green-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'expired'
                ? 'bg-gray-100 text-gray-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Expired
          </button>
          <button
            onClick={() => setFilter('exhausted')}
            className={`px-3 py-1 text-sm rounded-md ${
              filter === 'exhausted'
                ? 'bg-orange-100 text-orange-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Exhausted
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expires
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uploads
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTokens.map((token) => (
              <tr key={token.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <LinkStatusBadge
                    expiresAt={token.expires_at}
                    isUsed={token.is_used}
                    maxUploads={token.max_uploads}
                    uploadsCount={token.uploads_count}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(token.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(token.expires_at)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getTimeUntilExpiration(token.expires_at)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {token.uploads_count}
                  {token.max_uploads && ` / ${token.max_uploads}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => copyLink(token.token, token.id)}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    {copiedId === token.id ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    onClick={() => handleDelete(token.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTokens.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No {filter} links found
        </div>
      )}
    </div>
  );
}
