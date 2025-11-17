import type { Document, DocumentInsert } from '../types/database';
import { supabase } from '../supabase-client';

/**
 * Upload a document file
 */
export async function uploadDocument(
  file: File,
  applicationId: string,
  uploadedBy: 'broker' | 'borrower' = 'broker'
): Promise<{ data: Document | null; error: Error | null }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('application_id', applicationId);
    formData.append('uploaded_by', uploadedBy);

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: new Error(result.error || 'Upload failed')
      };
    }

    return {
      data: result.document,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Upload failed')
    };
  }
}

/**
 * Get all documents for an application
 */
export async function getDocuments(applicationId: string): Promise<{
  data: Document[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('application_id', applicationId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to fetch documents')
    };
  }
}

/**
 * Get a signed URL for a document
 */
export async function getDocumentUrl(filePath: string, expiresIn: number = 3600): Promise<{
  data: string | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.storage
      .from('mortgage-documents')
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;

    return { data: data.signedUrl, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to generate URL')
    };
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string, filePath: string): Promise<{
  error: Error | null;
}> {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('mortgage-documents')
      .remove([filePath]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (dbError) throw dbError;

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Failed to delete document')
    };
  }
}

/**
 * Download a document
 */
export async function downloadDocument(filePath: string, fileName: string): Promise<{
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase.storage
      .from('mortgage-documents')
      .download(filePath);

    if (error) throw error;

    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Failed to download document')
    };
  }
}
