import type { SupabaseClient } from '@supabase/supabase-js';
import { getAnalysisPrompt } from './prompts';
import type { BorrowerMetrics } from '../types/database';

// Claude API configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

/**
 * Fetch all documents in the borrower_details category
 */
async function fetchBorrowerDocuments(supabase: SupabaseClient, applicationId: string) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('application_id', applicationId)
      .eq('category', 'borrower_details')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching borrower documents:', error);
    return { data: null, error };
  }
}

/**
 * Call Claude API to analyze borrower documents
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
 * Calculate risk score based on borrower metrics
 */
function calculateBorrowerRiskScore(metrics: BorrowerMetrics): number {
  let score = 100; // Start with perfect score

  // Credit score risk
  if (metrics.credit_score !== null) {
    if (metrics.credit_score < 600) {
      score -= 40; // Poor credit
    } else if (metrics.credit_score < 650) {
      score -= 30; // Below average credit
    } else if (metrics.credit_score < 680) {
      score -= 20; // Fair credit
    } else if (metrics.credit_score < 700) {
      score -= 10; // Good credit
    }
    // 700+ is excellent, no penalty
  } else {
    score -= 20; // No credit score available
  }

  // Adverse credit events risk
  if (metrics.adverse_credit_events.length > 0) {
    score -= Math.min(30, metrics.adverse_credit_events.length * 10); // Max -30
  }

  // Recent credit inquiries risk
  if (metrics.recent_inquiries_count > 5) {
    score -= 20; // Many recent inquiries
  } else if (metrics.recent_inquiries_count > 3) {
    score -= 10; // Several recent inquiries
  }

  // New immigrant status (needs more documentation)
  if (metrics.years_in_canada !== null && metrics.years_in_canada < 2) {
    score -= 15; // Recent immigrant
  }

  // Marital status risk
  if (metrics.marital_status_risk === 'recent_divorce') {
    score -= 15;
  } else if (metrics.marital_status_risk === 'separation_pending') {
    score -= 20; // Higher uncertainty
  }

  // Overall risk level (from AI analysis)
  if (metrics.overall_risk_level === 'high') {
    score -= 25;
  } else if (metrics.overall_risk_level === 'medium') {
    score -= 10;
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
function calculateApprovalLikelihood(metrics: BorrowerMetrics, riskScore: number): number {
  let likelihood = riskScore;

  // Boost for excellent credit
  if (metrics.credit_score !== null && metrics.credit_score >= 740) {
    likelihood += 15;
  }

  // Boost for clean credit history
  if (metrics.adverse_credit_events.length === 0) {
    likelihood += 10;
  }

  // Penalty for bankruptcy or consumer proposal
  const hasBankruptcy = metrics.adverse_credit_events.some(event => 
    event.toLowerCase().includes('bankruptcy') || 
    event.toLowerCase().includes('consumer proposal')
  );
  if (hasBankruptcy) {
    likelihood -= 25;
  }

  // Penalty for recent divorce/separation
  if (metrics.marital_status_risk !== 'none') {
    likelihood -= 10;
  }

  // Penalty for many recent inquiries (credit shopping)
  if (metrics.recent_inquiries_count > 5) {
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
    'bankruptcy',
    'consumer proposal',
    'poor credit',
    'low credit score',
    'collections',
    'judgments',
    'foreclosure',
    'late payments',
    'undischarged',
    'recent divorce',
    'separation',
    'insufficient credit history',
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

  // Check for essential borrower documents
  if (!documentTypes.some(type => type.includes('credit report') || type.includes('credit bureau'))) {
    missing.push('Credit Report (Equifax or TransUnion)');
  }

  if (!documentTypes.some(type => type.includes('id') || type.includes('identification') || type.includes('driver') || type.includes('passport'))) {
    missing.push('Government-Issued ID');
  }

  if (!documentTypes.some(type => type.includes('proof of address') || type.includes('utility bill'))) {
    missing.push('Proof of Address (recommended)');
  }

  // Check for situation-specific documents
  const textContent = documents.map(doc => doc.extracted_text?.toLowerCase() || '').join(' ');

  // Check for bankruptcy/proposal mentions
  if (textContent.includes('bankruptcy') || textContent.includes('consumer proposal')) {
    if (!documentTypes.some(type => type.includes('discharge') || type.includes('bankruptcy'))) {
      missing.push('Bankruptcy Discharge Papers');
    }
  }

  // Check for divorce mentions
  if (textContent.includes('divorce') || textContent.includes('separated')) {
    if (!documentTypes.some(type => type.includes('divorce') || type.includes('separation'))) {
      missing.push('Divorce Decree or Separation Agreement');
    }
  }

  // Check for new immigrant
  if (textContent.includes('immigrant') || textContent.includes('permanent resident')) {
    if (!documentTypes.some(type => type.includes('immigration') || type.includes('work permit') || type.includes('pr card'))) {
      missing.push('Immigration Documents (PR Card or Work Permit)');
    }
  }

  // Check for credit issues that need explanation
  if (textContent.includes('late payment') || textContent.includes('collection') || textContent.includes('judgment')) {
    if (!documentTypes.some(type => type.includes('letter of explanation') || type.includes('explanation letter'))) {
      missing.push('Letter of Explanation for Credit Issues');
    }
  }

  return missing;
}

/**
 * Main function: Analyze borrower documents
 */
export async function analyzeBorrower(
  supabase: SupabaseClient,
  applicationId: string
): Promise<{
  data: {
    pros: string[];
    cons: string[];
    recommendations: string[];
    key_metrics: BorrowerMetrics;
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
    // Step 1: Fetch borrower documents
    const { data: documents, error: fetchError } = await fetchBorrowerDocuments(supabase, applicationId);
    
    if (fetchError || !documents || documents.length === 0) {
      return {
        data: null,
        error: fetchError || new Error('No borrower documents found'),
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

    // Step 3: Get the borrower analysis prompt
    const prompt = getAnalysisPrompt('borrower_details');

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
    const riskScore = calculateBorrowerRiskScore(key_metrics);
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
    console.error('Error in analyzeBorrower:', error);
    return { data: null, error };
  }
}
