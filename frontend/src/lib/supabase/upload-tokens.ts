import type { UploadToken } from '../types/database';
import { getSupabaseClient } from '../supabase-client';

/**
 * Generate a new upload token for an application
 */
export async function generateUploadToken(
  applicationId: string,
  expiresInDays: number = 7,
  maxUploads: number | null = null
): Promise<{
  data: { token: UploadToken; upload_url: string } | null;
  error: Error | null;
}> {
  try {
    const response = await fetch('/api/upload-tokens/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id: applicationId,
        expires_in_days: expiresInDays,
        max_uploads: maxUploads
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: new Error(result.error || 'Failed to generate token')
      };
    }

    return {
      data: {
        token: result.token,
        upload_url: result.upload_url
      },
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to generate token')
    };
  }
}

/**
 * Validate an upload token
 */
export async function validateUploadToken(token: string): Promise<{
  data: { valid: boolean; token?: UploadToken } | null;
  error: Error | null;
}> {
  try {
    const response = await fetch('/api/upload-tokens/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    const result = await response.json();

    return {
      data: {
        valid: result.valid,
        token: result.token
      },
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to validate token')
    };
  }
}

/**
 * Get all tokens for an application
 */
export async function getApplicationTokens(applicationId: string): Promise<{
  data: UploadToken[] | null;
  error: Error | null;
}> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('upload_tokens')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to fetch tokens')
    };
  }
}

/**
 * Increment upload count for a token
 */
export async function incrementTokenUploadCount(tokenId: string): Promise<{
  error: Error | null;
}> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase.rpc('increment_token_uploads', {
      token_id: tokenId
    });

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Failed to update token')
    };
  }
}
