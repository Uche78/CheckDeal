import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Create a client with anon key for token validation
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return new Response(JSON.stringify({ 
        valid: false,
        error: 'Token required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Step 1: Validate token (anonymous access)
    const { data: uploadToken, error: tokenError } = await supabaseAnon
      .from('upload_tokens')
      .select('*')
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

    // Step 2: Fetch application data using service role (bypasses RLS)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: application, error: appError } = await supabaseService
      .from('applications')
      .select('id, property_address')
      .eq('id', uploadToken.application_id)
      .single();

    if (appError || !application) {
      console.error('Error fetching application:', appError);
      // Still return valid token, just without application data
      return new Response(JSON.stringify({ 
        valid: true,
        token: {
          ...uploadToken,
          applications: null
        },
        message: 'Token is valid'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch borrowers for this application
const { data: borrowers } = await supabaseService
  .from('borrowers')
  .select('full_name')
  .eq('application_id', application.id)
  .limit(1)
  .single();

const borrowerName = borrowers?.full_name || 'Applicant';


    return new Response(JSON.stringify({ 
      valid: true,
      token: {
        ...uploadToken,
        applications: {
          id: application.id,
          borrower_name: borrowerName,
          property_address: application.property_address
        }
      },
      message: 'Token is valid'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Validate token error:', error);
    return new Response(JSON.stringify({ 
      valid: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
