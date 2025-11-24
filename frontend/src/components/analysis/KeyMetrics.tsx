import type { 
  IncomeMetrics, 
  PropertyMetrics, 
  BorrowerMetrics, 
  AssetsMetrics,
  AnalysisSection 
} from '../../lib/types/database';

interface KeyMetricsProps {
  section: AnalysisSection;
  metrics: IncomeMetrics | PropertyMetrics | BorrowerMetrics | AssetsMetrics;
}

export default function KeyMetrics({ section, metrics }: KeyMetricsProps) {
  // Helper function to format currency
  const formatCurrency = (value: number | null) => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
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
        return renderIncomeMetrics(metrics as IncomeMetrics);
      case 'property':
        return renderPropertyMetrics(metrics as PropertyMetrics);
      case 'borrower_details':
        return renderBorrowerMetrics(metrics as BorrowerMetrics);
      case 'assets_liabilities':
        return renderAssetsMetrics(metrics as AssetsMetrics);
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

  const renderAssetsMetrics = (m: AssetsMetrics) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard
        label="Total Liquid Assets"
        value={formatCurrency(m.total_liquid_assets)}
        icon="💰"
      />
      <MetricCard
        label="Down Payment Available"
        value={formatCurrency(m.down_payment_available)}
        icon="💵"
      />
      <MetricCard
        label="Down Payment Source"
        value={
          m.down_payment_source === 'savings' ? 'Savings' :
          m.down_payment_source === 'gift' ? 'Gift' :
          m.down_payment_source === 'sale_of_property' ? 'Property Sale' :
          m.down_payment_source === 'rrsp' ? 'RRSP' :
          m.down_payment_source === 'investment' ? 'Investment' :
          'Unknown'
        }
        icon={m.down_payment_source === 'savings' ? '🏦' : '🎁'}
      />
      <MetricCard
        label="Total Monthly Debts"
        value={formatCurrency(m.total_monthly_debts)}
        icon="💳"
      />
      <MetricCard
        label="Debt-to-Income Ratio"
        value={formatPercent(m.debt_to_income_ratio)}
        icon="📊"
        status={
          m.debt_to_income_ratio !== null
            ? m.debt_to_income_ratio <= 36 ? 'good' : m.debt_to_income_ratio <= 43 ? 'warning' : 'error'
            : undefined
        }
      />
      <MetricCard
        label="Months of Reserves"
        value={m.months_of_reserves.toFixed(1)}
        icon="🛡️"
        status={m.months_of_reserves >= 3 ? 'good' : m.months_of_reserves >= 1.5 ? 'warning' : 'error'}
      />
      {m.down_payment_source === 'gift' && (
        <MetricCard
          label="Gift Documentation"
          value={
            m.gift_properly_documented === true ? 'Complete' :
            m.gift_properly_documented === false ? 'Incomplete' :
            'Unknown'
          }
          icon={m.gift_properly_documented === true ? '✅' : '❌'}
          status={m.gift_properly_documented === true ? 'good' : 'error'}
        />
      )}
      {m.gift_amount !== null && m.gift_amount > 0 && (
        <MetricCard
          label="Gift Amount"
          value={formatCurrency(m.gift_amount)}
          icon="🎁"
        />
      )}
      {m.large_deposits_flagged.length > 0 && (
        <div className="col-span-full">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-orange-900 mb-2">
              Large Deposits Flagged ({m.large_deposits_flagged.length})
            </h5>
            <ul className="space-y-1">
              {m.large_deposits_flagged.map((deposit, index) => (
                <li key={index} className="text-sm text-orange-800 flex items-center">
                  <span className="mr-2">•</span>
                  {deposit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {m.undisclosed_liabilities_suspected && (
        <div className="col-span-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900 font-semibold">
              ⚠️ Potential undisclosed liabilities detected - requires verification
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-semibold text-gray-900 mb-4">Key Metrics</h4>
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
