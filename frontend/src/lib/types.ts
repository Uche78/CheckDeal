// Broker/User types
export interface Broker {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
  phone?: string;
  brokerage_name?: string;
  license_number?: string;
  notification_email: boolean;
  notification_sms: boolean;
  created_at: string;
  updated_at: string;
}

// Application types
export type ApplicationStatus = 
  | 'draft'
  | 'collecting'
  | 'organized'
  | 'analyzed'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'complete';

export interface Application {
  id: string;
  broker_id: string;
  status: ApplicationStatus;
  property_address: string;
  property_type?: string;
  property_value?: number;
  loan_amount: number;
  down_payment: number;
  down_payment_percentage?: number;
  loan_type?: string;
  stress_test_enabled: boolean;
  upload_token?: string;
  upload_token_expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Borrower types
export type BorrowerType = 'primary' | 'co_borrower' | 'guarantor';

export interface Borrower {
  id: string;
  application_id: string;
  borrower_type: BorrowerType;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  sin?: string;
  current_address?: string;
  years_at_address?: number;
  employer_name?: string;
  job_title?: string;
  employment_type?: string;
  years_employed?: number;
  annual_income?: number;
  created_at: string;
  updated_at: string;
}

// Document types
export type DocumentStatus = 
  | 'pending'
  | 'processing'
  | 'clean'
  | 'flagged'
  | 'organized'
  | 'analyzed';

export type DocumentCategory = 
  | 'income_employment'
  | 'property'
  | 'borrower_details'
  | 'assets_liabilities'
  | 'uncategorized';

export type FraudSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Document {
  id: string;
  application_id: string;
  borrower_id?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  status: DocumentStatus;
  category: DocumentCategory;
  document_type?: string;
  classification_confidence?: number;
  extracted_text?: string;
  extracted_data?: Record<string, any>;
  fraud_checked: boolean;
  fraud_status: string;
  fraud_confidence?: number;
  fraud_severity?: FraudSeverity;
  fraud_details?: Record<string, any>;
  uploaded_by: 'borrower' | 'broker';
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

// Analysis types
export type AnalysisSection = 
  | 'income_employment'
  | 'property'
  | 'borrower_details'
  | 'assets_liabilities'
  | 'overall_summary';

export interface AnalysisResult {
  id: string;
  application_id: string;
  section: AnalysisSection;
  pros: string[];
  cons: string[];
  recommendations: string[];
  key_metrics?: Record<string, any>;
  risk_score?: number;
  risk_level?: 'green' | 'yellow' | 'red';
  approval_likelihood?: number;
  critical_issues?: string[];
  missing_documents?: string[];
  ai_model?: string;
  prompt_version?: string;
  processing_time_ms?: number;
  analyzed_at: string;
  created_at: string;
  updated_at: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordForm {
  email: string;
}

export interface NewPasswordForm {
  password: string;
  confirmPassword: string;
}

export interface BorrowerFormData {
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  employer_name?: string;
  job_title?: string;
  employment_type?: string;
  annual_income?: number;
}

export interface PropertyFormData {
  property_address: string;
  property_type?: string;
  property_value?: number;
  loan_amount: number;
  down_payment: number;
  loan_type?: string;
}

export interface ApplicationFormData {
  borrower: BorrowerFormData;
  coBorrower?: BorrowerFormData;
  property: PropertyFormData;
  stress_test_enabled: boolean;
}
