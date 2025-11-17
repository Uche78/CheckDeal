import { supabase } from './client';
import { getCurrentBroker } from './brokers';

export interface ActivityLog {
  id: string;
  application_id: string;
  broker_id: string;
  activity_type: string;
  description: string;
  metadata: any;
  created_at: string;
}

/**
 * Log an activity
 */
export async function logActivity(
  applicationId: string,
  activityType: string,
  description: string,
  metadata?: any
): Promise<void> {
  const broker = await getCurrentBroker();
  
  if (!broker) {
    console.error('No broker found for activity logging');
    return;
  }

  const { error } = await supabase
    .from('activity_logs')
    .insert({
      application_id: applicationId,
      broker_id: broker.id,
      activity_type: activityType,
      description,
      metadata: metadata || null,
    });

  if (error) {
    console.error('Error logging activity:', error);
  }
}

/**
 * Get activity logs for an application
 */
export async function getActivityLogs(applicationId: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Get recent activity logs for all applications
 */
export async function getRecentActivityLogs(limit: number = 10): Promise<ActivityLog[]> {
  const broker = await getCurrentBroker();
  
  if (!broker) {
    return [];
  }

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('broker_id', broker.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent activity logs:', error);
    return [];
  }

  return data || [];
}
