-- =====================================================
-- DealCheck Database Schema - Initial Setup
-- =====================================================
-- Version: 001
-- Description: Core tables for brokers, applications, borrowers, documents, and analysis
-- Created: November 13, 2025
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

-- Application status
CREATE TYPE application_status AS ENUM (
  'draft',           -- Application created but not submitted
  'collecting',      -- Collecting documents from borrower
  'organized',       -- Documents organized into categories
  'analyzed',        -- Analysis complete
  'submitted',       -- Submitted to lender
  'approved',        -- Approved by lender
  'rejected',        -- Rejected by lender
  'complete'         -- Deal closed
);

-- Document status
CREATE TYPE document_status AS ENUM (
  'pending',         -- Uploaded, not yet processed
  'processing',      -- OCR/fraud detection in progress
  'clean',           -- No issues detected
  'flagged',         -- Fraud or issues detected
  'organized',       -- Categorized
  'analyzed'         -- Analysis complete
);

-- Document category
CREATE TYPE document_category AS ENUM (
  'income_employment',  -- Pay stubs, T4s, NOAs, employment letters
  'property',          -- MLS listings, appraisals, purchase agreements
  'borrower_details',  -- ID, credit reports, personal documents
  'assets_liabilities', -- Bank statements, investment statements
  'uncategorized'      -- Not yet categorized
);

-- Borrower type
CREATE TYPE borrower_type AS ENUM (
  'primary',        -- Primary borrower
  'co_borrower',    -- Co-borrower (spouse, partner)
  'guarantor'       -- Guarantor
);

-- Fraud alert severity
CREATE TYPE fraud_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Analysis section type
CREATE TYPE analysis_section AS ENUM (
  'income_employment',
  'property',
  'borrower_details',
  'assets_liabilities',
  'overall_summary'
);

-- =====================================================
-- TABLES
-- =====================================================

-- Brokers (Users)
CREATE TABLE brokers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Authentication (managed by Supabase Auth)
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile information
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  brokerage_name VARCHAR(255),
  license_number VARCHAR(100),
  
  -- Preferences
  notification_email BOOLEAN DEFAULT true,
  notification_sms BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  CONSTRAINT brokers_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ownership
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  
  -- Application details
  status application_status DEFAULT 'draft' NOT NULL,
  
  -- Property information
  property_address TEXT NOT NULL,
  property_type VARCHAR(100), -- e.g., 'Single Family', 'Condo', 'Townhouse'
  property_value DECIMAL(15, 2),
  
  -- Loan information
  loan_amount DECIMAL(15, 2) NOT NULL,
  down_payment DECIMAL(15, 2) NOT NULL,
  loan_type VARCHAR(100), -- e.g., 'Conventional', 'FHA', 'VA'
  
  -- Calculations
  down_payment_percentage DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN loan_amount > 0 THEN (down_payment / (loan_amount + down_payment) * 100)
      ELSE 0
    END
  ) STORED,
  
  -- Settings
  stress_test_enabled BOOLEAN DEFAULT true,
  
  -- Upload portal
  upload_token UUID UNIQUE DEFAULT uuid_generate_v4(),
  upload_token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT loan_amount_positive CHECK (loan_amount > 0),
  CONSTRAINT down_payment_positive CHECK (down_payment >= 0)
);

-- Borrowers
CREATE TABLE borrowers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationship
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  borrower_type borrower_type DEFAULT 'primary' NOT NULL,
  
  -- Personal information
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  sin VARCHAR(20), -- Social Insurance Number (encrypted in production)
  
  -- Address
  current_address TEXT,
  years_at_address DECIMAL(4, 1),
  
  -- Employment
  employer_name VARCHAR(255),
  job_title VARCHAR(255),
  employment_type VARCHAR(100), -- e.g., 'Full-time', 'Self-employed', 'Contract'
  years_employed DECIMAL(4, 1),
  annual_income DECIMAL(15, 2),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT borrowers_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT annual_income_positive CHECK (annual_income IS NULL OR annual_income >= 0)
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  borrower_id UUID REFERENCES borrowers(id) ON DELETE SET NULL,
  
  -- File information
  file_name VARCHAR(500) NOT NULL,
  file_path TEXT NOT NULL UNIQUE, -- Path in Supabase Storage
  file_size INTEGER NOT NULL, -- In bytes
  file_type VARCHAR(100) NOT NULL, -- MIME type
  
  -- Status and classification
  status document_status DEFAULT 'pending' NOT NULL,
  category document_category DEFAULT 'uncategorized' NOT NULL,
  document_type VARCHAR(200), -- Specific type: 'Pay Stub', 'T4', 'Bank Statement', etc.
  classification_confidence DECIMAL(5, 2), -- 0-100
  
  -- OCR and extracted data
  extracted_text TEXT,
  extracted_data JSONB, -- Structured data extracted from document
  
  -- Fraud detection
  fraud_checked BOOLEAN DEFAULT false,
  fraud_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'clean', 'flagged'
  fraud_confidence DECIMAL(5, 2), -- 0-100
  fraud_severity fraud_severity,
  fraud_details JSONB, -- Array of fraud alerts
  
  -- Upload information
  uploaded_by VARCHAR(50) DEFAULT 'borrower', -- 'borrower' or 'broker'
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT file_size_positive CHECK (file_size > 0),
  CONSTRAINT valid_uploaded_by CHECK (uploaded_by IN ('borrower', 'broker'))
);

-- Analysis Results
CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationships
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  section analysis_section NOT NULL,
  
  -- Analysis output
  pros TEXT[], -- Array of positive findings
  cons TEXT[], -- Array of negative findings/risks
  recommendations TEXT[], -- Array of actionable recommendations
  
  -- Metrics (stored as JSONB for flexibility)
  key_metrics JSONB, -- e.g., {"gross_income": 95000, "gds_ratio": 28.5, "tds_ratio": 35.2}
  
  -- Risk assessment
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level VARCHAR(20), -- 'green', 'yellow', 'red'
  approval_likelihood INTEGER CHECK (approval_likelihood >= 0 AND approval_likelihood <= 100),
  
  -- Critical issues
  critical_issues TEXT[],
  missing_documents TEXT[],
  
  -- AI metadata
  ai_model VARCHAR(100), -- e.g., 'claude-sonnet-4-20250514'
  prompt_version VARCHAR(50),
  processing_time_ms INTEGER,
  
  -- Metadata
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one analysis per section per application
  CONSTRAINT unique_section_analysis UNIQUE (application_id, section)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Brokers
CREATE INDEX idx_brokers_auth_id ON brokers(auth_id);
CREATE INDEX idx_brokers_email ON brokers(email);
CREATE INDEX idx_brokers_deleted_at ON brokers(deleted_at);

-- Applications
CREATE INDEX idx_applications_broker_id ON applications(broker_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_upload_token ON applications(upload_token);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX idx_applications_deleted_at ON applications(deleted_at);

-- Borrowers
CREATE INDEX idx_borrowers_application_id ON borrowers(application_id);
CREATE INDEX idx_borrowers_borrower_type ON borrowers(borrower_type);
CREATE INDEX idx_borrowers_deleted_at ON borrowers(deleted_at);

-- Documents
CREATE INDEX idx_documents_application_id ON documents(application_id);
CREATE INDEX idx_documents_borrower_id ON documents(borrower_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_fraud_status ON documents(fraud_status);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at DESC);
CREATE INDEX idx_documents_deleted_at ON documents(deleted_at);

-- Analysis Results
CREATE INDEX idx_analysis_application_id ON analysis_results(application_id);
CREATE INDEX idx_analysis_section ON analysis_results(section);
CREATE INDEX idx_analysis_analyzed_at ON analysis_results(analyzed_at DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at on table updates
CREATE TRIGGER update_brokers_updated_at
  BEFORE UPDATE ON brokers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_borrowers_updated_at
  BEFORE UPDATE ON borrowers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_results_updated_at
  BEFORE UPDATE ON analysis_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE brokers IS 'Mortgage brokers using the DealCheck platform';
COMMENT ON TABLE applications IS 'Mortgage applications with property and loan details';
COMMENT ON TABLE borrowers IS 'Borrowers associated with mortgage applications';
COMMENT ON TABLE documents IS 'Uploaded mortgage documents with fraud detection and classification';
COMMENT ON TABLE analysis_results IS 'AI analysis results for application sections';

-- =====================================================
-- END OF SCHEMA
-- =====================================================
