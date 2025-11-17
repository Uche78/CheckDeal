import { useState, useEffect } from 'react';
import { getApplicationStats } from '../../lib/supabase/applications';
import type { ApplicationStats } from '../../lib/types/database';

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
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} class="card animate-pulse">
            <div class="card-body">
              <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div class="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div class="card bg-red-50 border-red-200">
        <div class="card-body">
          <p class="text-red-600">{error || 'Failed to load statistics'}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Applications',
      value: stats.total,
      icon: '📋',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'In Progress',
      value: stats.collecting + stats.organized,
      icon: '⏳',
      color: 'bg-yellow-50 text-yellow-700',
    },
    {
      label: 'Approved',
      value: stats.approved,
      icon: '✅',
      color: 'bg-green-50 text-green-700',
    },
    {
      label: 'Pending Review',
      value: stats.draft + stats.analyzed,
      icon: '👀',
      color: 'bg-purple-50 text-purple-700',
    },
  ];

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <div key={stat.label} class="card hover:shadow-lg transition-shadow">
          <div class="card-body">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-600">{stat.label}</span>
              <span class={`text-2xl ${stat.color} p-2 rounded-lg`}>{stat.icon}</span>
            </div>
            <p class="text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
