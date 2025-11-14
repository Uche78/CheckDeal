# Database Seed Data

## Overview
This directory contains SQL scripts to populate the database with test data for development.

## Important Notes

⚠️ **The test_brokers.sql script uses placeholder auth_id values.**

Before running the seed scripts, you need to:
1. Create actual test user accounts in Supabase Auth
2. Get their real `auth.users.id` values
3. Update the `auth_id` values in `test_brokers.sql`

## How to Run Seed Scripts

### Option A: Run Individually (Recommended)

Run in this order in Supabase SQL Editor:

1. **test_brokers.sql** - Creates 3 test broker accounts
2. **test_applications.sql** - Creates 7 test applications
3. **test_borrowers.sql** - Creates 11 test borrowers

### Option B: Clear and Reseed

Use `run_all_seeds.sql` to clear existing test data and instructions for reseeding.

## Test Data Summary

### Brokers (3)
- John Smith - Toronto Mortgage Brokers Inc.
- Sarah Johnson - GTA Mortgage Solutions
- Mike Chen - Chen Financial Group

### Applications (7)
Distributed across brokers with various statuses:
- draft
- collecting
- organized
- analyzed
- submitted
- approved

### Borrowers (11)
- Mix of primary borrowers, co-borrowers, and various income levels
- Range from $78K to $320K annual income
- Different employment types (full-time, self-employed)

## Verification Queries

After running seeds, verify with:
```sql
-- Count all test records
SELECT 'Brokers' as type, COUNT(*) FROM brokers WHERE email LIKE '%@example.com'
UNION ALL
SELECT 'Applications', COUNT(*) FROM applications WHERE broker_id IN (
  SELECT id FROM brokers WHERE email LIKE '%@example.com'
)
UNION ALL
SELECT 'Borrowers', COUNT(*) FROM borrowers WHERE application_id IN (
  SELECT id FROM applications WHERE broker_id IN (
    SELECT id FROM brokers WHERE email LIKE '%@example.com'
  )
);
```

## Clean Up Test Data

To remove all test data:
```sql
DELETE FROM borrowers WHERE application_id IN (
  SELECT id FROM applications WHERE broker_id IN (
    SELECT id FROM brokers WHERE email LIKE '%@example.com'
  )
);

DELETE FROM applications WHERE broker_id IN (
  SELECT id FROM brokers WHERE email LIKE '%@example.com'
);

DELETE FROM brokers WHERE email LIKE '%@example.com';
```
