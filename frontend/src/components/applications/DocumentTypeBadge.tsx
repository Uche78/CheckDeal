interface DocumentTypeBadgeProps {
  documentType: string | null;
  category: string;
}

export default function DocumentTypeBadge({ documentType, category }: DocumentTypeBadgeProps) {
  // Document type configurations
  const typeConfig: Record<string, { label: string; icon: string; color: string }> = {
    'bank_statement': { label: 'Bank Statement', icon: '🏦', color: 'bg-blue-100 text-blue-800' },
    'pay_stub': { label: 'Pay Stub', icon: '💰', color: 'bg-green-100 text-green-800' },
    'tax_return': { label: 'Tax Return', icon: '📋', color: 'bg-purple-100 text-purple-800' },
    'T4': { label: 'T4', icon: '📄', color: 'bg-indigo-100 text-indigo-800' },
    'T4A': { label: 'T4A', icon: '📄', color: 'bg-indigo-100 text-indigo-800' },
    'NOA': { label: 'NOA', icon: '📑', color: 'bg-purple-100 text-purple-800' },
    'employment_letter': { label: 'Employment Letter', icon: '✉️', color: 'bg-green-100 text-green-800' },
    'mortgage_statement': { label: 'Mortgage Statement', icon: '🏠', color: 'bg-orange-100 text-orange-800' },
    'property_tax': { label: 'Property Tax', icon: '🏘️', color: 'bg-orange-100 text-orange-800' },
    'home_appraisal': { label: 'Home Appraisal', icon: '📊', color: 'bg-teal-100 text-teal-800' },
    'purchase_agreement': { label: 'Purchase Agreement', icon: '📝', color: 'bg-orange-100 text-orange-800' },
    'drivers_license': { label: "Driver's License", icon: '🪪', color: 'bg-gray-100 text-gray-800' },
    'passport': { label: 'Passport', icon: '🛂', color: 'bg-gray-100 text-gray-800' },
    'credit_report': { label: 'Credit Report', icon: '📊', color: 'bg-red-100 text-red-800' },
    'investment_statement': { label: 'Investment Statement', icon: '📈', color: 'bg-blue-100 text-blue-800' },
    'loan_statement': { label: 'Loan Statement', icon: '💳', color: 'bg-red-100 text-red-800' },
    'other': { label: 'Other', icon: '📄', color: 'bg-gray-100 text-gray-800' }
  };

  // Category fallback if no specific document type
  const categoryConfig: Record<string, { label: string; icon: string; color: string }> = {
    'income_employment': { label: 'Income/Employment', icon: '💼', color: 'bg-green-100 text-green-800' },
    'property': { label: 'Property', icon: '🏠', color: 'bg-orange-100 text-orange-800' },
    'borrower_details': { label: 'Borrower Details', icon: '👤', color: 'bg-gray-100 text-gray-800' },
    'assets_liabilities': { label: 'Assets/Liabilities', icon: '💰', color: 'bg-blue-100 text-blue-800' },
    'uncategorized': { label: 'Uncategorized', icon: '❓', color: 'bg-gray-100 text-gray-800' }
  };

  // Use document type if available, otherwise fall back to category
  const config = documentType && typeConfig[documentType] 
    ? typeConfig[documentType]
    : categoryConfig[category] || categoryConfig['uncategorized'];

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
}
