import type { SupabaseClient } from '@supabase/supabase-js';
import { getAnalysisPrompt } from './prompts';
import type { IncomeMetrics } from '../types/database';

// Claude API configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

/**
 * Fetch all documents in the income_employment category
 */
async function fetchIncomeDocuments(supabase: SupabaseClient, applicationId: string) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('application_id', applicationId)
      .eq('category', 'income_employment')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching income documents:', error);
    return { data: null, error };
  }
}

/**
 * Call Claude API to analyze income documents
 */
async function callClaudeAPI(
  prompt: string,
  documentsText: string,
  stressTestEnabled: boolean
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

STRESS TEST: ${stressTestEnabled ? 'ENABLED - Apply stress test calculations' : 'DISABLED - Use contracted rates only'}

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
 * Calculate risk score based on income metrics
 */
function calculateIncomeRiskScore(metrics: IncomeMetrics): number {
  let score = 100; // Start with perfect score

  // Employment type risk
  if (metrics.employment_type === 'self-employed') {
    score -= 20;
  } else if (metrics.employment_type === 'commission') {
    score -= 15;
  } else if (metrics.employment_type === 'hourly') {
    score -= 10;
  }

  // Employment tenure risk
  if (metrics.employment_tenure_years < 1) {
    score -= 25;
  } else if (metrics.employment_tenure_years < 2) {
    score -= 15;
  } else if (metrics.employment_tenure_years < 5) {
    score -= 5;
  }

  // Income stability risk
  if (metrics.income_stability === 'concerning') {
    score -= 25;
  } else if (metrics.income_stability === 'variable') {
    score -= 15;
  }

  // GDS ratio risk
  if (metrics.gds_ratio !== null) {
    if (metrics.gds_ratio > 35) {
      score -= 20;
    } else if (metrics.gds_ratio > 32) {
      score -= 10;
    }
  }

  // TDS ratio risk
  if (metrics.tds_ratio !== null) {
    if (metrics.tds_ratio > 44) {
      score -= 25;
    } else if (metrics.tds_ratio > 40) {
      score -= 15;
    }
  }

  // Stress test risk
  if (metrics.stress_test_status === 'fail') {
    score -= 30;
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
function calculateApprovalLikelihood(metrics: IncomeMetrics, riskScore: number): number {
  let likelihood = riskScore;

  // Boost for stable salaried employment
  if (metrics.employment_type === 'salaried' && metrics.income_stability === 'stable') {
    likelihood += 10;
  }

  // Penalty for stress test failure
  if (metrics.stress_test_status === 'fail') {
    likelihood -= 20;
  }

  // Penalty for high debt ratios
  if (metrics.tds_ratio !== null && metrics.tds_ratio > 40) {
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
    'insufficient income',
    'stress test',
    'unstable employment',
    'high debt ratio',
    'self-employed without',
    'income gap',
    'recent job change',
    'cannot qualify',
  ];

  return cons.filter(con => 
    criticalKeywords.some(keyword => 
      con.toLowerCase().includes(keyword)
    )
  );
}

/**
 * Main function: Analyze income/employment documents
 */
export async function analyzeIncome(
  supabase: SupabaseClient,
  applicationId: string,
  stressTestEnabled: boolean = false
): Promise<{
  data: {
    pros: string[];
    cons: string[];
    recommendations: string[];
    key_metrics: IncomeMetrics;
    risk_score: number;
    risk_level: string;
    approval_likelihood: number;
    critical_issues: string[];
    processing_time_ms: number;
  } | null;
  error: any;
}> {
  try {
    // Step 1: Fetch income documents
    const { data: documents, error: fetchError } = await fetchIncomeDocuments(supabase, applicationId);
    
    if (fetchError || !documents || documents.length === 0) {
      return {
        data: null,
        error: fetchError || new Error('No income documents found'),
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

    // Step 3: Get the income analysis prompt
    const prompt = getAnalysisPrompt('income_employment');

    // Step 4: Call Claude API
    const { data: aiResponse, error: aiError } = await callClaudeAPI(
      prompt,
      documentsText,
      stressTestEnabled
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

    // Add stress test flag to metrics
    const enrichedMetrics: IncomeMetrics = {
      ...key_metrics,
      stress_test_enabled: stressTestEnabled,
    };

    // Step 6: Calculate risk score and approval likelihood
    const riskScore = calculateIncomeRiskScore(enrichedMetrics);
    const riskLevel = getRiskLevel(riskScore);
    const approvalLikelihood = calculateApprovalLikelihood(enrichedMetrics, riskScore);

    // Step 7: Identify critical issues
    const criticalIssues = identifyCriticalIssues(cons);

    // Step 8: Return structured result
    return {
      data: {
        pros,
        cons,
        recommendations,
        key_metrics: enrichedMetrics,
        risk_score: riskScore,
        risk_level: riskLevel,
        approval_likelihood: approvalLikelihood,
        critical_issues: criticalIssues,
        processing_time_ms,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in analyzeIncome:', error);
    return { data: null, error };
  }
}
