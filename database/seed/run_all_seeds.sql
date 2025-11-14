-- =====================================================
-- Master Seed Script
-- =====================================================
-- Description: Run all seed scripts in correct order
-- Warning: This creates test data for development only
-- =====================================================

-- Clear existing test data (if any)
DELETE FROM analysis_results WHERE application_id IN (
  SELECT id FROM applications WHERE broker_id IN (
    SELECT id FROM brokers WHERE email LIKE '%@example.com'
  )
);

DELETE FROM documents WHERE application_id IN (
  SELECT id FROM applications WHERE broker_id IN (
    SELECT id FROM brokers WHERE email LIKE '%@example.com'
  )
);

DELETE FROM borrowers WHERE application_id IN (
  SELECT id FROM applications WHERE broker_id IN (
    SELECT id FROM brokers WHERE email LIKE '%@example.com'
  )
);

DELETE FROM applications WHERE broker_id IN (
  SELECT id FROM brokers WHERE email LIKE '%@example.com'
);

DELETE FROM brokers WHERE email LIKE '%@example.com';

-- =====================================================
-- Run seed scripts
-- =====================================================

-- You'll need to run these separately in order:
-- 1. test_brokers.sql
-- 2. test_applications.sql
-- 3. test_borrowers.sql

-- =====================================================
-- Verification Queries
-- =====================================================

-- Count all test data
SELECT 'Brokers' as table_name, COUNT(*) as count FROM brokers WHERE email LIKE '%@example.com'
UNION ALL
SELECT 'Applications' as table_name, COUNT(*) as count FROM applications WHERE broker_id IN (
  SELECT id FROM brokers WHERE email LIKE '%@example.com'
)
UNION ALL
SELECT 'Borrowers' as table_name, COUNT(*) as count FROM borrowers WHERE application_id IN (
  SELECT id FROM applications WHERE broker_id IN (
    SELECT id FROM brokers WHERE email LIKE '%@example.com'
  )
);

-- Summary by broker
SELECT 
  b.full_name as broker,
  b.brokerage_name,
  COUNT(DISTINCT a.id) as applications,
  COUNT(DISTINCT br.id) as borrowers,
  STRING_AGG(DISTINCT a.status::text, ', ') as statuses
FROM brokers b
LEFT JOIN applications a ON a.broker_id = b.id
LEFT JOIN borrowers br ON br.application_id = a.id
WHERE b.email LIKE '%@example.com'
GROUP BY b.id, b.full_name, b.brokerage_name
ORDER BY b.full_name;
