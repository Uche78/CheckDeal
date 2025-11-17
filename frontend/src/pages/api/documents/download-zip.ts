import type { APIRoute } from 'astro';
import { createServerClient } from '../../../lib/supabase-client';
import JSZip from 'jszip';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createServerClient(cookies);

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const body = await request.json();
    const { document_ids } = body;

    if (!document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'Document IDs required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get documents metadata
    const { data: documents, error: dbError } = await supabase
      .from('documents')
      .select('*')
      .in('id', document_ids);

    if (dbError || !documents || documents.length === 0) {
      return new Response(JSON.stringify({ error: 'Documents not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify user owns all documents
    const applicationIds = [...new Set(documents.map(d => d.application_id))];
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('id, broker_id')
      .in('id', applicationIds);

    if (appError || !applications) {
      return new Response(JSON.stringify({ error: 'Failed to verify ownership' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const unauthorized = applications.some(app => app.broker_id !== user.id);
    if (unauthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized access to documents' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create ZIP file
    const zip = new JSZip();

    // Download each file and add to ZIP
    for (const doc of documents) {
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('mortgage-documents')
          .download(doc.file_path);

        if (downloadError || !fileData) {
          console.error(`Failed to download ${doc.file_name}:`, downloadError);
          continue;
        }

        // Add file to ZIP with original name
        const arrayBuffer = await fileData.arrayBuffer();
        zip.file(doc.file_name, arrayBuffer);
      } catch (error) {
        console.error(`Error adding ${doc.file_name} to ZIP:`, error);
      }
    }

    // Generate ZIP
    const zipBlob = await zip.generateAsync({ type: 'arraybuffer' });

    // Return ZIP file
    return new Response(zipBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="documents-${new Date().toISOString().split('T')[0]}.zip"`
      }
    });

  } catch (error) {
    console.error('Download ZIP error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
