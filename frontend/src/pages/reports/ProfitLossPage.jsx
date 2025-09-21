import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { Calendar, Download, Filter } from 'lucide-react'
import apiService from '../../services/apiClient'

// Helper function to format money
const formatMoney = (amount) => {
  if (amount == null) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount)
}

const ProfitLossPage = () => {
  const [dateRange, setDateRange] = useState({
    from_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0]
  })

  const { data: reportData, isLoading, error } = useQuery(
    ['profit-loss', dateRange],
    () => apiService.reports.profitLoss(dateRange),
    {
      enabled: !!dateRange.from_date && !!dateRange.to_date
    }
  )

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleExport = () => {
    // In a real app, you would implement CSV/PDF export
    alert('Export functionality would be implemented here')
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-error-600">Failed to load report</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-2"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profit & Loss</h1>
          <p className="text-gray-600">View your income and expenses</p>
        </div>
        <button
          onClick={handleExport}
          className="btn-secondary"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.from_date}
              onChange={(e) => handleDateChange('from_date', e.target.value)}
              className="input text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.to_date}
              onChange={(e) => handleDateChange('to_date', e.target.value)}
              className="input text-sm"
            />
          </div>
        </div>
      </div>

      {/* Report */}
      <div className="card">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading report...</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Profit & Loss Statement</h2>
              <p className="text-gray-600">
                For the period from {new Date(dateRange.from_date).toLocaleDateString()} to {new Date(dateRange.to_date).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-6">
              {/* Income Section */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Income</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Revenue</span>
                    <span className="font-medium text-success-600">
                      {formatMoney(reportData?.total_income || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100 font-semibold">
                  <span>Total Income</span>
                  <span className="text-success-600">
                    {formatMoney(reportData?.total_income || 0)}
                  </span>
                </div>
              </div>

              {/* Expenses Section */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Expenses</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Operating Expenses</span>
                    <span className="font-medium text-error-600">
                      {formatMoney(reportData?.total_expense || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100 font-semibold">
                  <span>Total Expenses</span>
                  <span className="text-error-600">
                    {formatMoney(reportData?.total_expense || 0)}
                  </span>
                </div>
              </div>

              {/* Net Profit Section */}
              <div className="bg-primary-50 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Net Profit</span>
                  <span className={`text-2xl font-bold ${
                    (reportData?.net_profit || 0) >= 0 ? 'text-success-600' : 'text-error-600'
                  }`}>
                    {formatMoney(reportData?.net_profit || 0)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {(reportData?.net_profit || 0) >= 0 ? 'Profit' : 'Loss'} for the selected period
                </p>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-xl font-bold text-success-600">
                  {formatMoney(reportData?.total_income || 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-xl font-bold text-error-600">
                  {formatMoney(reportData?.total_expense || 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className={`text-xl font-bold ${
                  (reportData?.total_income || 0) > 0 
                    ? ((reportData?.net_profit || 0) / (reportData?.total_income || 1)) >= 0 
                      ? 'text-success-600' 
                      : 'text-error-600'
                    : 'text-gray-600'
                }`}>
                  {(reportData?.total_income || 0) > 0 
                    ? `${(((reportData?.net_profit || 0) / (reportData?.total_income || 1)) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfitLossPage