import { useState, useEffect } from 'react';

interface RequiredDocumentsChecklistProps {
  applicationId: string;
}

interface DocumentRequirement {
  name: string;
  category: string;
  required: boolean;
  uploaded: boolean;
}

export default function RequiredDocumentsChecklist({ applicationId }: RequiredDocumentsChecklistProps) {
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([
    { name: 'Pay Stubs (Recent 2-3)', category: 'income_employment', required: true, uploaded: false },
    { name: 'T4 / Tax Returns', category: 'income_employment', required: true, uploaded: false },
    { name: 'Employment Letter', category: 'income_employment', required: true, uploaded: false },
    { name: 'Bank Statements (90 days)', category: 'assets_liabilities', required: true, uploaded: false },
    { name: 'Credit Report', category: 'borrower_details', required: true, uploaded: false },
    { name: 'Government ID', category: 'borrower_details', required: true, uploaded: false },
    { name: 'Purchase Agreement', category: 'property', required: true, uploaded: false },
    { name: 'Property Appraisal', category: 'property', required: false, uploaded: false },
    { name: 'Home Inspection Report', category: 'property', required: false, uploaded: false },
    { name: 'Gift Letter (if applicable)', category: 'assets_liabilities', required: false, uploaded: false },
    { name: 'Investment Statements', category: 'assets_liabilities', required: false, uploaded: false },
    { name: 'Proof of Down Payment', category: 'assets_liabilities', required: true, uploaded: false },
  ]);

  const requiredDocs = requirements.filter(r => r.required);
  const uploadedRequired = requiredDocs.filter(r => r.uploaded).length;
  const progress = (uploadedRequired / requiredDocs.length) * 100;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-semibold text-gray-900">
            {uploadedRequired} of {requiredDocs.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>



      {/* Document Checklist */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {requirements.map((req, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              {req.uploaded ? (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${req.uploaded ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                {req.name}
              </p>
              {!req.required && (
                <span className="text-xs text-gray-500">Optional</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
