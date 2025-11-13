-- =====================================================
-- Row Level Security Policies: BORROWERS
-- =====================================================
-- Description: Brokers can only access borrowers for their applications
-- =====================================================

-- Enable RLS
ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;

-- Policy: Brokers can view borrowers for their applications
CREATE POLICY "Brokers can view borrowers for own applications"
ON borrowers
FOR SELECT
USING (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

-- Policy: Brokers can create borrowers for their applications
CREATE POLICY "Brokers can create borrowers for own applications"
ON borrowers
FOR INSERT
WITH CHECK (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

-- Policy: Brokers can update borrowers for their applications
CREATE POLICY "Brokers can update borrowers for own applications"
ON borrowers
FOR UPDATE
USING (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

-- Policy: Brokers can delete borrowers for their applications
CREATE POLICY "Brokers can delete borrowers for own applications"
ON borrowers
FOR DELETE
USING (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);
