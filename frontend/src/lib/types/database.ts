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
export type ApplicationStats = {
  total: number
  draft: number
  collecting: number
  organized: number
  analyzed: number
  submitted: number
  approved: number
  rejected: number
  complete: number
}
