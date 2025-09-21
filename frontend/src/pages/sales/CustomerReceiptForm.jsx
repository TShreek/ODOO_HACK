import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, User, Calendar, CreditCard, FileText, DollarSign } from 'lucide-react'
import { formatMoney } from '../../lib/api'

const CustomerReceiptForm = ({ receipt, onClose, onSuccess }) => {
  const isEditing = !!receipt
  const [customers] = useState([
    { id: 1, name: 'Tech Solutions Ltd', gst: '29ABCDE1234F1Z5', email: 'contact@techsolutions.com' },
    { id: 2, name: 'Global Manufacturing', gst: '27FGHIJ5678K2L6', email: 'orders@globalmanuf.com' },
    { id: 3, name: 'Retail Chain Pvt Ltd', gst: '19MNOPQ9012R3S4', email: 'procurement@retailchain.com' },
    { id: 4, name: 'StartUp Innovations', gst: '33UVWXY7890Z1A2', email: 'hello@startupinnov.com' },
  ])

  const [invoices] = useState([
    { id: 1, invoice_number: 'INV-202509-001', customer_id: 1, balance_amount: 145500 },
    { id: 2, invoice_number: 'INV-202509-002', customer_id: 2, balance_amount: 0 },
    { id: 3, invoice_number: 'INV-202509-003', customer_id: 3, balance_amount: 134800 },
    { id: 4, invoice_number: 'INV-202509-004', customer_id: 1, balance_amount: 25000 },
  ])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: receipt || {
      customer_id: '',
      receipt_date: new Date().toISOString().split('T')[0],
      amount: '',
      payment_method: 'bank_transfer',
      reference_number: '',
      invoice_id: '',
      notes: ''
    }
  })

  const watchCustomerId = watch('customer_id')
  const watchAmount = watch('amount')

  // Auto-generate Receipt number
  const generateReceiptNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `REC-${year}${month}-${random}`
  }

  // Filter invoices by selected customer
  const filteredInvoices = invoices.filter(invoice => 
    !watchCustomerId || invoice.customer_id === parseInt(watchCustomerId)
  ).filter(invoice => invoice.balance_amount > 0) // Only show invoices with outstanding balance

  const handleInvoiceSelect = (invoiceId) => {
    const invoice = invoices.find(inv => inv.id === parseInt(invoiceId))
    if (invoice && invoice.balance_amount > 0) {
      setValue('amount', invoice.balance_amount)
    }
  }

  const onSubmit = (data) => {
    const receiptData = {
      ...data,
      receipt_number: isEditing ? receipt.receipt_number : generateReceiptNumber(),
      status: 'completed',
      amount: parseFloat(data.amount),
      invoice_references: data.invoice_id ? [invoices.find(inv => inv.id === parseInt(data.invoice_id))?.invoice_number] : [],
      created_at: new Date().toISOString()
    }
    
    onSuccess(receiptData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Customer Receipt' : 'New Customer Receipt'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Receipt Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receipt Number
            </label>
            <input
              type="text"
              value={isEditing ? receipt.receipt_number : 'Auto Generated'}
              disabled
              className="input bg-gray-50"
            />
          </div>

          {/* Customer and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  {...register('customer_id', { required: 'Customer is required' })}
                  className={`input pl-10 ${errors.customer_id ? 'border-error-500' : ''}`}
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.gst})
                    </option>
                  ))}
                </select>
              </div>
              {errors.customer_id && (
                <p className="mt-1 text-sm text-error-600">{errors.customer_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('receipt_date', { required: 'Receipt date is required' })}
                  type="date"
                  className={`input pl-10 ${errors.receipt_date ? 'border-error-500' : ''}`}
                />
              </div>
              {errors.receipt_date && (
                <p className="mt-1 text-sm text-error-600">{errors.receipt_date.message}</p>
              )}
            </div>
          </div>

          {/* Amount and Payment Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
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
              {watchAmount && (
                <p className="mt-1 text-sm text-gray-600">
                  Amount: {formatMoney(parseFloat(watchAmount) || 0)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  {...register('payment_method', { required: 'Payment method is required' })}
                  className={`input pl-10 ${errors.payment_method ? 'border-error-500' : ''}`}
                >
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="upi">UPI</option>
                  <option value="neft">NEFT</option>
                  <option value="rtgs">RTGS</option>
                </select>
              </div>
              {errors.payment_method && (
                <p className="mt-1 text-sm text-error-600">{errors.payment_method.message}</p>
              )}
            </div>
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number
            </label>
            <input
              {...register('reference_number')}
              className="input"
              placeholder="Transaction ID, Cheque number, etc."
            />
          </div>

          {/* Invoice Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apply to Invoice (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                {...register('invoice_id')}
                onChange={(e) => handleInvoiceSelect(e.target.value)}
                className="input pl-10"
              >
                <option value="">Select Invoice (Optional)</option>
                {filteredInvoices.map(invoice => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number} - Outstanding: {formatMoney(invoice.balance_amount)}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {filteredInvoices.length === 0 && watchCustomerId
                ? "No outstanding invoices for this customer"
                : "Select an invoice to auto-fill the amount with outstanding balance"
              }
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              {...register('notes')}
              className="input min-h-[80px] resize-none"
              placeholder="Additional notes for this receipt..."
              rows={3}
            />
          </div>

          {/* Summary */}
          {watchAmount && (
            <div className="bg-green-50 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Receipt Amount</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatMoney(parseFloat(watchAmount) || 0)}
                </span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? 'Update Receipt' : 'Record Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CustomerReceiptForm