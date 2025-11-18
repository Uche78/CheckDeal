import { supabase } from './client';
import type { UploadToken, UploadTokenInsert } from '../types/database';

/**
 * Generate a random 32-character token
 */
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Create a new upload token
 */
export async function createUploadToken(
  applicationId: string,
  expirationDays: number,
  maxUploads: number | null = null
): Promise<{ data: UploadToken | null; error: any }> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    // Get broker ID
    const { data: broker } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!broker) {
      return { data: null, error: new Error('Broker profile not found') };
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // Generate unique token
    const token = generateToken();

    // Create token in database
    const { data, error } = await supabase
      .from('upload_tokens')
      .insert({
        application_id: applicationId,
        token: token,
        expires_at: expiresAt.toISOString(),
        max_uploads: maxUploads,
        created_by: broker.id,
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error creating upload token:', error);
    return { data: null, error };
  }
}

/**
 * Get all upload tokens for an application
 */
export async function getUploadTokens(
  applicationId: string
): Promise<{ data: UploadToken[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('upload_tokens')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (error) {
    console.error('Error fetching upload tokens:', error);
    return { data: null, error };
  }
}

/**
 * Get a single upload token by ID
 */
export async function getUploadToken(
  tokenId: string
): Promise<{ data: UploadToken | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('upload_tokens')
      .select('*')
      .eq('id', tokenId)
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error fetching upload token:', error);
    return { data: null, error };
  }
}

/**
 * Delete an upload token
 */
export async function deleteUploadToken(
  tokenId: string
): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('upload_tokens')
      .delete()
      .eq('id', tokenId);

    return { error };
  } catch (error) {
    console.error('Error deleting upload token:', error);
    return { error };
  }
}

/**
 * Validate a token and check if it's usable
 */
export async function validateUploadToken(
  token: string
): Promise<{ data: UploadToken | null; error: any; isValid: boolean }> {
  try {
    const { data, error } = await supabase
      .from('upload_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) {
      return { data: null, error, isValid: false };
    }

    // Check if token is valid
    const isExpired = new Date(data.expires_at) < new Date();
    const isExhausted = data.max_uploads !== null && data.uploads_count >= data.max_uploads;
    const isValid = !isExpired && !isExhausted && !data.is_used;

    return { data, error: null, isValid };
  } catch (error) {
    console.error('Error validating token:', error);
    return { data: null, error, isValid: false };
  }
}
