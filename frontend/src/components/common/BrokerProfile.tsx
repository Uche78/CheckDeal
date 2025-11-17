import { useState, useEffect } from 'react';
import { getCurrentBroker } from '../../lib/supabase/brokers';
import type { Broker } from '../../lib/types/database';

export default function BrokerProfile() {
  const [broker, setBroker] = useState<Broker | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBroker();
  }, []);

  async function loadBroker() {
    try {
      const data = await getCurrentBroker();
      setBroker(data);
    } catch (error) {
      console.error('Error loading broker:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    window.location.href = '/logout';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-primary-600 font-medium">?</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">Unknown User</p>
          <button onClick={handleSignOut} className="text-xs text-gray-500 hover:text-gray-700">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Get initials for avatar
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const displayName = broker.full_name || broker.company_name || broker.email?.split('@')[0] || 'Broker';
  const initials = getInitials(broker.full_name || broker.company_name || broker.email);
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-200">
      <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
        <span className="text-white font-medium text-sm">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
        <button 
          onClick={handleSignOut}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
