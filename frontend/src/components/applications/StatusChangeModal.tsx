import { useState } from 'react';
import { updateApplicationStatus } from '../../lib/supabase/applications';

interface Props {
  applicationId: string;
  currentStatus: 'pending' | 'in_progress' | 'approved' | 'denied' | 'flagged';
  onClose: () => void;
  onSuccess: () => void;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', description: 'Application received, awaiting review' },
  { value: 'in_progress', label: 'In Progress', description: 'Under review and processing' },
  { value: 'approved', label: 'Approved', description: 'Application has been approved' },
  { value: 'denied', label: 'Denied', description: 'Application has been denied' },
  { value: 'flagged', label: 'Flagged', description: 'Requires special attention' },
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  denied: 'bg-red-100 text-red-800 border-red-200',
  flagged: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function StatusChangeModal({ applicationId, currentStatus, onClose, onSuccess }: Props) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (newStatus === currentStatus) {
    alert('Please select a different status');
    return;
  }

  if (!confirm(`Are you sure you want to change the status to "${statusOptions.find(s => s.value === newStatus)?.label}"?`)) {
    return;
  }

  try {
    setSubmitting(true);
    await updateApplicationStatus(applicationId, newStatus as any);
    
    // Close modal first
    onClose();
    
    // Then call onSuccess (which reloads data)
    // Wrap in try-catch so errors don't show alert
    try {
      onSuccess();
    } catch (reloadError) {
      console.error('Error reloading data:', reloadError);
      // Just reload the page if reload fails
      window.location.reload();
    }
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Failed to update status. Please try again.');
    setSubmitting(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Change Application Status</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Status
            </label>
            <div className={`inline-flex items-center px-3 py-1 rounded-full border font-medium ${statusColors[currentStatus]}`}>
              {statusOptions.find(s => s.value === currentStatus)?.label}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700 mb-2">
              New Status <span className="text-red-500">*</span>
            </label>
            <select
              id="newStatus"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
              className="input"
              required
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-500">
              {statusOptions.find(s => s.value === newStatus)?.description}
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input"
              placeholder="Add any notes about this status change..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || newStatus === currentStatus}
              className="btn btn-primary"
            >
              {submitting ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
