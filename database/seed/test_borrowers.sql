-- =====================================================
-- Seed Data: Test Borrowers
-- =====================================================
-- Description: Create sample borrowers for test applications
-- Prerequisite: Run test_applications.sql first
-- =====================================================

-- Borrowers for Application 1 (123 Main Street, Toronto)
INSERT INTO borrowers (
  id,
  application_id,
  borrower_type,
  full_name,
  email,
  phone,
  date_of_birth,
  current_address,
  years_at_address,
  employer_name,
  job_title,
  employment_type,
  years_employed,
  annual_income
) VALUES
  (
    '770e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001',
    'primary',
    'Emily Rodriguez',
    'emily.rodriguez@email.com',
    '+1-416-555-1001',
    '1992-03-15',
    '45 Elm Street, Toronto, ON M4W 1K4',
    2.5,
    'Tech Solutions Inc.',
    'Software Developer',
    'Full-time',
    3.0,
    95000.00
  ),
  (
    '770e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440001',
    'co_borrower',
    'James Rodriguez',
    'james.rodriguez@email.com',
    '+1-416-555-1002',
    '1990-07-22',
    '45 Elm Street, Toronto, ON M4W 1K4',
    2.5,
    'Marketing Pro Agency',
    'Marketing Manager',
    'Full-time',
    5.0,
    85000.00
  );

-- Borrowers for Application 2 (456 Oak Avenue, Mississauga)
INSERT INTO borrowers (
  id,
  application_id,
  borrower_type,
  full_name,
  email,
  phone,
  date_of_birth,
  current_address,
  years_at_address,
  employer_name,
  job_title,
  employment_type,
  years_employed,
  annual_income
) VALUES
  (
    '770e8400-e29b-41d4-a716-446655440003',
    '660e8400-e29b-41d4-a716-446655440002',
    'primary',
    'David Kim',
    'david.kim@email.com',
    '+1-905-555-2001',
    '1985-11-08',
    '78 Rental Road, Mississauga, ON L5M 2G4',
    1.0,
    'Financial Services Corp',
    'Financial Analyst',
    'Full-time',
    8.0,
    110000.00
  ),
  (
    '770e8400-e29b-41d4-a716-446655440004',
    '660e8400-e29b-41d4-a716-446655440002',
    'co_borrower',
    'Lisa Kim',
    'lisa.kim@email.com',
    '+1-905-555-2002',
    '1987-05-20',
    '78 Rental Road, Mississauga, ON L5M 2G4',
    1.0,
    'Healthcare Plus',
    'Nurse Practitioner',
    'Full-time',
    6.0,
    92000.00
  );

-- Borrower for Application 3 (789 Maple Road, Brampton)
INSERT INTO borrowers (
  id,
  application_id,
  borrower_type,
  full_name,
  email,
  phone,
  date_of_birth,
  current_address,
  years_at_address,
  employer_name,
  job_title,
  employment_type,
  years_employed,
  annual_income
) VALUES
  (
    '770e8400-e29b-41d4-a716-446655440005',
    '660e8400-e29b-41d4-a716-446655440003',
    'primary',
    'Priya Patel',
    'priya.patel@email.com',
    '+1-905-555-3001',
    '1988-09-12',
    '22 Current Avenue, Brampton, ON L6T 4P2',
    3.5,
    'Education Board',
    'High School Teacher',
    'Full-time',
    7.0,
    78000.00
  );

-- Borrower for Application 4 (101 King Street West, Toronto)
INSERT INTO borrowers (
  id,
  application_id,
  borrower_type,
  full_name,
  email,
  phone,
  date_of_birth,
  current_address,
  years_at_address,
  employer_name,
  job_title,
  employment_type,
  years_employed,
  annual_income
) VALUES
  (
    '770e8400-e29b-41d4-a716-446655440006',
    '660e8400-e29b-41d4-a716-446655440004',
    'primary',
    'Michael Thompson',
    'michael.thompson@email.com',
    '+1-647-555-4001',
    '1991-01-30',
    '88 Bay Street, Toronto, ON M5J 2N8',
    4.0,
    'Consulting Group Ltd.',
    'Management Consultant',
    'Full-time',
    4.5,
    115000.00
  );

-- Borrowers for Application 5 (222 Lakeshore Drive, Oakville)
INSERT INTO borrowers (
  id,
  application_id,
  borrower_type,
  full_name,
  email,
  phone,
  date_of_birth,
  current_address,
  years_at_address,
  employer_name,
  job_title,
  employment_type,
  years_employed,
  annual_income
) VALUES
  (
    '770e8400-e29b-41d4-a716-446655440007',
    '660e8400-e29b-41d4-a716-446655440005',
    'primary',
    'Robert Anderson',
    'robert.anderson@email.com',
    '+1-905-555-5001',
    '1983-06-18',
    '100 Wealthy Street, Oakville, ON L6J 3M3',
    10.0,
    'Anderson Medical Clinic',
    'Physician',
    'Self-employed',
    15.0,
    250000.00
  ),
  (
    '770e8400-e29b-41d4-a716-446655440008',
    '660e8400-e29b-41d4-a716-446655440005',
    'co_borrower',
    'Jennifer Anderson',
    'jennifer.anderson@email.com',
    '+1-905-555-5002',
    '1985-12-25',
    '100 Wealthy Street, Oakville, ON L6J 3M3',
    10.0,
    'Law Firm Partners',
    'Lawyer',
    'Full-time',
    12.0,
    180000.00
  );

-- Borrower for Application 6 (333 University Avenue, Toronto)
INSERT INTO borrowers (
  id,
  application_id,
  borrower_type,
  full_name,
  email,
  phone,
  date_of_birth,
  current_address,
  years_at_address,
  employer_name,
  job_title,
  employment_type,
  years_employed,
  annual_income
) VALUES
  (
    '770e8400-e29b-41d4-a716-446655440009',
    '660e8400-e29b-41d4-a716-446655440006',
    'primary',
    'Angela Wu',
    'angela.wu@email.com',
    '+1-416-555-6001',
    '1989-04-05',
    '200 Condo Lane, Toronto, ON M5S 3H5',
    2.0,
    'Real Estate Investment Co',
    'Property Manager',
    'Full-time',
    6.0,
    88000.00
  );

-- Borrowers for Application 7 (555 Forest Lane, Vaughan)
INSERT INTO borrowers (
  id,
  application_id,
  borrower_type,
  full_name,
  email,
  phone,
  date_of_birth,
  current_address,
  years_at_address,
  employer_name,
  job_title,
  employment_type,
  years_employed,
  annual_income
) VALUES
  (
    '770e8400-e29b-41d4-a716-446655440010',
    '660e8400-e29b-41d4-a716-446655440007',
    'primary',
    'Richard Zhang',
    'richard.zhang@email.com',
    '+1-905-555-7001',
    '1980-10-15',
    '400 Executive Drive, Richmond Hill, ON L4C 9T6',
    7.0,
    'Zhang Enterprises',
    'Business Owner',
    'Self-employed',
    20.0,
    320000.00
  ),
  (
    '770e8400-e29b-41d4-a716-446655440011',
    '660e8400-e29b-41d4-a716-446655440007',
    'co_borrower',
    'Helen Zhang',
    'helen.zhang@email.com',
    '+1-905-555-7002',
    '1982-02-28',
    '400 Executive Drive, Richmond Hill, ON L4C 9T6',
    7.0,
    'Design Studio Inc',
    'Interior Designer',
    'Self-employed',
    12.0,
    145000.00
  );

-- =====================================================
-- Verification
-- =====================================================
SELECT 
  a.property_address,
  b.full_name as borrower,
  b.borrower_type,
  b.annual_income
FROM borrowers b
JOIN applications a ON b.application_id = a.id
ORDER BY a.created_at, b.borrower_type;
