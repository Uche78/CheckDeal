interface StructuredDataViewProps {
  data: any;
}

export default function StructuredDataView({ data }: StructuredDataViewProps) {
  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        No structured data available
      </div>
    );
  }

  // Bank Statement View
  if (data.account_holder || data.closing_balance !== undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Statement Summary</h3>
          
          {/* Account Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {data.account_holder && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Account Holder:</span>
                <span className="text-sm text-gray-900 font-semibold">{data.account_holder}</span>
              </div>
            )}
            {data.account_number && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Account Number:</span>
                <span className="text-sm text-gray-900">****{data.account_number}</span>
              </div>
            )}
            {data.statement_period && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Statement Period:</span>
                <span className="text-sm text-gray-900">
                  {data.statement_period.start_date} to {data.statement_period.end_date}
                </span>
              </div>
            )}
          </div>

          {/* Balances */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {data.opening_balance !== null && data.opening_balance !== undefined && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-blue-600 font-medium uppercase mb-1">Opening Balance</p>
                <p className="text-2xl font-bold text-blue-900">
                  ${data.opening_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
            {data.closing_balance !== null && data.closing_balance !== undefined && (
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-green-600 font-medium uppercase mb-1">Closing Balance</p>
                <p className="text-2xl font-bold text-green-900">
                  ${data.closing_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {data.total_deposits !== null && data.total_deposits !== undefined && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 font-medium uppercase mb-1">Total Deposits</p>
                <p className="text-xl font-semibold text-gray-900">
                  ${data.total_deposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
            {data.total_withdrawals !== null && data.total_withdrawals !== undefined && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 font-medium uppercase mb-1">Total Withdrawals</p>
                <p className="text-xl font-semibold text-gray-900">
                  ${data.total_withdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Large Transactions */}
        {data.large_transactions && data.large_transactions.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Large Transactions (over $500)
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.large_transactions.map((txn: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{txn.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{txn.description}</td>
                      <td className={`px-4 py-3 text-sm font-semibold text-right ${
                        txn.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {txn.type === 'credit' ? '+' : '-'}${Math.abs(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          txn.type === 'credit' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {txn.type === 'credit' ? 'Deposit' : 'Withdrawal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Pay Stub View
  if (data.employee_name || data.gross_income !== undefined) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pay Stub Summary</h3>
        
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          {data.employee_name && (
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Employee:</span>
              <span className="text-sm text-gray-900 font-semibold">{data.employee_name}</span>
            </div>
          )}
          {data.employer && (
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Employer:</span>
              <span className="text-sm text-gray-900">{data.employer}</span>
            </div>
          )}
          {data.pay_period && (
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Pay Period:</span>
              <span className="text-sm text-gray-900">
                {data.pay_period.start_date} to {data.pay_period.end_date}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {data.gross_income !== null && data.gross_income !== undefined && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-blue-600 font-medium uppercase mb-1">Gross Income</p>
              <p className="text-xl font-bold text-blue-900">
                ${data.gross_income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
          {data.net_income !== null && data.net_income !== undefined && (
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs text-green-600 font-medium uppercase mb-1">Net Income</p>
              <p className="text-xl font-bold text-green-900">
                ${data.net_income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
          {data.year_to_date_income !== null && data.year_to_date_income !== undefined && (
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-xs text-purple-600 font-medium uppercase mb-1">YTD Income</p>
              <p className="text-xl font-bold text-purple-900">
                ${data.year_to_date_income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Generic JSON View
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
