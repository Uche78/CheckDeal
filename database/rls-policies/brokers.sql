-- =====================================================
-- Row Level Security Policies: BROKERS
-- =====================================================
-- Description: Brokers can only view and update their own profile
-- =====================================================

-- Enable RLS
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;

-- Policy: Brokers can view their own profile
CREATE POLICY "Brokers can view own profile"
ON brokers
FOR SELECT
USING (auth.uid() = auth_id);

-- Policy: Brokers can update their own profile
CREATE POLICY "Brokers can update own profile"
ON brokers
FOR UPDATE
USING (auth.uid() = auth_id);

-- Policy: New brokers can insert their own profile (during signup)
CREATE POLICY "Brokers can insert own profile"
ON brokers
FOR INSERT
WITH CHECK (auth.uid() = auth_id);

-- Note: Brokers cannot delete their profile (must be done by admin)
