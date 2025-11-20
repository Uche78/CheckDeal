import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

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

    // Use Anthropic API for text extraction
    if (anthropicApiKey) {
      try {
        console.log('Starting Anthropic extraction for document:', document.file_name);
        
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

Return your response in the following JSON format:
{
  "full_text": "Complete text content of the document",
  "document_type": "bank_statement | pay_stub | tax_return | mortgage_statement | other",
  "structured_data": {
    // For bank statements:
    "account_holder": "Name",
    "account_number": "Last 4 digits only",
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
        "description": "Transaction description",
        "amount": 0.00,
        "type": "credit | debit"
      }
    ],
    
    // For pay stubs:
    "employee_name": "Name",
    "employer": "Company name",
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

IMPORTANT:
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
        
        // Try to parse JSON response
        try {
          // Remove markdown code blocks if present
          let jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(jsonText);
          
          extractedText = parsed.full_text || responseText;
          structuredData = parsed.structured_data || null;
          
          console.log('Extracted text length:', extractedText.length);
          console.log('Structured data:', JSON.stringify(structuredData, null, 2));
        } catch (parseError) {
          console.error('JSON parsing failed, using raw text:', parseError);
          extractedText = responseText;
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

    // Save extracted text and structured data to database
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        extracted_text: extractedText,
        extracted_data: structuredData,
        status: 'clean'
      })
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

    return new Response(JSON.stringify({
      success: true,
      extracted_text: extractedText,
      structured_data: structuredData,
      message: 'Text extraction completed'
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
