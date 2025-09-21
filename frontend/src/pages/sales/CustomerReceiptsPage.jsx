import React, { useState, useEffect } from 'react'
import { Search, Plus, Filter, MoreVertical, Eye, Edit, Trash2, Calendar, User, Receipt, DollarSign, CreditCard } from 'lucide-react'
import { formatMoney, formatDate } from '../../lib/api'
import CustomerReceiptForm from './CustomerReceiptForm'

const CustomerReceiptsPage = () => {
  const [receipts, setReceipts] = useState([])
  const [filteredReceipts, setFilteredReceipts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'detail'
  const [loading, setLoading] = useState(true)

  // Mock data - replace with API calls
  const mockReceipts = [
    {
      id: 1,
      receipt_number: 'REC-202509-001',
      customer_id: 1,
      customer_name: 'Tech Solutions Ltd',
      customer_gst: '29ABCDE1234F1Z5',
      receipt_date: '2025-09-21',
      amount: 145500.00,
      payment_method: 'bank_transfer',
      reference_number: 'TXN123456789',
      status: 'completed',
      invoice_references: ['INV-202509-001'],
      notes: 'Payment for Invoice INV-202509-001',
      created_at: '2025-09-21T11:30:00Z'
    },
    {
      id: 2,
      receipt_number: 'REC-202509-002',
      customer_id: 2,
      customer_name: 'Global Manufacturing',
      customer_gst: '27FGHIJ5678K2L6',
      receipt_date: '2025-09-20',
      amount: 87600.00,
      payment_method: 'cheque',
      reference_number: 'CHQ-987654',
      status: 'completed',
      invoice_references: ['INV-202509-002'],
      notes: 'Cheque payment received',
      created_at: '2025-09-20T15:45:00Z'
    },
    {
      id: 3,
      receipt_number: 'REC-202509-003',
      customer_id: 3,
      customer_name: 'Retail Chain Pvt Ltd',
      customer_gst: '19MNOPQ9012R3S4',
      receipt_date: '2025-09-19',
      amount: 100000.00,
      payment_method: 'cash',
      reference_number: 'CASH-001',
      status: 'completed',
      invoice_references: ['INV-202509-003'],
      notes: 'Partial payment - cash received',
      created_at: '2025-09-19T16:20:00Z'
    },
    {
      id: 4,
      receipt_number: 'REC-202509-004',
      customer_id: 1,
      customer_name: 'Tech Solutions Ltd',
      customer_gst: '29ABCDE1234F1Z5',
      receipt_date: '2025-09-18',
      amount: 25000.00,
      payment_method: 'upi',
      reference_number: 'UPI-TX-123456',
      status: 'pending',
      invoice_references: [],
      notes: 'Advance payment',
      created_at: '2025-09-18T12:10:00Z'
    }
  ]

  useEffect(() => {
    // Simulate API call
    const loadReceipts = async () => {
      setLoading(true)
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))
      setReceipts(mockReceipts)
      setFilteredReceipts(mockReceipts)
      setLoading(false)
    }

    loadReceipts()
  }, [])

  useEffect(() => {
    let filtered = receipts

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(receipt =>
        receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(receipt => receipt.status === statusFilter)
    }

    // Apply payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(receipt => receipt.payment_method === paymentMethodFilter)
    }

    setFilteredReceipts(filtered)
  }, [searchTerm, statusFilter, paymentMethodFilter, receipts])

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getPaymentMethodBadge = (method) => {
    const labels = {
      cash: 'Cash',
      cheque: 'Cheque',
      bank_transfer: 'Bank Transfer',
      card: 'Credit/Debit Card',
      upi: 'UPI',
      neft: 'NEFT',
      rtgs: 'RTGS'
    }

    const variants = {
      cash: 'bg-green-100 text-green-800',
      cheque: 'bg-blue-100 text-blue-800',
      bank_transfer: 'bg-purple-100 text-purple-800',
      card: 'bg-indigo-100 text-indigo-800',
      upi: 'bg-orange-100 text-orange-800',
      neft: 'bg-cyan-100 text-cyan-800',
      rtgs: 'bg-pink-100 text-pink-800'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[method]}`}>
        {labels[method] || method}
      </span>
    )
  }

  const handleCreateReceipt = () => {
    setSelectedReceipt(null)
    setIsFormOpen(true)
  }

  const handleEditReceipt = (receipt) => {
    setSelectedReceipt(receipt)
    setIsFormOpen(true)
  }

  const handleViewReceipt = (receipt) => {
    setSelectedReceipt(receipt)
    setViewMode('detail')
  }

  const handleDeleteReceipt = (receiptId) => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      setReceipts(prev => prev.filter(receipt => receipt.id !== receiptId))
    }
  }

  const handleFormSuccess = (receiptData) => {
    if (selectedReceipt) {
      // Update existing receipt
      setReceipts(prev => prev.map(receipt => 
        receipt.id === selectedReceipt.id ? { ...receipt, ...receiptData } : receipt
      ))
    } else {
      // Add new receipt
      const newReceipt = { 
        ...receiptData, 
        id: Date.now(),
        customer_name: 'Selected Customer', // This would come from API
        customer_gst: 'GST123456789'
      }
      setReceipts(prev => [newReceipt, ...prev])
    }
    setIsFormOpen(false)
    setSelectedReceipt(null)
  }

  if (viewMode === 'detail' && selectedReceipt) {
    return (
      <div className="space-y-6">
        {/* Detail View Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setViewMode('list')}
              className="text-primary-600 hover:text-primary-900"
            >
              ← Back to Receipts
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedReceipt.receipt_number}</h1>
              <p className="text-gray-600">{selectedReceipt.customer_name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(selectedReceipt.status)}
            {getPaymentMethodBadge(selectedReceipt.payment_method)}
            <button 
              onClick={() => handleEditReceipt(selectedReceipt)}
              className="btn-secondary"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
          </div>
        </div>

        {/* Receipt Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Payment Information */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Receipt Date</p>
                  <p className="font-medium">{formatDate(selectedReceipt.receipt_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium text-lg text-green-600">{formatMoney(selectedReceipt.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <div className="mt-1">{getPaymentMethodBadge(selectedReceipt.payment_method)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reference Number</p>
                  <p className="font-medium">{selectedReceipt.reference_number}</p>
                </div>
              </div>
              {selectedReceipt.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="font-medium">{selectedReceipt.notes}</p>
                </div>
              )}
            </div>

            {/* Invoice References */}
            {selectedReceipt.invoice_references && selectedReceipt.invoice_references.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Applied to Invoices</h3>
                <div className="space-y-2">
                  {selectedReceipt.invoice_references.map((invoiceRef, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm font-medium text-gray-900">{invoiceRef}</span>
                      <span className="text-sm text-primary-600 cursor-pointer hover:text-primary-900">
                        View Invoice →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Customer Details */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Customer Name</p>
                  <p className="font-medium">{selectedReceipt.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">GST Number</p>
                  <p className="font-medium">{selectedReceipt.customer_gst}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedReceipt.status)}</div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Receipt Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-lg font-semibold text-green-600 pt-3 border-t">
                  <span>Total Received</span>
                  <span>{formatMoney(selectedReceipt.amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Receipts</h1>
          <p className="text-gray-600">Track customer payments and receipts</p>
        </div>
        <button onClick={handleCreateReceipt} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Receipt
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Receipts</p>
              <p className="text-xl font-semibold text-gray-900">{receipts.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Received</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatMoney(receipts.reduce((sum, receipt) => sum + receipt.amount, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatMoney(receipts.filter(r => r.receipt_date.startsWith('2025-09')).reduce((sum, receipt) => sum + receipt.amount, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-xl font-semibold text-gray-900">
                {receipts.filter(receipt => receipt.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="input pl-10"
                placeholder="Search receipts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              className="input min-w-[120px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="input min-w-[140px]"
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="neft">NEFT</option>
              <option value="rtgs">RTGS</option>
            </select>
            <button className="btn-secondary">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{receipt.receipt_number}</div>
                        <div className="text-sm text-gray-500">{receipt.reference_number}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{receipt.customer_name}</div>
                        <div className="text-sm text-gray-500">{receipt.customer_gst}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(receipt.receipt_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentMethodBadge(receipt.payment_method)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(receipt.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatMoney(receipt.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewReceipt(receipt)}
                          className="text-gray-600 hover:text-gray-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditReceipt(receipt)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit Receipt"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReceipt(receipt.id)}
                          className="text-error-600 hover:text-error-900"
                          title="Delete Receipt"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredReceipts.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No receipts found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by recording a customer payment.</p>
            <div className="mt-6">
              <button onClick={handleCreateReceipt} className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Receipt
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Receipt Form Modal */}
      {isFormOpen && (
        <CustomerReceiptForm
          receipt={selectedReceipt}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}

export default CustomerReceiptsPage