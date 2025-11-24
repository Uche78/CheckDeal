import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { upsertAnalysisResult } from '../../../lib/supabase/analysis-results';
import { analyzeIncome } from '../../../lib/ai-analysis/income-analyzer';
import { analyzeProperty } from '../../../lib/ai-analysis/property-analyzer';
import { analyzeBorrower } from '../../../lib/ai-analysis/borrower-analyzer';
import { analyzeAssets } from '../../../lib/ai-analysis/assets-analyzer';
import type { AnalysisSection } from '../../../lib/types/database';

/**
 * POST /api/analyze/[section]
 * 
 * Analyzes documents for a specific section of a mortgage application
 * Sections: income_employment, property, borrower_details, assets_liabilities
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    // Step 1: Validate section parameter
    const section = params.section as AnalysisSection;
    
    const validSections: AnalysisSection[] = [
      'income_employment',
      'property',
      'borrower_details',
      'assets_liabilities'
    ];

    if (!section || !validSections.includes(section)) {
      return new Response(
        JSON.stringify({
          error: `Invalid section. Must be one of: ${validSections.join(', ')}`
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Get request body
    const body = await request.json();
    const { application_id, stress_test_enabled } = body;

    if (!application_id) {
      return new Response(
        JSON.stringify({ error: 'application_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Verify user is authenticated - get from Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No access token found' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = authHeader.replace('Bearer ', '');

    // Create Supabase client for auth verification (with user token)
    const supabaseAuth = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    );

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for database operations (bypasses RLS)
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('DEBUG: Service role key exists?', !!serviceRoleKey);
    console.log('DEBUG: Service role key length:', serviceRoleKey?.length || 0);
    
    if (!serviceRoleKey) {
      console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not found in environment!');
      return new Response(
        JSON.stringify({ error: 'Server configuration error - missing service role key' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Step 4: Verify user owns this application
    // First, get the broker record for this user
    console.log('DEBUG: Looking up broker for user:', user.id);
    
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    console.log('DEBUG: Broker lookup result:', { broker, brokerError });

    if (brokerError || !broker) {
      return new Response(
        JSON.stringify({ 
          error: 'Broker profile not found',
          debug: { user_id: user.id, error: brokerError?.message }
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Now check if this broker owns the application
    console.log('DEBUG: Checking application ownership');
    console.log('DEBUG: application_id:', application_id);
    console.log('DEBUG: broker.id:', broker.id);
    
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, broker_id')
      .eq('id', application_id)
      .eq('broker_id', broker.id)
      .single();

    console.log('DEBUG: Query result:', { application, appError });

    if (appError || !application) {
      console.error('DEBUG: Application query failed:', appError);
      return new Response(
        JSON.stringify({ 
          error: 'Application not found or access denied',
          debug: {
            application_id,
            broker_id: broker.id,
            error: appError?.message
          }
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 5: Call the appropriate analyzer based on section
    let analysisResult;

    switch (section) {
      case 'income_employment':
        const stressTest = stress_test_enabled === true;
        analysisResult = await analyzeIncome(supabase, application_id, stressTest);
        break;

      case 'property':
        analysisResult = await analyzeProperty(supabase, application_id);
        break;

      case 'borrower_details':
        analysisResult = await analyzeBorrower(supabase, application_id);
        break;

      case 'assets_liabilities':
        analysisResult = await analyzeAssets(supabase, application_id);
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid section' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Step 6: Check if analysis succeeded
    if (analysisResult.error || !analysisResult.data) {
      console.error(`Analysis error for ${section}:`, analysisResult.error);
      return new Response(
        JSON.stringify({
          error: `Analysis failed: ${analysisResult.error?.message || 'Unknown error'}`
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const analysisData = analysisResult.data;

    // Step 7: Save analysis results to database
    const { data: savedAnalysis, error: saveError } = await upsertAnalysisResult(
      supabase,  // Pass the service role client
      application_id,
      section,
      {
        pros: analysisData.pros,
        cons: analysisData.cons,
        recommendations: analysisData.recommendations,
        key_metrics: analysisData.key_metrics,
        risk_score: analysisData.risk_score,
        risk_level: analysisData.risk_level,
        approval_likelihood: analysisData.approval_likelihood,
        critical_issues: analysisData.critical_issues,
        missing_documents: analysisData.missing_documents,
        ai_model: 'claude-sonnet-4-20250514',
        prompt_version: 'v1',
        processing_time_ms: analysisData.processing_time_ms,
      }
    );

    if (saveError) {
      console.error('Error saving analysis results:', saveError);
      return new Response(
        JSON.stringify({
          error: 'Failed to save analysis results',
          details: saveError.message
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 8: Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `${section} analysis completed successfully`,
        data: savedAnalysis,
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in analyze API:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * GET /api/analyze/[section]?application_id=xxx
 * 
 * Get existing analysis results for a section
 */
export const GET: APIRoute = async ({ params, url, request }) => {
  try {
    const section = params.section as AnalysisSection;
    const application_id = url.searchParams.get('application_id');

    if (!application_id) {
      return new Response(
        JSON.stringify({ error: 'application_id query parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is authenticated - get from Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = authHeader.replace('Bearer ', '');

    // Create Supabase client for auth verification
    const supabaseAuth = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    );

    // Verify the token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for database operations
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('DEBUG (GET): Service role key exists?', !!serviceRoleKey);
    
    if (!serviceRoleKey) {
      console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not found in environment!');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get analysis result
    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('application_id', application_id)
      .eq('section', section)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is not an error
      console.error('Error fetching analysis:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch analysis results' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: data || null,
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in GET analyze API:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
