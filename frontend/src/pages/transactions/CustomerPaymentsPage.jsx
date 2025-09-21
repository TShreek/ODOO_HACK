import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from 'react-query'
import { CreditCard, Calendar, FileText, DollarSign } from 'lucide-react'
import { api, formatMoney } from '../../lib/api'

const CustomerPaymentsPage = () => {
  const [transactions, setTransactions] = useState([])
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      amount: '',
      method: 'bank',
      note: '',
      date: new Date().toISOString().split('T')[0]
    }
  })

  const createPaymentMutation = useMutation(
    (data) => api.transactions.customerPayment(data),
    {
      onSuccess: (response) => {
        // Add to local state for immediate feedback
        const newTransaction = {
          id: Date.now(),
          ...response,
          created_at: new Date().toISOString()
        }
        setTransactions(prev => [newTransaction, ...prev])
        reset()
        alert('Customer payment recorded successfully!')
      },
      onError: (error) => {
        alert('Failed to record payment: ' + error.message)
      }
    }
  )

  const onSubmit = async (data) => {
    try {
      await createPaymentMutation.mutateAsync({
        amount: parseFloat(data.amount),
        method: data.method,
        note: data.note,
        date: data.date
      })
    } catch (error) {
      console.error('Payment submission error:', error)
    }
  }

  const paymentMethods = [
    { value: 'bank', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'card', label: 'Card' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Payments</h1>
        <p className="text-gray-600">Record payments received from customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Form */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Record New Payment</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('amount', { 
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' }
                  })}
                  type="number"
                  step="0.01"
                  className={`input pl-10 ${errors.amount ? 'border-error-500' : ''}`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-error-600">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  {...register('method', { required: 'Payment method is required' })}
                  className={`input pl-10 ${errors.method ? 'border-error-500' : ''}`}
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.method && (
                <p className="mt-1 text-sm text-error-600">{errors.method.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('date', { required: 'Date is required' })}
                  type="date"
                  className={`input pl-10 ${errors.date ? 'border-error-500' : ''}`}
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-sm text-error-600">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  {...register('note')}
                  className="input pl-10 min-h-[80px] resize-none"
                  placeholder="Add any notes about this payment..."
                  rows={3}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createPaymentMutation.isLoading}
              className="btn-primary w-full"
            >
              {createPaymentMutation.isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Recording Payment...
                </div>
              ) : (
                'Record Payment'
              )}
            </button>
          </form>
        </div>

        {/* Recent Payments */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h2>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payments recorded yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Payments you record will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-success-600">
                      {formatMoney(transaction.amount)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CreditCard className="h-3 w-3 mr-1" />
                    <span className="capitalize">{transaction.method}</span>
                  </div>
                  {transaction.note && (
                    <p className="text-sm text-gray-600 mt-2">{transaction.note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="card p-6 bg-primary-50">
        <h3 className="text-lg font-semibold text-primary-900 mb-2">How it works</h3>
        <div className="text-sm text-primary-800 space-y-2">
          <p>• Payments are automatically processed through the accounting system</p>
          <p>• Journal entries are created for proper double-entry bookkeeping</p>
          <p>• Customer accounts receivable balances are updated in real-time</p>
          <p>• All transactions are tracked and can be viewed in reports</p>
        </div>
      </div>
    </div>
  )
}

export default CustomerPaymentsPage