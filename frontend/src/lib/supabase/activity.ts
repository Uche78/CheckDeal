import { supabase } from './client';

export type ActivityType = 
  | 'application_created'
  | 'application_updated'
  | 'status_changed'
  | 'borrower_added'
  | 'borrower_updated'
  | 'borrower_removed'
  | 'document_uploaded'
  | 'document_deleted'
  | 'document_analyzed'
  | 'note_added';

export interface ActivityMetadata {
  [key: string]: any;
}

/**
 * Log an activity/event for an application
 */
export async function logActivity(
  applicationId: string,
  activityType: ActivityType,
  description: string,
  metadata?: ActivityMetadata
): Promise<void> {
  try {
    const { error } = await supabase
      .from('activities')
      .insert({
        application_id: applicationId,
        activity_type: activityType,
        description,
        metadata: metadata || {}
      });

    if (error) {
      console.error('Failed to log activity:', error);
      // Don't throw - activity logging should not break the main flow
    }
  } catch (err) {
    console.error('Activity logging error:', err);
    // Don't throw - activity logging should not break the main flow
  }
}

/**
 * Get all activities for an application
 */
export async function getActivities(applicationId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch activities:', error);
    return [];
  }

  return data || [];
}
