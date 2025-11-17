import { useState, useEffect } from 'react';
import { getActivityLogs } from '../../lib/supabase/activity-logs';
import type { ActivityLog } from '../../lib/supabase/activity-logs';

interface Props {
  applicationId: string;
}

const activityIcons: Record<string, string> = {
  application_created: '📝',
  status_changed: '🔄',
  borrower_added: '👤',
  borrower_removed: '👋',
  application_updated: '✏️',
  application_deleted: '🗑️',
  document_uploaded: '📎',
};

const activityColors: Record<string, string> = {
  application_created: 'bg-blue-500',
  status_changed: 'bg-purple-500',
  borrower_added: 'bg-green-500',
  borrower_removed: 'bg-orange-500',
  application_updated: 'bg-yellow-500',
  application_deleted: 'bg-red-500',
  document_uploaded: 'bg-indigo-500',
};

export default function ActivityTimeline({ applicationId }: Props) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [applicationId]);

  async function loadActivities() {
    try {
      setLoading(true);
      const data = await getActivityLogs(applicationId);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-2 h-2 rounded-full bg-gray-200 mt-2"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full ${
                activityColors[activity.activity_type] || 'bg-gray-500'
              } flex items-center justify-center text-white font-medium flex-shrink-0`}
            >
              <span className="text-lg">
                {activityIcons[activity.activity_type] || '•'}
              </span>
            </div>
            {index < activities.length - 1 && (
              <div className="w-0.5 h-full bg-gray-200 flex-1 mt-2"></div>
            )}
          </div>
          <div className="flex-1 pb-4">
            <p className="text-sm font-medium text-gray-900">{activity.description}</p>
            <p className="text-xs text-gray-500 mt-1">{formatDate(activity.created_at)}</p>
            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                  View details
                </summary>
                <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(activity.metadata, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
