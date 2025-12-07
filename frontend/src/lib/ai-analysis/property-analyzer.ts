import type { SupabaseClient } from '@supabase/supabase-js';
import { getAnalysisPrompt } from './prompts';
import type { PropertyMetrics } from '../types/database';

// Claude API configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

/**
 * Fetch all documents in the property category
 */
async function fetchPropertyDocuments(supabase: SupabaseClient, applicationId: string) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('application_id', applicationId)
      .eq('category', 'property')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching property documents:', error);
    return { data: null, error };
  }
}

/**
 * Call Claude API to analyze property documents
 */
async function callClaudeAPI(
  prompt: string,
  documentsText: string
): Promise<{ data: any; error: any }> {
  const startTime = Date.now();

  try {
    // Get Claude API key from environment
    const apiKey = import.meta.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not found in environment variables');
    }

    // Build the full prompt with documents
    const fullPrompt = `
${prompt}

DOCUMENTS TO ANALYZE:
${documentsText}

Remember: Respond ONLY with valid JSON in the specified format. No additional text.
`;

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const processingTime = Date.now() - startTime;

    // Extract the text content from Claude's response
    const textContent = result.content[0].text;

    // Parse the JSON response
    let parsedResponse;
    try {
      // Remove markdown code blocks if present
      const cleanedText = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', textContent);
      throw new Error('Failed to parse AI response as JSON');
    }

    return {
      data: {
        ...parsedResponse,
        processing_time_ms: processingTime,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return { data: null, error };
  }
}

/**
 * Calculate risk score based on property metrics
 */
function calculatePropertyRiskScore(metrics: PropertyMetrics): number {
  let score = 100; // Start with perfect score

  // LTV ratio risk
  if (metrics.ltv_ratio > 95) {
    score -= 30; // Very high LTV (CMHC insured)
  } else if (metrics.ltv_ratio > 80) {
    score -= 20; // High LTV
  } else if (metrics.ltv_ratio > 65) {
    score -= 10; // Moderate LTV
  }

  // Down payment risk
  if (metrics.down_payment_percentage < 5) {
    score -= 25; // Insufficient down payment
  } else if (metrics.down_payment_percentage < 10) {
    score -= 15; // Low down payment
  } else if (metrics.down_payment_percentage < 20) {
    score -= 5; // Requires CMHC
  }

  // Price vs appraisal risk
  if (metrics.price_vs_appraisal === 'above_value') {
    score -= 30; // Property overpriced
  } else if (metrics.price_vs_appraisal === 'no_appraisal') {
    score -= 15; // No appraisal yet
  }

  // Property condition risk
  if (metrics.property_condition === 'poor') {
    score -= 30;
  } else if (metrics.property_condition === 'fair') {
    score -= 15;
  } else if (metrics.property_condition === 'unknown') {
    score -= 10;
  }

  // Property type risk (condo has more complexity)
  if (metrics.property_type === 'condo') {
    score -= 5; // Condo has additional requirements
  }

  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, score));
}

/**
 * Determine risk level from score
 */
function getRiskLevel(score: number): string {
  if (score >= 70) return 'low';
  if (score >= 40) return 'medium';
  return 'high';
}

/**
 * Calculate approval likelihood based on metrics
 */
function calculateApprovalLikelihood(metrics: PropertyMetrics, riskScore: number): number {
  let likelihood = riskScore;

  // Boost for low LTV
  if (metrics.ltv_ratio <= 65) {
    likelihood += 10;
  }

  // Boost for appraisal at or above purchase price
  if (metrics.price_vs_appraisal === 'at_value' || metrics.price_vs_appraisal === 'below_value') {
    likelihood += 10;
  }

  // Boost for excellent property condition
  if (metrics.property_condition === 'excellent') {
    likelihood += 5;
  }

  // Penalty for overpriced property
  if (metrics.price_vs_appraisal === 'above_value') {
    likelihood -= 20;
  }

  // Penalty for poor condition
  if (metrics.property_condition === 'poor') {
    likelihood -= 15;
  }

  // Ensure likelihood stays within 0-100 range
  return Math.max(0, Math.min(100, likelihood));
}

/**
 * Identify critical issues from cons
 */
function identifyCriticalIssues(cons: string[]): string[] {
  const criticalKeywords = [
    'overpriced',
    'appraisal below',
    'poor condition',
    'structural issues',
    'title issues',
    'zoning',
    'non-conforming',
    'low appraisal',
    'price exceeds',
    'cannot secure',
  ];

  return cons.filter(con => 
    criticalKeywords.some(keyword => 
      con.toLowerCase().includes(keyword)
    )
  );
}

/**
 * Identify missing documents
 */
function identifyMissingDocuments(documents: any[]): string[] {
  const missing: string[] = [];
  
  const documentTypes = documents.map(doc => 
    doc.document_type?.toLowerCase() || ''
  );

  // Check for essential property documents
  if (!documentTypes.some(type => type.includes('purchase') || type.includes('agreement') || type.includes('sale'))) {
    missing.push('Purchase and Sale Agreement');
  }

  if (!documentTypes.some(type => type.includes('appraisal'))) {
    missing.push('Property Appraisal Report');
  }

  if (!documentTypes.some(type => type.includes('inspection'))) {
    missing.push('Property Inspection Report (recommended)');
  }

  // Check for condo-specific documents
  const hasCondo = documents.some(doc => 
    doc.extracted_text?.toLowerCase().includes('condo') ||
    doc.extracted_text?.toLowerCase().includes('condominium')
  );

  if (hasCondo) {
    if (!documentTypes.some(type => type.includes('status certificate'))) {
      missing.push('Condo Status Certificate');
    }
    if (!documentTypes.some(type => type.includes('reserve fund'))) {
      missing.push('Reserve Fund Study');
    }
  }

  return missing;
}

/**
 * Main function: Analyze property documents
 */
export async function analyzeProperty(
  supabase: SupabaseClient,
  applicationId: string
): Promise<{
  data: {
    pros: string[];
    cons: string[];
    recommendations: string[];
    key_metrics: PropertyMetrics;
    risk_score: number;
    risk_level: string;
    approval_likelihood: number;
    critical_issues: string[];
    missing_documents: string[];
    processing_time_ms: number;
  } | null;
  error: any;
}> {
  try {
    // Step 1: Fetch property documents
    const { data: documents, error: fetchError } = await fetchPropertyDocuments(supabase, applicationId);
    
    if (fetchError || !documents || documents.length === 0) {
      return {
        data: null,
        error: fetchError || new Error('No property documents found'),
      };
    }

    // Step 2: Prepare document text for analysis
    // Documents already have extracted_text from Sprint 4 - use it directly
    const documentsText = documents
      .map((doc, index) => {
        // Use existing extracted text
        const text = doc.extracted_text || 'No text extracted';
        
        // If we have structured data, include it too
        let structuredData = '';
        if (doc.extracted_data) {
          structuredData = `\nStructured Data:\n${JSON.stringify(doc.extracted_data, null, 2)}`;
        }
        
        return `
--- DOCUMENT ${index + 1}: ${doc.file_name} ---
Type: ${doc.document_type || 'Unknown'}
Uploaded: ${new Date(doc.uploaded_at).toLocaleDateString()}

${text}${structuredData}
---
`;
      })
      .join('\n\n');

    // Step 3: Get the property analysis prompt
    const prompt = getAnalysisPrompt('property');

    // Step 4: Call Claude API
    const { data: aiResponse, error: aiError } = await callClaudeAPI(
      prompt,
      documentsText
    );

    if (aiError || !aiResponse) {
      return { data: null, error: aiError || new Error('AI analysis failed') };
    }

    // Step 5: Extract and validate the response
    const { pros, cons, recommendations, key_metrics, processing_time_ms } = aiResponse;

    if (!pros || !cons || !recommendations || !key_metrics) {
      return {
        data: null,
        error: new Error('Incomplete AI response - missing required fields'),
      };
    }

    // Step 6: Calculate risk score and approval likelihood
    const riskScore = calculatePropertyRiskScore(key_metrics);
    const riskLevel = getRiskLevel(riskScore);
    const approvalLikelihood = calculateApprovalLikelihood(key_metrics, riskScore);

    // Step 7: Identify critical issues and missing documents
    const criticalIssues = identifyCriticalIssues(cons);
    const missingDocuments = identifyMissingDocuments(documents);

    // Step 8: Return structured result
    return {
      data: {
        pros,
        cons,
        recommendations,
        key_metrics,
        risk_score: riskScore,
        risk_level: riskLevel,
        approval_likelihood: approvalLikelihood,
        critical_issues: criticalIssues,
        missing_documents: missingDocuments,
        processing_time_ms,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in analyzeProperty:', error);
    return { data: null, error };
  }
}
