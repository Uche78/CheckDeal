-- =====================================================
-- Row Level Security Policies: ANALYSIS_RESULTS
-- =====================================================
-- Description: Brokers can access analysis for their applications
-- =====================================================

-- Enable RLS
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Policy: Brokers can view analysis for their applications
CREATE POLICY "Brokers can view analysis for own applications"
ON analysis_results
FOR SELECT
USING (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

-- Policy: Service role can create analysis (AI functions)
-- Note: Analysis is created by backend functions using service role
-- Individual brokers don't create analysis directly
CREATE POLICY "Service can create analysis"
ON analysis_results
FOR INSERT
WITH CHECK (true); -- Service role bypasses RLS

-- Policy: Brokers can update analysis for their applications
-- (In case they want to add notes or override)
CREATE POLICY "Brokers can update analysis for own applications"
ON analysis_results
FOR UPDATE
USING (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

-- Policy: Service can delete analysis (for regeneration)
CREATE POLICY "Service can delete analysis"
ON analysis_results
FOR DELETE
USING (true); -- Service role bypasses RLS
