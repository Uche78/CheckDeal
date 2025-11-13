-- =====================================================
-- Apply All Row Level Security Policies
-- =====================================================
-- Description: Master script to apply all RLS policies
-- Run this after creating the schema
-- =====================================================

-- First, enable RLS on all tables
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- BROKERS POLICIES
-- =====================================================

CREATE POLICY "Brokers can view own profile"
ON brokers FOR SELECT
USING (auth.uid() = auth_id);

CREATE POLICY "Brokers can update own profile"
ON brokers FOR UPDATE
USING (auth.uid() = auth_id);

CREATE POLICY "Brokers can insert own profile"
ON brokers FOR INSERT
WITH CHECK (auth.uid() = auth_id);

-- =====================================================
-- APPLICATIONS POLICIES
-- =====================================================

CREATE POLICY "Brokers can view own applications"
ON applications FOR SELECT
USING (
  broker_id IN (
    SELECT id FROM brokers WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Brokers can create applications"
ON applications FOR INSERT
WITH CHECK (
  broker_id IN (
    SELECT id FROM brokers WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Brokers can update own applications"
ON applications FOR UPDATE
USING (
  broker_id IN (
    SELECT id FROM brokers WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Brokers can delete own applications"
ON applications FOR DELETE
USING (
  broker_id IN (
    SELECT id FROM brokers WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Public can view application via upload token"
ON applications FOR SELECT
USING (upload_token_expires_at > NOW());

-- =====================================================
-- BORROWERS POLICIES
-- =====================================================

CREATE POLICY "Brokers can view borrowers for own applications"
ON borrowers FOR SELECT
USING (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

CREATE POLICY "Brokers can create borrowers for own applications"
ON borrowers FOR INSERT
WITH CHECK (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

CREATE POLICY "Brokers can update borrowers for own applications"
ON borrowers FOR UPDATE
USING (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

CREATE POLICY "Brokers can delete borrowers for own applications"
ON borrowers FOR DELETE
USING (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

-- =====================================================
-- DOCUMENTS POLICIES
-- =====================================================

CREATE POLICY "Brokers can view documents for own applications"
ON documents FOR SELECT
USING (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

CREATE POLICY "Brokers can upload documents for own applications"
ON documents FOR INSERT
WITH CHECK (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

CREATE POLICY "Brokers can update documents for own applications"
ON documents FOR UPDATE
USING (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

CREATE POLICY "Brokers can delete documents for own applications"
ON documents FOR DELETE
USING (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

CREATE POLICY "Public can upload documents with valid token"
ON documents FOR INSERT
WITH CHECK (
  application_id IN (
    SELECT id 
    FROM applications 
    WHERE upload_token_expires_at > NOW()
  )
);

-- =====================================================
-- ANALYSIS_RESULTS POLICIES
-- =====================================================

CREATE POLICY "Brokers can view analysis for own applications"
ON analysis_results FOR SELECT
USING (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

CREATE POLICY "Service can create analysis"
ON analysis_results FOR INSERT
WITH CHECK (true);

CREATE POLICY "Brokers can update analysis for own applications"
ON analysis_results FOR UPDATE
USING (
  application_id IN (
    SELECT a.id 
    FROM applications a
    JOIN brokers b ON a.broker_id = b.id
    WHERE b.auth_id = auth.uid()
  )
);

CREATE POLICY "Service can delete analysis"
ON analysis_results FOR DELETE
USING (true);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('brokers', 'applications', 'borrowers', 'documents', 'analysis_results');

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
