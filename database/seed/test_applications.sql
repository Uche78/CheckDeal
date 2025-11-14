-- =====================================================
-- Seed Data: Test Applications
-- =====================================================
-- Description: Create sample mortgage applications
-- Prerequisite: Run test_brokers.sql first
-- =====================================================

-- Insert test applications for John Smith (broker 1)
INSERT INTO applications (
  id,
  broker_id,
  status,
  property_address,
  property_type,
  property_value,
  loan_amount,
  down_payment,
  loan_type,
  stress_test_enabled
) VALUES
  -- Application 1: First-time buyer in Toronto
  (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001', -- John Smith
    'collecting',
    '123 Main Street, Toronto, ON M5V 2T6',
    'Condo',
    650000.00,
    520000.00,
    130000.00,
    'Conventional',
    true
  ),
  -- Application 2: Family home in Mississauga
  (
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001', -- John Smith
    'organized',
    '456 Oak Avenue, Mississauga, ON L5B 3Y7',
    'Single Family',
    950000.00,
    760000.00,
    190000.00,
    'Conventional',
    true
  ),
  -- Application 3: Townhouse in Brampton
  (
    '660e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001', -- John Smith
    'draft',
    '789 Maple Road, Brampton, ON L6Y 4R3',
    'Townhouse',
    725000.00,
    580000.00,
    145000.00,
    'Conventional',
    true
  );

-- Insert test applications for Sarah Johnson (broker 2)
INSERT INTO applications (
  id,
  broker_id,
  status,
  property_address,
  property_type,
  property_value,
  loan_amount,
  down_payment,
  loan_type,
  stress_test_enabled
) VALUES
  -- Application 4: Downtown condo
  (
    '660e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440002', -- Sarah Johnson
    'analyzed',
    '101 King Street West, Toronto, ON M5H 1A1',
    'Condo',
    575000.00,
    460000.00,
    115000.00,
    'Conventional',
    true
  ),
  -- Application 5: Detached home in Oakville
  (
    '660e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440002', -- Sarah Johnson
    'submitted',
    '222 Lakeshore Drive, Oakville, ON L6K 3W5',
    'Single Family',
    1250000.00,
    1000000.00,
    250000.00,
    'Conventional',
    true
  );

-- Insert test applications for Mike Chen (broker 3)
INSERT INTO applications (
  id,
  broker_id,
  status,
  property_address,
  property_type,
  property_value,
  loan_amount,
  down_payment,
  loan_type,
  stress_test_enabled
) VALUES
  -- Application 6: Investment property
  (
    '660e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440003', -- Mike Chen
    'collecting',
    '333 University Avenue, Toronto, ON M5G 1R8',
    'Condo',
    480000.00,
    336000.00,
    144000.00,
    'Conventional',
    false
  ),
  -- Application 7: Luxury property in Vaughan
  (
    '660e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440003', -- Mike Chen
    'approved',
    '555 Forest Lane, Vaughan, ON L4H 2N1',
    'Single Family',
    1850000.00,
    1480000.00,
    370000.00,
    'Conventional',
    true
  );

-- =====================================================
-- Verification
-- =====================================================
SELECT 
  b.full_name as broker,
  COUNT(a.id) as application_count,
  STRING_AGG(a.status::text, ', ') as statuses
FROM applications a
JOIN brokers b ON a.broker_id = b.id
WHERE b.email LIKE '%@example.com'
GROUP BY b.full_name
ORDER BY b.full_name;
