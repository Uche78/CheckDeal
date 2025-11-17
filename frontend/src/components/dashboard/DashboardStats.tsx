import { useState, useEffect } from 'react';
import { getApplicationStats } from '../../lib/supabase/applications';
import type { ApplicationStats } from '../../lib/types/database';

interface ApplicationStats {
  total: number;
  pending: number;
  in_progress: number;
  approved: number;
  denied: number;
  flagged: number;
}

export default function DashboardStats() {
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await getApplicationStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="card-body">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="card bg-red-50 border-red-200">
        <div className="card-body">
          <p className="text-red-600">{error || 'Failed to load statistics'}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Applications',
      value: stats.total,
      icon: '📋',
      colorClasses: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: '⏳',
      colorClasses: 'bg-yellow-50 text-yellow-700',
    },
    {
      label: 'In Progress',
      value: stats.in_progress,
      icon: '🔄',
      colorClasses: 'bg-indigo-50 text-indigo-700',
    },
    {
      label: 'Approved',
      value: stats.approved,
      icon: '✅',
      colorClasses: 'bg-green-50 text-green-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <div key={stat.label} className="card hover:shadow-lg transition-shadow">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">{stat.label}</span>
              <span className={`text-2xl ${stat.colorClasses} p-2 rounded-lg`}>{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
