import type { 
  IncomeMetrics, 
  PropertyMetrics, 
  BorrowerMetrics, 
  AssetsMetrics,
  AnalysisSection 
} from '../../lib/types/database';

interface KeyMetricsProps {
  section: AnalysisSection;
  keyMetrics: IncomeMetrics | PropertyMetrics | BorrowerMetrics | AssetsMetrics;
}

export default function KeyMetrics({ section, keyMetrics }: KeyMetricsProps) {
  // Add these helper functions at the top
  const formatNumber = (value: any): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.00';
    }
    return Number(value).toFixed(2);
  };

  const formatCurrency = (value: any): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '$0.00';
    }
    return '$' + Number(value).toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    });
  };

  // Helper function to format percentage
  const formatPercent = (value: number | null) => {
    if (value === null) return 'N/A';
    return `${value.toFixed(1)}%`;
  };

  // Render metrics based on section type
  const renderMetrics = () => {
    switch (section) {
      case 'income_employment':
        return renderIncomeMetrics(keyMetrics as IncomeMetrics);
      case 'property':
        return renderPropertyMetrics(keyMetrics as PropertyMetrics);
      case 'borrower_details':
        return renderBorrowerMetrics(keyMetrics as BorrowerMetrics);
      case 'assets_liabilities':
        return renderAssetsMetrics();
      default:
        return null;
    }
  };

  const renderIncomeMetrics = (m: IncomeMetrics) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard
        label="Gross Annual Income"
        value={formatCurrency(m.gross_annual_income)}
        icon="💰"
      />
      <MetricCard
        label="Employment Type"
        value={m.employment_type || 'N/A'}
        icon="👔"
      />
      <MetricCard
        label="Job Tenure"
        value={m.employment_tenure || 'N/A'}
        icon="📅"
      />
      <MetricCard
        label="Income Stability"
        value={m.income_stability || 'N/A'}
        icon={m.income_stability === 'stable' ? '✅' : m.income_stability === 'variable' ? '⚠️' : '❓'}
      />
      <MetricCard
        label="GDS Ratio"
        value={formatPercent(m.gds_ratio)}
        icon="🏠"
        status={m.gds_ratio !== null && m.gds_ratio <= 32 ? 'good' : 'warning'}
      />
      <MetricCard
        label="TDS Ratio"
        value={formatPercent(m.tds_ratio)}
        icon="💳"
        status={m.tds_ratio !== null && m.tds_ratio <= 40 ? 'good' : 'warning'}
      />
      {m.stress_test_qualifying_income !== null && (
        <>
          <MetricCard
            label="Stress Test Income"
            value={formatCurrency(m.stress_test_qualifying_income)}
            icon="🧪"
          />
          <MetricCard
            label="Stress Test Status"
            value={m.stress_test_status || 'N/A'}
            icon={m.stress_test_status === 'pass' ? '✅' : '❌'}
            status={m.stress_test_status === 'pass' ? 'good' : 'error'}
          />
        </>
      )}
    </div>
  );

  const renderPropertyMetrics = (m: PropertyMetrics) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard
        label="Property Type"
        value={m.property_type || 'N/A'}
        icon="🏡"
      />
      <MetricCard
        label="Purchase Price"
        value={formatCurrency(m.purchase_price)}
        icon="💵"
      />
      <MetricCard
        label="Appraised Value"
        value={m.appraised_value !== null ? formatCurrency(m.appraised_value) : 'Pending'}
        icon="📊"
      />
      <MetricCard
        label="LTV Ratio"
        value={formatPercent(m.ltv_ratio)}
        icon="📈"
        status={m.ltv_ratio !== null && m.ltv_ratio <= 80 ? 'good' : 'warning'}
      />
      <MetricCard
        label="Down Payment"
        value={formatPercent(m.down_payment_percentage)}
        icon="💰"
        status={m.down_payment_percentage >= 20 ? 'good' : 'warning'}
      />
      <MetricCard
        label="Property Condition"
        value={m.property_condition || 'N/A'}
        icon={
          m.property_condition === 'excellent' ? '⭐' :
          m.property_condition === 'good' ? '👍' :
          m.property_condition === 'fair' ? '👌' :
          m.property_condition === 'poor' ? '⚠️' : '❓'
        }
      />
      <MetricCard
        label="Price vs Appraisal"
        value={
          m.price_vs_appraisal === 'at_value' ? 'At Market Value' :
          m.price_vs_appraisal === 'above_value' ? 'Above Market' :
          m.price_vs_appraisal === 'below_value' ? 'Below Market' :
          'No Appraisal'
        }
        icon={
          m.price_vs_appraisal === 'at_value' ? '✅' :
          m.price_vs_appraisal === 'below_value' ? '👍' :
          m.price_vs_appraisal === 'above_value' ? '⚠️' : '❓'
        }
      />
      <MetricCard
        label="CMHC Insurance"
        value={m.cmhc_required ? 'Required' : 'Not Required'}
        icon={m.cmhc_required ? '🛡️' : '✅'}
      />
    </div>
  );

  const renderBorrowerMetrics = (m: BorrowerMetrics) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard
        label="Credit Score"
        value={m.credit_score !== null ? m.credit_score.toString() : 'N/A'}
        icon="📊"
        status={
          m.credit_score !== null
            ? m.credit_score >= 700 ? 'good' : m.credit_score >= 650 ? 'warning' : 'error'
            : undefined
        }
      />
      <MetricCard
        label="Credit Rating"
        value={m.credit_rating || 'N/A'}
        icon={
          m.credit_rating === 'excellent' ? '⭐' :
          m.credit_rating === 'good' ? '👍' :
          m.credit_rating === 'fair' ? '👌' :
          m.credit_rating === 'poor' ? '⚠️' : '❓'
        }
      />
      <MetricCard
        label="Recent Credit Inquiries"
        value={m.recent_inquiries_count.toString()}
        icon="🔍"
        status={m.recent_inquiries_count <= 3 ? 'good' : 'warning'}
      />
      <MetricCard
        label="Years in Canada"
        value={m.years_in_canada !== null ? `${m.years_in_canada} years` : 'N/A'}
        icon="🇨🇦"
      />
      <MetricCard
        label="Marital Status Risk"
        value={
          m.marital_status_risk === 'none' ? 'No Risk' :
          m.marital_status_risk === 'recent_divorce' ? 'Recent Divorce' :
          m.marital_status_risk === 'separation_pending' ? 'Separation Pending' :
          'Unknown'
        }
        icon={m.marital_status_risk === 'none' ? '✅' : '⚠️'}
      />
      <MetricCard
        label="Overall Risk Level"
        value={m.overall_risk_level || 'N/A'}
        icon={
          m.overall_risk_level === 'low' ? '✅' :
          m.overall_risk_level === 'medium' ? '⚠️' : '❌'
        }
        status={
          m.overall_risk_level === 'low' ? 'good' :
          m.overall_risk_level === 'medium' ? 'warning' : 'error'
        }
      />
      {m.adverse_credit_events.length > 0 && (
        <div className="col-span-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-red-900 mb-2">
              Adverse Credit Events ({m.adverse_credit_events.length})
            </h5>
            <ul className="space-y-1">
              {m.adverse_credit_events.map((event, index) => (
                <li key={index} className="text-sm text-red-800 flex items-center">
                  <span className="mr-2">•</span>
                  {event}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  const renderAssetsMetrics = () => {
    const metrics = keyMetrics as any;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-blue-600 font-medium uppercase mb-1">Total Assets</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(metrics?.total_assets)}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-xs text-red-600 font-medium uppercase mb-1">Total Liabilities</p>
          <p className="text-2xl font-bold text-red-900">
            {formatCurrency(metrics?.total_liabilities)}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs text-green-600 font-medium uppercase mb-1">Net Worth</p>
          <p className="text-2xl font-bold text-green-900">
            {formatCurrency((metrics?.total_assets || 0) - (metrics?.total_liabilities || 0))}
          </p>
        </div>
        
        {metrics?.total_down_payment !== null && metrics?.total_down_payment !== undefined && (
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-xs text-purple-600 font-medium uppercase mb-1">Down Payment Verified</p>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(metrics.total_down_payment)}
            </p>
          </div>
        )}
        
        {metrics?.liquid_assets !== null && metrics?.liquid_assets !== undefined && (
          <div className="bg-cyan-50 rounded-lg p-4">
            <p className="text-xs text-cyan-600 font-medium uppercase mb-1">Liquid Assets</p>
            <p className="text-2xl font-bold text-cyan-900">
              {formatCurrency(metrics.liquid_assets)}
            </p>
          </div>
        )}
        
        {metrics?.debt_service_ratio !== null && metrics?.debt_service_ratio !== undefined && (
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-xs text-orange-600 font-medium uppercase mb-1">Debt Service Ratio</p>
            <p className="text-2xl font-bold text-orange-900">
              {formatNumber(metrics.debt_service_ratio)}%
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderMetrics()}
    </div>
  );
}

// Helper component for individual metric cards
interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  status?: 'good' | 'warning' | 'error';
}

function MetricCard({ label, value, icon, status }: MetricCardProps) {
  const getBgColor = () => {
    if (!status) return 'bg-gray-50';
    switch (status) {
      case 'good': return 'bg-green-50';
      case 'warning': return 'bg-yellow-50';
      case 'error': return 'bg-red-50';
    }
  };

  const getBorderColor = () => {
    if (!status) return 'border-gray-200';
    switch (status) {
      case 'good': return 'border-green-200';
      case 'warning': return 'border-yellow-200';
      case 'error': return 'border-red-200';
    }
  };

  const getTextColor = () => {
    if (!status) return 'text-gray-900';
    switch (status) {
      case 'good': return 'text-green-900';
      case 'warning': return 'text-yellow-900';
      case 'error': return 'text-red-900';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getBgColor()} ${getBorderColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className={`text-lg font-bold ${getTextColor()}`}>{value}</p>
    </div>
  );
}
