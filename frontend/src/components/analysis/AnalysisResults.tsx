import { useState } from 'react';
import type { AnalysisResult } from '../../lib/types/database';

interface AnalysisResultsProps {
  analysis: AnalysisResult;
  sectionName: string;
}

export default function AnalysisResults({ analysis, sectionName }: AnalysisResultsProps) {
  const [expandedSections, setExpandedSections] = useState<{
    pros: boolean;
    cons: boolean;
    recommendations: boolean;
    critical: boolean;
    missing: boolean;
  }>({
    pros: true,
    cons: true,
    recommendations: true,
    critical: (analysis.critical_issues || []).length > 0,
    missing: (analysis.missing_documents || []).length > 0,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-4">
      {/* Critical Issues (if any) */}
      {analysis.critical_issues && analysis.critical_issues.length > 0 && (
        <div className="border border-red-200 rounded-lg overflow-hidden bg-red-50">
          <button
            onClick={() => toggleSection('critical')}
            className="w-full flex items-center justify-between p-4 hover:bg-red-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-red-900">
                  Critical Issues ({(analysis.critical_issues || []).length})
                </h4>
                <p className="text-xs text-red-700">Requires immediate attention</p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-red-600 transition-transform ${
                expandedSections.critical ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.critical && (
            <div className="px-4 pb-4 space-y-2">
              {(analysis.critical_issues || []).map((issue, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-white rounded border border-red-200">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-900">{issue}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Missing Documents (if any) */}
      {analysis.missing_documents && analysis.missing_documents.length > 0 && (
        <div className="border border-yellow-200 rounded-lg overflow-hidden bg-yellow-50">
          <button
            onClick={() => toggleSection('missing')}
            className="w-full flex items-center justify-between p-4 hover:bg-yellow-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-yellow-900">
                  Missing Documents ({(analysis.missing_documents || []).length})
                </h4>
                <p className="text-xs text-yellow-700">Required for complete analysis</p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-yellow-600 transition-transform ${
                expandedSections.missing ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.missing && (
            <div className="px-4 pb-4 space-y-2">
              {(analysis.missing_documents || []).map((doc, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-white rounded border border-yellow-200">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-yellow-900">{doc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pros */}
      <div className="border border-green-200 rounded-lg overflow-hidden bg-green-50">
        <button
          onClick={() => toggleSection('pros')}
          className="w-full flex items-center justify-between p-4 hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-left">
              <h4 className="text-sm font-semibold text-green-900">
                Strengths ({(analysis.pros || []).length})
              </h4>
              <p className="text-xs text-green-700">Positive factors supporting approval</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-green-600 transition-transform ${
              expandedSections.pros ? 'transform rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.pros && (
          <div className="px-4 pb-4 space-y-2">
            {(analysis.pros || []).map((pro, index) => (
              <div key={index} className="flex items-start space-x-2 p-3 bg-white rounded border border-green-200">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-green-900">{pro}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cons */}
      <div className="border border-orange-200 rounded-lg overflow-hidden bg-orange-50">
        <button
          onClick={() => toggleSection('cons')}
          className="w-full flex items-center justify-between p-4 hover:bg-orange-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-left">
              <h4 className="text-sm font-semibold text-orange-900">
                Concerns ({(analysis.cons || []).length})
              </h4>
              <p className="text-xs text-orange-700">Areas requiring attention or mitigation</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-orange-600 transition-transform ${
              expandedSections.cons ? 'transform rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.cons && (
          <div className="px-4 pb-4 space-y-2">
            {(analysis.cons || []).map((con, index) => (
              <div key={index} className="flex items-start space-x-2 p-3 bg-white rounded border border-orange-200">
                <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-orange-900">{con}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="border border-blue-200 rounded-lg overflow-hidden bg-blue-50">
        <button
          onClick={() => toggleSection('recommendations')}
          className="w-full flex items-center justify-between p-4 hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-left">
              <h4 className="text-sm font-semibold text-blue-900">
                Recommendations ({(analysis.recommendations || []).length})
              </h4>
              <p className="text-xs text-blue-700">Actions to strengthen the application</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-blue-600 transition-transform ${
              expandedSections.recommendations ? 'transform rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSections.recommendations && (
          <div className="px-4 pb-4 space-y-2">
            {(analysis.recommendations || []).map((rec, index) => (
              <div key={index} className="flex items-start space-x-2 p-3 bg-white rounded border border-blue-200">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-900">{rec}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
