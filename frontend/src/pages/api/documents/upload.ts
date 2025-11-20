import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Allowed file types
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const applicationId = formData.get('application_id') as string;
    const uploadedBy = formData.get('uploaded_by') as string;
    const token = formData.get('token') as string | null; // Optional token for borrower uploads

    // Validate inputs
    if (!file || !applicationId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid file type. Only PDF, JPG, and PNG files are allowed.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ 
        error: 'File too large. Maximum size is 10MB.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use service role for database operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If token provided (borrower upload), validate it
    if (token) {
      const { data: uploadToken, error: tokenError } = await supabase
        .from('upload_tokens')
        .select('*')
        .eq('token', token)
        .eq('application_id', applicationId)
        .single();

      if (tokenError || !uploadToken) {
        return new Response(JSON.stringify({ 
          error: 'Invalid or expired upload token' 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check if token is expired
      const now = new Date();
      const expiresAt = new Date(uploadToken.expires_at);
      
      if (expiresAt < now) {
        return new Response(JSON.stringify({ 
          error: 'Upload token has expired' 
        }), {
          status: 410,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check upload limit
      if (uploadToken.max_uploads !== null && uploadToken.uploads_count >= uploadToken.max_uploads) {
        return new Response(JSON.stringify({ 
          error: 'Upload limit reached for this token' 
        }), {
          status: 410,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    const filePath = `${applicationId}/${fileName}`;

    // Convert File to ArrayBuffer for upload
    const fileBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(fileBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('mortgage-documents')
      .upload(filePath, fileData, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(JSON.stringify({ 
        error: 'Failed to upload file to storage',
        details: uploadError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Save document metadata to database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        application_id: applicationId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: uploadedBy as 'broker' | 'borrower',
        status: 'pending',
        category: 'uncategorized'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      
      // Cleanup: delete the uploaded file from storage
      await supabase.storage
        .from('mortgage-documents')
        .remove([filePath]);

      return new Response(JSON.stringify({ 
        error: 'Failed to save document metadata',
        details: dbError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If borrower upload with token, increment upload count
if (token) {
  // First get the current count
  const { data: currentToken } = await supabase
    .from('upload_tokens')
    .select('uploads_count')
    .eq('token', token)
    .single();

  if (currentToken) {
    await supabase
      .from('upload_tokens')
      .update({ 
        uploads_count: currentToken.uploads_count + 1,
        used_at: new Date().toISOString()
      })
      .eq('token', token);
  }
}

// Trigger text extraction in the background (don't wait for it)
    fetch(`${new URL(request.url).origin}/api/documents/extract-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: document.id })
    }).catch(err => console.error('Background extraction error:', err));

    return new Response(JSON.stringify({ 
      success: true,
      document: document,
      message: 'File uploaded successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
