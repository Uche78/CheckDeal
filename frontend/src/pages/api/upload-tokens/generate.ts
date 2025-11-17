import type { APIRoute } from 'astro';
import { createServerClient } from '../../../lib/supabase-client';
import { randomUUID } from 'crypto';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createServerClient(cookies);

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get broker profile
    const { data: broker } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!broker) {
      return new Response(JSON.stringify({ error: 'Broker profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const body = await request.json();
    const { application_id, expires_in_days = 7, max_uploads = null } = body;

    if (!application_id) {
      return new Response(JSON.stringify({ error: 'Application ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify broker owns this application
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, broker_id')
      .eq('id', application_id)
      .single();

    if (appError || !application) {
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (application.broker_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized access to application' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique token
    const token = randomUUID();

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);

    // Create token in database
    const { data: uploadToken, error: tokenError } = await supabase
      .from('upload_tokens')
      .insert({
        application_id,
        token,
        expires_at: expiresAt.toISOString(),
        created_by: broker.id,
        max_uploads
      })
      .select()
      .single();

    if (tokenError) {
      console.error('Token creation error:', tokenError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create upload token',
        details: tokenError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate upload URL
    const uploadUrl = `${new URL(request.url).origin}/upload/${token}`;

    return new Response(JSON.stringify({ 
      success: true,
      token: uploadToken,
      upload_url: uploadUrl,
      message: 'Upload token generated successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Generate token error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
