import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { redactPII, getPIISummary, validateRedaction } from '../../../lib/utils/pii-redaction';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicApiKey = import.meta.env.ANTHROPIC_API_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { document_id } = await request.json();

    if (!document_id) {
      return new Response(JSON.stringify({ error: 'Document ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', document_id);

    // Download document from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('mortgage-documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      await supabase
        .from('documents')
        .update({ status: 'pending' })
        .eq('id', document_id);

      return new Response(JSON.stringify({ error: 'Failed to download document' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let extractedText = '';
    let structuredData = null;
    let documentType = null;
    let documentCategory = 'uncategorized';

    // Use Anthropic API for text extraction
    if (anthropicApiKey) {
      try {
        console.log('Starting Anthropic extraction for document:', document.file_name);
        
        // Fetch borrower information for PII redaction
        console.log('🔒 Fetching borrower info for PII redaction...');
        const { data: application } = await supabase
          .from('applications')
          .select(`
            property_address,
            borrowers (
              full_name,
              email,
              phone,
              current_address
            )
          `)
          .eq('id', document.application_id)
          .single();

        const borrowerNames = application?.borrowers?.map((b: any) => b.full_name).filter(Boolean) || [];
        const addresses = [
          application?.property_address,
          ...(application?.borrowers?.map((b: any) => b.current_address) || [])
        ].filter(Boolean);

        console.log(`🔒 Found ${borrowerNames.length} borrower name(s) and ${addresses.length} address(es) for redaction`);
        
        const client = new Anthropic({ apiKey: anthropicApiKey });
        
        // Convert file to base64
        const arrayBuffer = await fileData.arrayBuffer();
        console.log('File size:', arrayBuffer.byteLength, 'bytes');
        
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        console.log('Base64 length:', base64Data.length);
        
        // Determine media type
        let mediaType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        if (document.file_type === 'application/pdf') {
          mediaType = 'application/pdf';
        } else if (document.file_type === 'image/jpeg' || document.file_type === 'image/jpg') {
          mediaType = 'image/jpeg';
        } else if (document.file_type === 'image/png') {
          mediaType = 'image/png';
        } else if (document.file_type === 'image/gif') {
          mediaType = 'image/gif';
        } else if (document.file_type === 'image/webp') {
          mediaType = 'image/webp';
        } else {
          throw new Error('Unsupported file type: ' + document.file_type);
        }
        
        console.log('Media type:', mediaType);

        // Use Claude to extract text AND structured data
        console.log('Calling Anthropic API...');
        const message = await client.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: [
              {
                type: document.file_type === 'application/pdf' ? 'document' : 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data,
                }
              },
              {
                type: 'text',
                text: `Analyze this document and extract both the full text and structured financial data.

🔒 CRITICAL PRIVACY REQUIREMENT - READ CAREFULLY:
You MUST protect personally identifiable information (PII). In your response:
- Replace ALL names with [NAME_1], [NAME_2], etc.
- Replace ALL SSN/SIN numbers with [SSN_1], [SSN_2], etc.
- Replace ALL email addresses with [EMAIL_1], [EMAIL_2], etc.
- Replace ALL phone numbers with [PHONE_1], [PHONE_2], etc.
- Replace ALL street addresses with [ADDRESS_1], [ADDRESS_2], etc.
- Replace ALL account numbers with [ACCOUNT_1], [ACCOUNT_2], etc.
- Keep ONLY financial amounts, dates, and transaction descriptions
- This is for privacy compliance - DO NOT include any real PII in your response

IMPORTANT - Document Type Classification:
- For Canadian tax documents, identify the SPECIFIC type:
  * "T4" - Statement of Remuneration Paid (employment income)
  * "T4A" - Statement of Pension, Retirement, Annuity, and Other Income
  * "NOA" - Notice of Assessment from CRA
  * "tax_return" - Complete tax return (T1 General)
- For bank statements, look for account numbers, transactions, balances
- For pay stubs, look for employer name, gross pay, deductions, net pay

Return your response in the following JSON format:
{
  "full_text": "Complete text content with PII replaced by placeholders",
  "document_type": "bank_statement | pay_stub | T4 | T4A | NOA | tax_return | employment_letter | mortgage_statement | credit_report | drivers_license | passport | other",
  "structured_data": {
    // For bank statements (use [NAME] and [ACCOUNT] placeholders):
    "account_holder": "[NAME_1]",
    "account_number": "****1234",
    "statement_period": {
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD"
    },
    "opening_balance": 0.00,
    "closing_balance": 0.00,
    "total_deposits": 0.00,
    "total_withdrawals": 0.00,
    "large_transactions": [
      {
        "date": "YYYY-MM-DD",
        "description": "Transaction description (no account numbers or names)",
        "amount": 0.00,
        "type": "credit | debit"
      }
    ],
    
    // For pay stubs (use [NAME] placeholders):
    "employee_name": "[NAME_1]",
    "employer": "[NAME_2]",
    "pay_period": {
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD"
    },
    "gross_income": 0.00,
    "net_income": 0.00,
    "year_to_date_income": 0.00,
    "deductions": [
      {"type": "tax | insurance | retirement", "amount": 0.00}
    ]
  }
}

REMEMBER: 
- NO real names, emails, phones, or addresses in the response
- Use placeholders like [NAME_1], [EMAIL_1], [PHONE_1], [ADDRESS_1]
- For large_transactions, include ANY transaction over $500
- Use null for any fields that cannot be found
- For dates, use YYYY-MM-DD format or null if not found
- For amounts, use numbers without currency symbols
- Return ONLY valid JSON, no markdown formatting or extra text`
              }
            ]
          }]
        });
        
        console.log('API response received');

        // Parse the structured response
        let responseText = message.content[0].type === 'text' 
          ? message.content[0].text 
          : '';
        
        // 🔒 REDACT PII from the AI response
        console.log('🔒 Redacting PII from AI response...');
        const redactionResult = redactPII(responseText, borrowerNames, addresses);
        
        const piiSummary = getPIISummary(redactionResult);
        console.log(`📊 PII Redaction Summary: ${piiSummary}`);
        
        // Validate redaction worked
        const validation = validateRedaction(redactionResult.redactedText);
        if (!validation.isClean) {
          console.warn('⚠️  Redaction validation warnings:', validation.warnings);
        }
        
        // Use the redacted text for parsing
        const redactedResponse = redactionResult.redactedText;
        
        // Try to parse JSON response
        try {
          // Remove markdown code blocks if present
          let jsonText = redactedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(jsonText);
          
          extractedText = parsed.full_text || redactedResponse;
          structuredData = parsed.structured_data || null;
          documentType = parsed.document_type || null;
          
          // Map document types to categories
          const categoryMap: Record<string, string> = {
            'bank_statement': 'assets_liabilities',
            'pay_stub': 'income_employment',
            'tax_return': 'income_employment',
            'T4': 'income_employment',
            'T4A': 'income_employment',
            'NOA': 'income_employment',
            'employment_letter': 'income_employment',
            'mortgage_statement': 'property',
            'property_tax': 'property',
            'home_appraisal': 'property',
            'purchase_agreement': 'property',
            'drivers_license': 'borrower_details',
            'passport': 'borrower_details',
            'credit_report': 'assets_liabilities',
            'investment_statement': 'assets_liabilities',
            'loan_statement': 'assets_liabilities'
          };
          
          if (documentType) {
            documentCategory = categoryMap[documentType] || 'uncategorized';
          }
          
          console.log('Extracted text length:', extractedText.length);
          console.log('Document type:', documentType);
          console.log('Document category:', documentCategory);
          console.log('Structured data:', JSON.stringify(structuredData, null, 2));
          
          // 🔐 Log PII redaction for audit trail
          if (Object.values(redactionResult.detectedPII).some(count => count > 0)) {
            const totalPII = Object.values(redactionResult.detectedPII).reduce((sum, count) => sum + count, 0);
            console.log('🔐 PII Redaction Audit:', {
              document_id,
              application_id: document.application_id,
              pii_detected: redactionResult.detectedPII,
              total_items_redacted: totalPII,
              timestamp: new Date().toISOString()
            });
          }
          
        } catch (parseError) {
          console.error('JSON parsing failed, using raw text:', parseError);
          extractedText = redactedResponse;
        }

      } catch (error) {
        console.error('Anthropic API error details:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
        extractedText = '[AI text extraction failed: ' + (error instanceof Error ? error.message : 'Unknown error') + ']';
      }
    } else {
      // Fallback: Simple placeholder
      extractedText = '[Text extraction not configured - please add ANTHROPIC_API_KEY to environment]';
    }

    // Save extracted text, structured data, and classification to database
    const updateData: any = {
      extracted_text: extractedText,
      extracted_data: structuredData ? {
        ...structuredData,
        pii_redacted: true,
        redacted_at: new Date().toISOString()
      } : structuredData,
      status: 'analyzed'
    };
    
    if (documentType) {
      updateData.document_type = documentType;
    }
    
    if (documentCategory && documentCategory !== 'uncategorized') {
      updateData.category = documentCategory;
    }
    
    const { error: updateError } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', document_id);

    if (updateError) {
      return new Response(JSON.stringify({ 
        error: 'Failed to save extracted text',
        details: updateError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Document analysis complete with PII redaction');

    return new Response(JSON.stringify({
      success: true,
      extracted_text: extractedText,
      structured_data: structuredData,
      message: 'Text extraction completed with PII redaction'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Text extraction error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
