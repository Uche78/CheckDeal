import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Create a client with anon key (for public access)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate token
    const { data: uploadToken, error: tokenError } = await supabase
      .from('upload_tokens')
      .select(`
        *,
        applications:application_id (
          id,
          borrower_name,
          property_address
        )
      `)
      .eq('token', token)
      .single();

    if (tokenError || !uploadToken) {
      return new Response(JSON.stringify({ 
        valid: false,
        error: 'Invalid token' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(uploadToken.expires_at);
    
    if (expiresAt < now) {
      return new Response(JSON.stringify({ 
        valid: false,
        error: 'Token has expired' 
      }), {
        status: 410,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if token has been used (if max_uploads is set)
    if (uploadToken.max_uploads !== null && uploadToken.uploads_count >= uploadToken.max_uploads) {
      return new Response(JSON.stringify({ 
        valid: false,
        error: 'Token upload limit reached' 
      }), {
        status: 410,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      valid: true,
      token: uploadToken,
      message: 'Token is valid'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Validate token error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
