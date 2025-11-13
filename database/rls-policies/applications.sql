-- =====================================================
-- Row Level Security Policies: APPLICATIONS
-- =====================================================
-- Description: Brokers can only access their own applications
-- =====================================================

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policy: Brokers can view their own applications
CREATE POLICY "Brokers can view own applications"
ON applications
FOR SELECT
USING (
  broker_id IN (
    SELECT id FROM brokers WHERE auth_id = auth.uid()
  )
);

-- Policy: Brokers can create applications
CREATE POLICY "Brokers can create applications"
ON applications
FOR INSERT
WITH CHECK (
  broker_id IN (
    SELECT id FROM brokers WHERE auth_id = auth.uid()
  )
);

-- Policy: Brokers can update their own applications
CREATE POLICY "Brokers can update own applications"
ON applications
FOR UPDATE
USING (
  broker_id IN (
    SELECT id FROM brokers WHERE auth_id = auth.uid()
  )
);

-- Policy: Brokers can delete their own applications
CREATE POLICY "Brokers can delete own applications"
ON applications
FOR DELETE
USING (
  broker_id IN (
    SELECT id FROM brokers WHERE auth_id = auth.uid()
  )
);

-- Policy: Allow public access via upload token (for borrowers)
CREATE POLICY "Public can view application via upload token"
ON applications
FOR SELECT
USING (upload_token_expires_at > NOW());
