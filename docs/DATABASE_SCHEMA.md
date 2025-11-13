# DealCheck Database Schema

## Overview
This document describes the database schema for the DealCheck application.

## Database: PostgreSQL (via Supabase)

## Tables

### 1. brokers
**Purpose:** Stores mortgage broker user accounts

**Key Columns:**
- `id` - Primary key (UUID)
- `auth_id` - Foreign key to Supabase Auth users
- `email` - Broker email address (unique)
- `full_name` - Broker's full name
- `brokerage_name` - Name of brokerage
- `license_number` - Broker license number

**Relationships:**
- One-to-Many with `applications`

---

### 2. applications
**Purpose:** Stores mortgage applications

**Key Columns:**
- `id` - Primary key (UUID)
- `broker_id` - Foreign key to brokers
- `status` - Application status (enum)
- `property_address` - Address of property
- `loan_amount` - Requested loan amount
- `down_payment` - Down payment amount
- `upload_token` - Unique token for borrower upload portal

**Relationships:**
- Belongs to `brokers`
- One-to-Many with `borrowers`
- One-to-Many with `documents`
- One-to-Many with `analysis_results`

**Status Flow:**
draft → collecting → organized → analyzed → submitted → approved/rejected → complete

---

### 3. borrowers
**Purpose:** Stores borrower information (primary, co-borrowers, guarantors)

**Key Columns:**
- `id` - Primary key (UUID)
- `application_id` - Foreign key to applications
- `borrower_type` - Type: primary, co_borrower, guarantor
- `full_name` - Borrower's full name
- `email` - Contact email
- `annual_income` - Borrower's annual income

**Relationships:**
- Belongs to `applications`
- One-to-Many with `documents` (optional)

---

### 4. documents
**Purpose:** Stores uploaded mortgage documents

**Key Columns:**
- `id` - Primary key (UUID)
- `application_id` - Foreign key to applications
- `file_name` - Original file name
- `file_path` - Path in Supabase Storage
- `status` - Document processing status
- `category` - Document category (income, property, etc.)
- `fraud_status` - Fraud detection result
- `extracted_text` - OCR extracted text
- `fraud_details` - JSON of fraud alerts

**Relationships:**
- Belongs to `applications`
- Optionally belongs to `borrowers`

**Categories:**
- income_employment
- property
- borrower_details
- assets_liabilities
- uncategorized

---

### 5. analysis_results
**Purpose:** Stores AI analysis results for each section

**Key Columns:**
- `id` - Primary key (UUID)
- `application_id` - Foreign key to applications
- `section` - Which section analyzed (enum)
- `pros` - Array of positive findings
- `cons` - Array of risks/concerns
- `recommendations` - Array of action items
- `key_metrics` - JSON of calculated metrics
- `risk_score` - Overall risk score (0-100)

**Relationships:**
- Belongs to `applications`
- Unique constraint: one analysis per section per application

**Sections:**
- income_employment
- property
- borrower_details
- assets_liabilities
- overall_summary

---

## Enums

### application_status
- draft
- collecting
- organized
- analyzed
- submitted
- approved
- rejected
- complete

### document_status
- pending
- processing
- clean
- flagged
- organized
- analyzed

### document_category
- income_employment
- property
- borrower_details
- assets_liabilities
- uncategorized

### borrower_type
- primary
- co_borrower
- guarantor

### fraud_severity
- low
- medium
- high
- critical

### analysis_section
- income_employment
- property
- borrower_details
- assets_liabilities
- overall_summary

---

## Indexes

All tables have indexes on:
- Primary keys (automatic)
- Foreign keys
- Status fields
- Timestamp fields (created_at, deleted_at)
- Frequently queried fields

---

## Soft Deletes

All tables include a `deleted_at` column for soft delete functionality. Records are never actually deleted, just marked as deleted.

---

## Timestamps

All tables automatically track:
- `created_at` - When record was created
- `updated_at` - When record was last updated (auto-updated via trigger)
- `deleted_at` - When record was soft-deleted (null if active)

---

## Schema Version: 001
**Created:** November 13, 2025
**Last Updated:** November 13, 2025
