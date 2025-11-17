import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Twilio credentials (you'll add these to .env.local)
const TWILIO_ACCOUNT_SID = import.meta.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = import.meta.env.TWILIO_PHONE_NUMBER;

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const body = await request.json();
    const { application_id, documents_count } = body;

    if (!application_id) {
      return new Response(JSON.stringify({ error: 'Application ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get application and broker details
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        borrower_name,
        property_address,
        brokers:broker_id (
          phone,
          first_name,
          last_name
        )
      `)
      .eq('id', application_id)
      .single();

    if (appError || !application) {
      return new Response(JSON.stringify({ error: 'Application not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const broker = application.brokers as any;
    
    if (!broker?.phone) {
      return new Response(JSON.stringify({ error: 'Broker phone not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Format phone number (remove any non-digits and add +1 for Canada)
    const phoneNumber = broker.phone.replace(/\D/g, '');
    const formattedPhone = phoneNumber.startsWith('1') ? `+${phoneNumber}` : `+1${phoneNumber}`;

    // Send SMS via Twilio
    const message = `DealCheck: ${application.borrower_name} uploaded ${documents_count} document${documents_count !== 1 ? 's' : ''} for ${application.property_address}. Review now: https://dealcheck.com/applications/${application_id}/documents`;

    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: TWILIO_PHONE_NUMBER,
          Body: message,
        }),
      }
    );

    if (!twilioResponse.ok) {
      const error = await twilioResponse.json();
      console.error('Twilio error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to send SMS',
        details: error 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'SMS sent successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Send SMS error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
