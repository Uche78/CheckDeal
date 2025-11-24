import { useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import type { AnalysisSection } from '../../lib/types/database';

interface AnalyzeButtonProps {
  applicationId: string;
  section: AnalysisSection;
  documentCount: number;
  hasExistingAnalysis: boolean;
  stressTestEnabled?: boolean;
  onAnalysisComplete?: () => void;
  onAnalysisError?: (error: string) => void;
}

export default function AnalyzeButton({
  applicationId,
  section,
  documentCount,
  hasExistingAnalysis,
  stressTestEnabled = false,
  onAnalysisComplete,
  onAnalysisError,
}: AnalyzeButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Get human-readable section name
  const getSectionName = (section: AnalysisSection): string => {
    switch (section) {
      case 'income_employment':
        return 'Income & Employment';
      case 'property':
        return 'Property';
      case 'borrower_details':
        return 'Borrower Details';
      case 'assets_liabilities':
        return 'Assets & Liabilities';
      case 'overall_summary':
        return 'Overall Summary';
      default:
        return section;
    }
  };

  const handleAnalyze = async () => {
    // Don't analyze if no documents
    if (documentCount === 0) {
      if (onAnalysisError) {
        onAnalysisError(`No documents found in ${getSectionName(section)} category. Please upload documents first.`);
      }
      return;
    }

    setIsAnalyzing(true);

    try {
      // Get the current session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const response = await fetch(`/api/analyze/${section}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          application_id: applicationId,
          stress_test_enabled: section === 'income_employment' ? stressTestEnabled : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      // Call success callback
      if (onAnalysisComplete) {
        onAnalysisComplete();
      }

    } catch (error) {
      console.error('Analysis error:', error);
      if (onAnalysisError) {
        onAnalysisError(error instanceof Error ? error.message : 'Analysis failed');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <button
      onClick={handleAnalyze}
      disabled={isAnalyzing || documentCount === 0}
      className={`
        inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
        transition-all duration-200 shadow-sm
        ${
          isAnalyzing
            ? 'bg-blue-400 text-white cursor-not-allowed'
            : documentCount === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : hasExistingAnalysis
            ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        }
      `}
      title={
        documentCount === 0
          ? 'Upload documents first'
          : hasExistingAnalysis
          ? 'Re-analyze documents'
          : 'Analyze documents'
      }
    >
      {isAnalyzing ? (
        <>
          {/* Loading Spinner */}
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Analyzing...
        </>
      ) : (
        <>
          {/* AI Icon */}
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          {hasExistingAnalysis ? 'Re-analyze' : 'Analyze with AI'}
        </>
      )}
    </button>
  );
}
