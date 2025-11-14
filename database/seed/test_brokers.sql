-- =====================================================
-- Seed Data: Test Brokers
-- =====================================================
-- Description: Create test broker accounts for development
-- Note: These use placeholder auth_id values
--       In production, auth_id comes from Supabase Auth
-- =====================================================

-- Insert test brokers
-- Note: You'll need to replace these UUIDs with actual auth.users IDs after creating test accounts

INSERT INTO brokers (
  id,
  auth_id,
  email,
  full_name,
  phone,
  brokerage_name,
  license_number,
  notification_email,
  notification_sms
) VALUES
  -- Broker 1: John Smith
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'cd /Users/uche/CheckDeal/CheckDeal/database/seed
    'c7c2c586-a988-4375-866c-ee7281ff9545', -- Placeholder - replace with real auth.users id
    'john.smith@example.com',
    'John Smith',
    '+1-416-555-0101',
    'Toronto Mortgage Brokers Inc.',
    'MB-ON-12345',
    true,
    false
  ),
  -- Broker 2: Sarah Johnson
  (
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002', -- Placeholder - replace with real auth.users id
    'sarah.johnson@example.com',
    'Sarah Johnson',
    '+1-416-555-0102',
    'GTA Mortgage Solutions',
    'MB-ON-67890',
    true,
    true
  ),
  -- Broker 3: Mike Chen
  (
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440003', -- Placeholder - replace with real auth.users id
    'mike.chen@example.com',
    'Mike Chen',
    '+1-647-555-0103',
    'Chen Financial Group',
    'MB-ON-54321',
    true,
    false
  );

-- =====================================================
-- Instructions for Production Use:
-- =====================================================
-- 1. Create actual user accounts in Supabase Auth first
-- 2. Get their auth.users.id values
-- 3. Update the auth_id values above with real IDs
-- 4. Then run this script
-- ========================================-- =====================================================
-- Seed Data: Test Brokers
-- =====================================================

-- NOTE: Replace the auth_id values below with actual auth.users IDs
-- after creating test accounts in Supabase Auth

-- Insert test brokers
INSERT INTO brokers (
  id,
  auth_id,
  email,
  full_name,
  phone,
  brokerage_name,
  license_number,
  notification_email,
  notification_sms
) VALUES
  (
    'c7c2c586-a988-4375-866c-ee7281ff9545'::uuid,
    'c7c2c586-a988-4375-866c-ee7281ff9545'::uuid,
    'john.smith@example.com',
    'John Smith',
    '+1-416-555-0101',
    'Toronto Mortgage Brokers Inc.',
    'MB-ON-12345',
    true,
    false
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'sarah.johnson@example.com',
    'Sarah Johnson',
    '+1-416-555-0102',
    'GTA Mortgage Solutions',
    'MB-ON-67890',
    true,
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    'mike.chen@example.com',
    'Mike Chen',
    '+1-647-555-0103',
    'Chen Financial Group',
    'MB-ON-54321',
    true,
    false
  );

-- Verification
SELECT 'Inserted ' || COUNT(*) || ' test brokers' as result 
FROM brokers 
WHERE email LIKE '%@example.com';
