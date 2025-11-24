import type { SupabaseClient } from '@supabase/supabase-js';
import type { AnalysisResult, AnalysisSection } from '../types/database';

// Import client for client-side usage
import { supabase as clientSupabase } from './client';

/**
 * Create or update analysis result (UPSERT)
 * Since you have a unique constraint on (application_id, section),
 * this will update if exists, insert if not
 */
export async function upsertAnalysisResult(
  supabase: SupabaseClient,
  applicationId: string,
  section: AnalysisSection,
  data: {
    pros: string[];
    cons: string[];
    recommendations: string[];
    key_metrics: Record<string, any>;
    risk_score?: number | null;
    risk_level?: string | null;
    approval_likelihood?: number | null;
    critical_issues?: string[] | null;
    missing_documents?: string[] | null;
    ai_model?: string;
    prompt_version?: string;
    processing_time_ms?: number;
  }
): Promise<{ data: AnalysisResult | null; error: any }> {
  try {
    const { data: result, error } = await supabase
      .from('analysis_results')
      .upsert({
        application_id: applicationId,
        section: section,
        pros: data.pros,
        cons: data.cons,
        recommendations: data.recommendations,
        key_metrics: data.key_metrics,
        risk_score: data.risk_score ?? null,
        risk_level: data.risk_level ?? null,
        approval_likelihood: data.approval_likelihood ?? null,
        critical_issues: data.critical_issues ?? null,
        missing_documents: data.missing_documents ?? null,
        ai_model: data.ai_model ?? 'claude-sonnet-4-20250514',
        prompt_version: data.prompt_version ?? 'v1',
        processing_time_ms: data.processing_time_ms ?? null,
        analyzed_at: new Date().toISOString(),
      }, {
        onConflict: 'application_id,section'
      })
      .select()
      .single();

    if (error) throw error;
    return { data: result, error: null };
  } catch (error) {
    console.error('Error upserting analysis result:', error);
    return { data: null, error };
  }
}

/**
 * Get analysis result for a specific section
 */
export async function getAnalysis(
  supabase: SupabaseClient,
  applicationId: string,
  section: AnalysisSection
): Promise<{ data: AnalysisResult | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('application_id', applicationId)
      .eq('section', section)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { data: data || null, error: null };
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return { data: null, error };
  }
}

/**
 * Get all analysis results for an application
 */
export async function getAllAnalyses(
  supabase: SupabaseClient,
  applicationId: string
): Promise<{ data: AnalysisResult[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('application_id', applicationId)
      .order('section', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching all analyses:', error);
    return { data: null, error };
  }
}

/**
 * Check if an analysis exists for a section
 */
export async function hasAnalysis(
  supabase: SupabaseClient,
  applicationId: string,
  section: AnalysisSection
): Promise<{ exists: boolean; error: any }> {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('id')
      .eq('application_id', applicationId)
      .eq('section', section)
      .limit(1);

    if (error) throw error;
    return { exists: (data && data.length > 0), error: null };
  } catch (error) {
    console.error('Error checking analysis existence:', error);
    return { exists: false, error };
  }
}

/**
 * Delete an analysis result
 */
export async function deleteAnalysisResult(
  supabase: SupabaseClient,
  applicationId: string,
  section: AnalysisSection
): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('analysis_results')
      .delete()
      .eq('application_id', applicationId)
      .eq('section', section);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting analysis result:', error);
    return { error };
  }
}

/**
 * Get analysis summary for all sections (for dashboard display)
 */
export async function getAnalysisSummary(
  supabase: SupabaseClient,
  applicationId: string
): Promise<{ 
  data: { 
    income_employment: AnalysisResult | null;
    property: AnalysisResult | null;
    borrower_details: AnalysisResult | null;
    assets_liabilities: AnalysisResult | null;
    overall_summary: AnalysisResult | null;
  } | null; 
  error: any 
}> {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('application_id', applicationId);

    if (error) throw error;

    const summary = {
      income_employment: data?.find(a => a.section === 'income_employment') || null,
      property: data?.find(a => a.section === 'property') || null,
      borrower_details: data?.find(a => a.section === 'borrower_details') || null,
      assets_liabilities: data?.find(a => a.section === 'assets_liabilities') || null,
      overall_summary: data?.find(a => a.section === 'overall_summary') || null,
    };

    return { data: summary, error: null };
  } catch (error) {
    console.error('Error fetching analysis summary:', error);
    return { data: null, error };
  }
}

/**
 * Calculate overall risk level based on all sections
 */
export function calculateOverallRisk(
  analyses: (AnalysisResult | null)[]
): { risk_score: number; risk_level: string } {
  const validAnalyses = analyses.filter(a => a !== null) as AnalysisResult[];
  
  if (validAnalyses.length === 0) {
    return { risk_score: 0, risk_level: 'unknown' };
  }

  const scores = validAnalyses
    .map(a => a.risk_score)
    .filter(s => s !== null) as number[];
  
  if (scores.length === 0) {
    return { risk_score: 0, risk_level: 'unknown' };
  }

  const avgScore = Math.round(
    scores.reduce((sum, score) => sum + score, 0) / scores.length
  );

  let riskLevel = 'unknown';
  if (avgScore >= 70) riskLevel = 'low';
  else if (avgScore >= 40) riskLevel = 'medium';
  else riskLevel = 'high';

  return { risk_score: avgScore, risk_level: riskLevel };
}

/**
 * Get all critical issues across all sections
 */
export function getAllCriticalIssues(
  analyses: (AnalysisResult | null)[]
): string[] {
  const validAnalyses = analyses.filter(a => a !== null) as AnalysisResult[];
  
  const allIssues: string[] = [];
  validAnalyses.forEach(analysis => {
    if (analysis.critical_issues && analysis.critical_issues.length > 0) {
      allIssues.push(...analysis.critical_issues);
    }
  });

  return allIssues;
}

/**
 * Get all missing documents across all sections
 */
export function getAllMissingDocuments(
  analyses: (AnalysisResult | null)[]
): string[] {
  const validAnalyses = analyses.filter(a => a !== null) as AnalysisResult[];
  
  const allMissing: string[] = [];
  validAnalyses.forEach(analysis => {
    if (analysis.missing_documents && analysis.missing_documents.length > 0) {
      allMissing.push(...analysis.missing_documents);
    }
  });

  return Array.from(new Set(allMissing));
}

// ========================================
// Client-side convenience wrappers
// These use the imported client automatically
// ========================================

/**
 * Client-side wrapper for getAnalysisSummary
 * Uses the default client-side Supabase instance
 */
export async function getAnalysisSummaryClient(
  applicationId: string
): Promise<{ 
  data: { 
    income_employment: AnalysisResult | null;
    property: AnalysisResult | null;
    borrower_details: AnalysisResult | null;
    assets_liabilities: AnalysisResult | null;
    overall_summary: AnalysisResult | null;
  } | null; 
  error: any 
}> {
  return getAnalysisSummary(clientSupabase, applicationId);
}
