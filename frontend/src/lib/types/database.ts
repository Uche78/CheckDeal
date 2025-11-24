// Database type definitions for DealCheck
// Matches the Supabase schema created in Sprint 1

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      brokers: {
  Row: {
    id: string
    user_id: string
    email: string
    full_name: string | null
    phone: string | null
    company_name: string | null
    license_number: string | null
    notification_email: boolean
    notification_sms: boolean
    created_at: string
    updated_at: string
    deleted_at: string | null
  }
  Insert: {
    id?: string
    user_id: string
    email: string
    full_name?: string | null
    phone?: string | null
    company_name?: string | null
    license_number?: string | null
    notification_email?: boolean
    notification_sms?: boolean
    created_at?: string
    updated_at?: string
    deleted_at?: string | null
  }
  Update: {
    id?: string
    user_id?: string
    email?: string
    full_name?: string | null
    phone?: string | null
    company_name?: string | null
    license_number?: string | null
    notification_email?: boolean
    notification_sms?: boolean
    created_at?: string
    updated_at?: string
    deleted_at?: string | null
  }
}
      applications: {
        Row: {
          id: string
          broker_id: string
          status: 'draft' | 'collecting' | 'organized' | 'analyzed' | 'submitted' | 'approved' | 'rejected' | 'complete'
          property_address: string
          property_type: 'single-family' | 'condo' | 'townhouse' | 'multi-family' | 'commercial'
          property_value: number
          loan_amount: number
          down_payment: number
          loan_purpose: 'purchase' | 'refinance' | 'equity' | 'renewal'
          interest_rate: number | null
          amortization_years: number | null
          upload_token: string
          expires_at: string | null
          submitted_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          broker_id: string
          status?: 'draft' | 'collecting' | 'organized' | 'analyzed' | 'submitted' | 'approved' | 'rejected' | 'complete'
          property_address: string
          city: string
          province: string
          postal_code: string
          property_type: 'single-family' | 'condo' | 'townhouse' | 'multi-family' | 'commercial'
          property_value: number
          loan_amount: number
          down_payment: number
          loan_purpose: 'purchase' | 'refinance' | 'equity' | 'renewal'
          interest_rate?: number | null
          amortization_years?: number | null
          upload_token?: string
          expires_at?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          broker_id?: string
          status?: 'draft' | 'collecting' | 'organized' | 'analyzed' | 'submitted' | 'approved' | 'rejected' | 'complete'
          property_address?: string
          city?: string
          province?: string
          postal_code?: string
          property_type?: 'single-family' | 'condo' | 'townhouse' | 'multi-family' | 'commercial'
          property_value?: number
          loan_amount?: number
          down_payment?: number
          loan_purpose?: 'purchase' | 'refinance' | 'equity' | 'renewal'
          interest_rate?: number | null
          amortization_years?: number | null
          upload_token?: string
          expires_at?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      borrowers: {
        Row: {
          id: string
          application_id: string
          borrower_type: 'primary' | 'co_borrower' | 'guarantor'
          full_name: string
          email: string | null
          phone: string | null
          date_of_birth: string | null
          employment_status: 'full-time' | 'part-time' | 'self-employed' | 'contract' | 'retired' | 'unemployed'
          employer: string | null
          job_title: string | null
          annual_income: number | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          application_id: string
          borrower_type: 'primary' | 'co_borrower' | 'guarantor'
          full_name: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          employment_status?: 'full-time' | 'part-time' | 'self-employed' | 'contract' | 'retired' | 'unemployed'
          employer?: string | null
          job_title?: string | null
          annual_income?: number | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          application_id?: string
          borrower_type?: 'primary' | 'co_borrower' | 'guarantor'
          full_name?: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          employment_status?: 'full-time' | 'part-time' | 'self-employed' | 'contract' | 'retired' | 'unemployed'
          employer?: string | null
          job_title?: string | null
          annual_income?: number | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
// Document types
export interface Document {
  id: string;
  application_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: 'broker' | 'borrower';
  uploaded_at: string;
  status: 'new' | 'fraud_alert' | 'organized' | 'analyzed';
  fraud_score?: number;
  fraud_flags?: any;
  created_at: string;
  updated_at: string;
}

export type DocumentInsert = Omit<Document, 'id' | 'created_at' | 'updated_at' | 'uploaded_at'>;
export type DocumentUpdate = Partial<Omit<Document, 'id' | 'application_id' | 'created_at'>>;
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      application_status: 'draft' | 'collecting' | 'organized' | 'analyzed' | 'submitted' | 'approved' | 'rejected' | 'complete'
      property_type: 'single-family' | 'condo' | 'townhouse' | 'multi-family' | 'commercial'
      loan_purpose: 'purchase' | 'refinance' | 'equity' | 'renewal'
      borrower_type: 'primary' | 'co_borrower' | 'guarantor'
      employment_status: 'full-time' | 'part-time' | 'self-employed' | 'contract' | 'retired' | 'unemployed'
    }
  }
}

// Convenience types for easier use in components
export type Broker = Database['public']['Tables']['brokers']['Row']
export type Application = Database['public']['Tables']['applications']['Row']
export type Borrower = Database['public']['Tables']['borrowers']['Row']

export type BrokerInsert = Database['public']['Tables']['brokers']['Insert'];
export type BrokerUpdate = Database['public']['Tables']['brokers']['Update'];

export type ApplicationInsert = Database['public']['Tables']['applications']['Insert']
export type ApplicationUpdate = Database['public']['Tables']['applications']['Update']

export type BorrowerInsert = Database['public']['Tables']['borrowers']['Insert']
export type BorrowerUpdate = Database['public']['Tables']['borrowers']['Update']

// Extended type that includes borrowers for display purposes
export type ApplicationWithBorrowers = Application & {
  borrowers: Borrower[]
}

// Type for application statistics

export interface ApplicationStats {
  total: number;
  pending: number;
  in_progress: number;
  approved: number;
  denied: number;
  flagged: number;
}

// Upload Token types
export interface UploadToken {
  id: string;
  application_id: string;
  token: string;
  expires_at: string;
  is_used: boolean;
  used_at: string | null;
  created_by: string | null;
  created_at: string;
  max_uploads: number | null;
  uploads_count: number;
}

export type UploadTokenInsert = Omit<UploadToken, 'id' | 'created_at' | 'is_used' | 'used_at' | 'uploads_count'>;
export type UploadTokenUpdate = Partial<Omit<UploadToken, 'id' | 'token' | 'application_id'>>;

// ============================================
// ANALYSIS RESULTS TYPES
// ============================================

export type AnalysisSection = 'income_employment' | 'property' | 'borrower_details' | 'assets_liabilities' | 'overall_summary';

export interface AnalysisResult {
  id: string;
  application_id: string;
  section: AnalysisSection;
  
  // Analysis results
  pros: string[] | null;
  cons: string[] | null;
  recommendations: string[] | null;
  key_metrics: Record<string, any> | null;
  
  // Risk assessment
  risk_score: number | null;  // 0-100
  risk_level: string | null;  // "low", "medium", "high"
  approval_likelihood: number | null;  // 0-100
  critical_issues: string[] | null;
  missing_documents: string[] | null;
  
  // Metadata
  ai_model: string | null;
  prompt_version: string | null;
  processing_time_ms: number | null;
  
  // Timestamps
  analyzed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type AnalysisResultInsert = Omit
  AnalysisResult, 
  'id' | 'created_at' | 'updated_at'
>;

export type AnalysisResultUpdate = Partial
  Omit<AnalysisResult, 'id' | 'application_id' | 'section' | 'created_at'>
>;

// Section-specific metric types (from prompts.ts)
export interface IncomeMetrics {
  gross_annual_income: number;
  employment_type: 'salaried' | 'hourly' | 'commission' | 'self-employed' | 'mixed';
  employment_tenure_years: number;
  income_stability: 'stable' | 'variable' | 'concerning';
  gds_ratio: number | null;
  tds_ratio: number | null;
  stress_test_qualifying_income: number | null;
  stress_test_status: 'pass' | 'fail' | 'unable_to_calculate';
  stress_test_enabled?: boolean;  // Track if stress test was applied
}

export interface PropertyMetrics {
  property_type: 'detached' | 'semi-detached' | 'townhouse' | 'condo' | 'other';
  purchase_price: number;
  appraised_value: number | null;
  ltv_ratio: number;
  price_vs_appraisal: 'at_value' | 'above_value' | 'below_value' | 'no_appraisal';
  property_condition: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  down_payment_percentage: number;
  cmhc_required: boolean;
}

export interface BorrowerMetrics {
  credit_score: number | null;
  credit_rating: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  adverse_credit_events: string[];
  recent_inquiries_count: number;
  years_in_canada: number | null;
  marital_status_risk: 'none' | 'recent_divorce' | 'separation_pending';
  overall_risk_level: 'low' | 'medium' | 'high';
}

export interface AssetsMetrics {
  total_liquid_assets: number;
  down_payment_available: number;
  down_payment_source: 'savings' | 'gift' | 'sale_of_property' | 'rrsp' | 'mixed' | 'unknown';
  gift_amount: number | null;
  gift_properly_documented: boolean | null;
  total_monthly_debts: number;
  undisclosed_liabilities_suspected: boolean;
  large_deposits_flagged: string[];
  months_of_reserves: number;
  debt_to_income_ratio: number | null;
}

// Union type for all metric types
export type SectionMetrics = IncomeMetrics | PropertyMetrics | BorrowerMetrics | AssetsMetrics;
