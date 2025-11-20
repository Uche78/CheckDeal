/**
 * Trigger text extraction for a document
 */
export async function extractDocumentText(documentId: string): Promise<{
  success: boolean;
  extracted_text?: string;
  error?: string;
}> {
  try {
    const response = await fetch('/api/documents/extract-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: documentId })
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Extraction failed'
      };
    }

    return {
      success: true,
      extracted_text: result.extracted_text
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Extraction failed'
    };
  }
}

/**
 * Batch extract text from multiple documents
 */
export async function batchExtractText(documentIds: string[]): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const results = await Promise.all(
    documentIds.map(id => extractDocumentText(id))
  );

  const success = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const errors = results
    .filter(r => !r.success)
    .map(r => r.error || 'Unknown error');

  return { success, failed, errors };
}
