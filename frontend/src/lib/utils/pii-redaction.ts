/**
 * Example: Income Analyzer with PII Redaction
 * 
 * This shows how to integrate PII redaction into analyzers.
 * Apply the same pattern to property-analyzer, borrower-analyzer, and assets-analyzer.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getIncomePrompt } from './prompts';
import { redactPII, getPIISummary, validateRedaction } from '../utils/pii-redaction';

// Fetch income-related documents
async function fetchIncomeDocuments(supabase: SupabaseClient, applicationId: string) {
  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .eq('application_id', applicationId)
    .eq('category', 'income_employment')
    .eq('status', 'analyzed');

  if (error) {
    console.error('Error fetching income documents:', error);
    throw new Error('Failed to fetch income documents');
  }

  if (!documents || documents.length === 0) {
    throw new Error('No income documents found');
  }

  return documents;
}

// Fetch borrower information for name redaction
async function fetchBorrowerInfo(supabase: SupabaseClient, applicationId: string) {
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select(`
      *,
      borrowers (
        full_name,
        email,
        phone
      )
    `)
    .eq('id', applicationId)
    .single();

  if (appError || !application) {
    console.error('Error fetching application:', appError);
    return { names: [], addresses: [] };
  }

  const names = application.borrowers?.map((b: any) => b.full_name).filter(Boolean) || [];
  const addresses = application.property_address ? [application.property_address] : [];

  return { names, addresses };
}

export async function analyzeIncome(
  supabase: SupabaseClient,
  applicationId: string,
  stressTestEnabled: boolean
) {
  const startTime = Date.now();

  try {
    // Step 1: Fetch documents
    const documents = await fetchIncomeDocuments(supabase, applicationId);

    // Step 2: Fetch borrower info for redaction
    const { names, addresses } = await fetchBorrowerInfo(supabase, applicationId);

    // Step 3: Combine extracted text from all documents
    const combinedText = documents
      .map(doc => doc.extracted_text || '')
      .filter(text => text.length > 0)
      .join('\n\n---\n\n');

    if (!combinedText) {
      throw new Error('No text extracted from income documents');
    }

    // Step 4: Redact PII BEFORE sending to Claude
    console.log('🔒 Redacting PII from income documents...');
    const redactionResult = redactPII(combinedText, names, addresses);
    
    // Log what was redacted (for audit trail)
    console.log(`📊 PII Redaction Summary: ${getPIISummary(redactionResult)}`);
    
    // Validate redaction worked
    const validation = validateRedaction(redactionResult.redactedText);
    if (!validation.isClean) {
      console.warn('⚠️  Redaction warnings:', validation.warnings);
    }

    // Step 5: Get analysis prompt
    const prompt = getIncomePrompt(redactionResult.redactedText, stressTestEnabled);

    // Step 6: Call Claude API with REDACTED text
    const anthropic = new Anthropic({
      apiKey: import.meta.env.PUBLIC_ANTHROPIC_API_KEY,
    });

    console.log('🤖 Sending REDACTED text to Claude for analysis...');
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Step 7: Parse response
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    // Remove markdown code blocks if present
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const analysisData = JSON.parse(cleanedResponse);

    // Step 8: Add processing metadata
    const processingTime = Date.now() - startTime;

    return {
      ...analysisData,
      processing_time_ms: processingTime,
      pii_redacted: true, // Flag that PII was redacted
      pii_summary: getPIISummary(redactionResult), // Audit trail
    };

  } catch (error: any) {
    console.error('❌ Error in income analysis:', error);
    throw new Error(`Income analysis failed: ${error.message}`);
  }
}
