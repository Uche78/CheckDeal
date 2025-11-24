import type { SupabaseClient } from '@supabase/supabase-js';
import { getAnalysisPrompt } from './prompts';
import type { AssetsMetrics } from '../types/database';

// Claude API configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

/**
 * Fetch all documents in the assets_liabilities category
 */
async function fetchAssetsDocuments(supabase: SupabaseClient, applicationId: string) {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('application_id', applicationId)
      .eq('category', 'assets_liabilities')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching assets documents:', error);
    return { data: null, error };
  }
}

/**
 * Call Claude API to analyze assets/liabilities documents
 */
async function callClaudeAPI(
  prompt: string,
  documentsText: string
): Promise<{ data: any; error: any }> {
  const startTime = Date.now();

  try {
    // Get Claude API key from environment
    const apiKey = import.meta.env.PUBLIC_ANTHROPIC_API_KEY;
    
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
 * Calculate risk score based on assets metrics
 */
function calculateAssetsRiskScore(metrics: AssetsMetrics): number {
  let score = 100; // Start with perfect score

  // Down payment adequacy risk
  if (metrics.down_payment_available <= 0) {
    score -= 50; // No down payment
  } else if (metrics.down_payment_source === 'unknown') {
    score -= 30; // Unknown source
  }

  // Down payment source risk
  if (metrics.down_payment_source === 'gift') {
    if (metrics.gift_properly_documented === false) {
      score -= 25; // Gift not properly documented
    } else if (metrics.gift_properly_documented === null) {
      score -= 15; // Gift documentation unclear
    }
  }

  // Liquid assets risk (reserves)
  if (metrics.months_of_reserves < 1) {
    score -= 25; // No reserves
  } else if (metrics.months_of_reserves < 1.5) {
    score -= 15; // Low reserves
  } else if (metrics.months_of_reserves < 3) {
    score -= 5; // Minimal reserves
  }

  // Debt level risk
  if (metrics.debt_to_income_ratio !== null) {
    if (metrics.debt_to_income_ratio > 50) {
      score -= 30; // Very high debt
    } else if (metrics.debt_to_income_ratio > 43) {
      score -= 20; // High debt
    } else if (metrics.debt_to_income_ratio > 36) {
      score -= 10; // Moderate debt
    }
  }

  // Large deposits risk (potential fraud)
  if (metrics.large_deposits_flagged.length > 3) {
    score -= 25; // Many unexplained deposits
  } else if (metrics.large_deposits_flagged.length > 1) {
    score -= 15; // Several unexplained deposits
  } else if (metrics.large_deposits_flagged.length > 0) {
    score -= 10; // One unexplained deposit
  }

  // Undisclosed liabilities risk
  if (metrics.undisclosed_liabilities_suspected) {
    score -= 25;
  }

  // Total liquid assets relative to down payment
  if (metrics.total_liquid_assets > 0 && metrics.down_payment_available > 0) {
    const coverage = metrics.total_liquid_assets / metrics.down_payment_available;
    if (coverage < 1.2) {
      score -= 15; // Barely enough assets
    }
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
function calculateApprovalLikelihood(metrics: AssetsMetrics, riskScore: number): number {
  let likelihood = riskScore;

  // Boost for strong reserves
  if (metrics.months_of_reserves >= 6) {
    likelihood += 15;
  } else if (metrics.months_of_reserves >= 3) {
    likelihood += 10;
  }

  // Boost for savings-based down payment
  if (metrics.down_payment_source === 'savings') {
    likelihood += 10;
  }

  // Boost for low debt-to-income
  if (metrics.debt_to_income_ratio !== null && metrics.debt_to_income_ratio < 30) {
    likelihood += 10;
  }

  // Penalty for many large deposits
  if (metrics.large_deposits_flagged.length > 2) {
    likelihood -= 20;
  }

  // Penalty for undisclosed liabilities
  if (metrics.undisclosed_liabilities_suspected) {
    likelihood -= 25;
  }

  // Penalty for poorly documented gift
  if (metrics.down_payment_source === 'gift' && metrics.gift_properly_documented === false) {
    likelihood -= 20;
  }

  // Penalty for insufficient reserves
  if (metrics.months_of_reserves < 1) {
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
    'insufficient down payment',
    'no down payment',
    'large unexplained deposit',
    'suspicious deposit',
    'undisclosed',
    'high debt',
    'no reserves',
    'gift not documented',
    'insufficient assets',
    'nsf',
    'overdraft',
    'cannot verify',
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

  const textContent = documents.map(doc => doc.extracted_text?.toLowerCase() || '').join(' ');

  // Check for essential assets/liabilities documents
  if (!documentTypes.some(type => type.includes('bank statement') || type.includes('account statement'))) {
    missing.push('Bank Statements (90-day history)');
  }

  // Check for gift letter if gift is mentioned
  if (textContent.includes('gift') || textContent.includes('gifted')) {
    if (!documentTypes.some(type => type.includes('gift letter') || type.includes('gift declaration'))) {
      missing.push('Gift Letter (signed declaration)');
    }
  }

  // Check for investment statements if mentioned
  if (textContent.includes('rrsp') || textContent.includes('tfsa') || textContent.includes('investment')) {
    if (!documentTypes.some(type => type.includes('investment') || type.includes('rrsp') || type.includes('tfsa'))) {
      missing.push('Investment Account Statements (RRSP/TFSA)');
    }
  }

  // Check for credit card statements if credit cards mentioned
  if (textContent.includes('credit card') && textContent.includes('balance')) {
    if (!documentTypes.some(type => type.includes('credit card statement'))) {
      missing.push('Credit Card Statements (recommended)');
    }
  }

  // Check for loan statements if loans mentioned
  if (textContent.includes('loan') || textContent.includes('debt')) {
    if (!documentTypes.some(type => 
      type.includes('loan statement') || 
      type.includes('line of credit') || 
      type.includes('mortgage statement')
    )) {
      missing.push('Loan/Debt Statements (all liabilities)');
    }
  }

  // Check for child support/alimony documentation if mentioned
  if (textContent.includes('child support') || textContent.includes('alimony') || textContent.includes('spousal support')) {
    if (!documentTypes.some(type => 
      type.includes('support agreement') || 
      type.includes('court order')
    )) {
      missing.push('Child Support/Alimony Agreement');
    }
  }

  // Check for explanation of large deposits
  const hasLargeDeposits = textContent.includes('large deposit') || 
                          textContent.includes('unusual deposit') ||
                          /deposit.*\$[1-9]\d{3,}/.test(textContent); // Regex for deposits over $1000

  if (hasLargeDeposits) {
    if (!documentTypes.some(type => type.includes('letter of explanation') || type.includes('explanation'))) {
      missing.push('Letter of Explanation for Large Deposits');
    }
  }

  // Check for proof of sale if mentioned
  if (textContent.includes('sale of property') || textContent.includes('proceeds from sale')) {
    if (!documentTypes.some(type => type.includes('sale') || type.includes('closing statement'))) {
      missing.push('Proof of Property Sale (Closing Statement)');
    }
  }

  return missing;
}

/**
 * Main function: Analyze assets and liabilities documents
 */
export async function analyzeAssets(
  supabase: SupabaseClient,
  applicationId: string
): Promise<{
  data: {
    pros: string[];
    cons: string[];
    recommendations: string[];
    key_metrics: AssetsMetrics;
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
    // Step 1: Fetch assets/liabilities documents
    const { data: documents, error: fetchError } = await fetchAssetsDocuments(supabase, applicationId);
    
    if (fetchError || !documents || documents.length === 0) {
      return {
        data: null,
        error: fetchError || new Error('No assets/liabilities documents found'),
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

    // Step 3: Get the assets/liabilities analysis prompt
    const prompt = getAnalysisPrompt('assets_liabilities');

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
    const riskScore = calculateAssetsRiskScore(key_metrics);
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
    console.error('Error in analyzeAssets:', error);
    return { data: null, error };
  }
}
