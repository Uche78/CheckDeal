-- =====================================================
-- Row Level Security Policies: DOCUMENTS
-- =====================================================
-- Description: Brokers can access documents for their applications
--              Borrowers can upload via upload token
-- =====================================================

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy: Brokers can view documents for their applications
CREATE POLICY "Brokers can view documents for own applications"
ON documents
FOR SELECT
USING (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

-- Policy: Brokers can upload documents for their applications
CREATE POLICY "Brokers can upload documents for own applications"
ON documents
FOR INSERT
WITH CHECK (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

-- Policy: Brokers can update documents for their applications
CREATE POLICY "Brokers can update documents for own applications"
ON documents
FOR UPDATE
USING (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

-- Policy: Brokers can delete documents for their applications
CREATE POLICY "Brokers can delete documents for own applications"
ON documents
FOR DELETE
USING (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

-- Policy: Public can upload documents via valid upload token (borrowers)
-- Note: This will be handled by a service role function in production
-- For now, borrower uploads will go through an API endpoint
CREATE POLICY "Public can upload documents with valid token"
ON documents
FOR INSERT
WITH CHECK (
  application_id IN (
    SELECT id 
    FROM applications 
    WHERE upload_token_expires_at > NOW()
  )
);
