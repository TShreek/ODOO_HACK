import React, { useState, useEffect } from 'react'
import { Search, Plus, Filter, MoreVertical, Eye, Edit, Trash2, Calendar, User, Receipt, DollarSign, FileText } from 'lucide-react'
import { formatMoney, formatDate } from '../../lib/api'
import CustomerInvoiceForm from './CustomerInvoiceForm'

const CustomerInvoicesPage = () => {
  const [invoices, setInvoices] = useState([])
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'detail'
  const [loading, setLoading] = useState(true)

  // Mock data - replace with API calls
  const mockInvoices = [
    {
      id: 1,
      invoice_number: 'INV-202509-001',
      customer_id: 1,
      customer_name: 'Tech Solutions Ltd',
      customer_gst: '29ABCDE1234F1Z5',
      invoice_date: '2025-09-21',
      due_date: '2025-10-21',
      status: 'sent',
      total_amount: 145500.00,
      paid_amount: 0.00,
      balance_amount: 145500.00,
      items_count: 3,
      reference: 'SO-202509-001',
      notes: 'Generated from Sales Order',
      created_at: '2025-09-21T10:30:00Z',
      items: [
        { id: 1, product_name: 'Laptops', quantity: 10, unit_price: 12000, tax_rate: 18, total: 141600 },
        { id: 2, product_name: 'Mouse Sets', quantity: 10, unit_price: 300, tax_rate: 18, total: 3540 },
        { id: 3, product_name: 'Keyboards', quantity: 5, unit_price: 800, tax_rate: 18, total: 4720 }
      ]
    },
    {
      id: 2,
      invoice_number: 'INV-202509-002',
      customer_id: 2,
      customer_name: 'Global Manufacturing',
      customer_gst: '27FGHIJ5678K2L6',
      invoice_date: '2025-09-20',
      due_date: '2025-10-20',
      status: 'paid',
      total_amount: 87600.00,
      paid_amount: 87600.00,
      balance_amount: 0.00,
      items_count: 2,
      reference: 'SO-202509-002',
      notes: 'Payment received in full',
      created_at: '2025-09-20T14:15:00Z',
      items: [
        { id: 1, product_name: 'Office Chairs', quantity: 20, unit_price: 3500, tax_rate: 18, total: 82600 },
        { id: 2, product_name: 'Desk Lamps', quantity: 10, unit_price: 500, tax_rate: 18, total: 5900 }
      ]
    },
    {
      id: 3,
      invoice_number: 'INV-202509-003',
      customer_id: 3,
      customer_name: 'Retail Chain Pvt Ltd',
      customer_gst: '19MNOPQ9012R3S4',
      invoice_date: '2025-09-19',
      due_date: '2025-10-19',
      status: 'overdue',
      total_amount: 234800.00,
      paid_amount: 100000.00,
      balance_amount: 134800.00,
      items_count: 1,
      reference: 'RC-ORDER-150',
      notes: 'Partial payment received',
      created_at: '2025-09-19T09:45:00Z',
      items: [
        { id: 1, product_name: 'Display Units', quantity: 8, unit_price: 25000, tax_rate: 18, total: 236000 }
      ]
    }
  ]

  useEffect(() => {
    // Simulate API call
    const loadInvoices = async () => {
      setLoading(true)
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))
      setInvoices(mockInvoices)
      setFilteredInvoices(mockInvoices)
      setLoading(false)
    }

    loadInvoices()
  }, [])

  useEffect(() => {
    let filtered = invoices

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    setFilteredInvoices(filtered)
  }, [searchTerm, statusFilter, invoices])

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const handleCreateInvoice = () => {
    setSelectedInvoice(null)
    setIsFormOpen(true)
  }

  const handleEditInvoice = (invoice) => {
    setSelectedInvoice(invoice)
    setIsFormOpen(true)
  }

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice)
    setViewMode('detail')
  }

  const handleDeleteInvoice = (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId))
    }
  }

  const handleFormSuccess = (invoiceData) => {
    if (selectedInvoice) {
      // Update existing invoice
      setInvoices(prev => prev.map(invoice => 
        invoice.id === selectedInvoice.id ? { ...invoice, ...invoiceData } : invoice
      ))
    } else {
      // Add new invoice
      const newInvoice = { 
        ...invoiceData, 
        id: Date.now(),
        customer_name: 'Selected Customer', // This would come from API
        customer_gst: 'GST123456789'
      }
      setInvoices(prev => [newInvoice, ...prev])
    }
    setIsFormOpen(false)
    setSelectedInvoice(null)
  }

  if (viewMode === 'detail' && selectedInvoice) {
    return (
      <div className="space-y-6">
        {/* Detail View Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setViewMode('list')}
              className="text-primary-600 hover:text-primary-900"
            >
              ← Back to Invoices
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedInvoice.invoice_number}</h1>
              <p className="text-gray-600">{selectedInvoice.customer_name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(selectedInvoice.status)}
            <button 
              onClick={() => handleEditInvoice(selectedInvoice)}
              className="btn-secondary"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button className="btn-primary">
              <FileText className="h-4 w-4 mr-2" />
              Generate PDF
            </button>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Information */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Invoice Date</p>
                  <p className="font-medium">{formatDate(selectedInvoice.invoice_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="font-medium">{formatDate(selectedInvoice.due_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reference</p>
                  <p className="font-medium">{selectedInvoice.reference || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                </div>
              </div>
              {selectedInvoice.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="font-medium">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>

            {/* Invoice Items */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tax %
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedInvoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatMoney(item.unit_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.tax_rate}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatMoney(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Customer Name</p>
                  <p className="font-medium">{selectedInvoice.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">GST Number</p>
                  <p className="font-medium">{selectedInvoice.customer_gst}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-medium">{formatMoney(selectedInvoice.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid Amount</span>
                  <span className="font-medium text-green-600">{formatMoney(selectedInvoice.paid_amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-primary-600 pt-3 border-t">
                  <span>Balance Due</span>
                  <span>{formatMoney(selectedInvoice.balance_amount)}</span>
                </div>
              </div>
              
              {selectedInvoice.balance_amount > 0 && (
                <div className="mt-4">
                  <button className="btn-primary w-full">
                    <Receipt className="h-4 w-4 mr-2" />
                    Record Payment
                  </button>
                </div>
              )}
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
          <h1 className="text-2xl font-bold text-gray-900">Customer Invoices</h1>
          <p className="text-gray-600">Manage customer invoices and payments</p>
        </div>
        <button onClick={handleCreateInvoice} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-xl font-semibold text-gray-900">{invoices.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatMoney(invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0))}
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
              <p className="text-sm font-medium text-gray-600">Outstanding</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatMoney(invoices.reduce((sum, invoice) => sum + invoice.balance_amount, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Receipt className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-xl font-semibold text-gray-900">
                {invoices.filter(invoice => invoice.status === 'overdue').length}
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
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              className="input min-w-[140px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="btn-secondary">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
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
                    Invoice Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{invoice.invoice_number}</div>
                        <div className="text-sm text-gray-500">{invoice.items_count} items</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{invoice.customer_name}</div>
                        <div className="text-sm text-gray-500">{invoice.customer_gst}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(invoice.invoice_date)}</div>
                      <div className="text-sm text-gray-500">Due: {formatDate(invoice.due_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatMoney(invoice.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatMoney(invoice.balance_amount)}
                      </div>
                      {invoice.balance_amount > 0 && (
                        <div className="text-xs text-red-600">Outstanding</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="text-gray-600 hover:text-gray-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditInvoice(invoice)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit Invoice"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="text-error-600 hover:text-error-900"
                          title="Delete Invoice"
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

        {!loading && filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new invoice.</p>
            <div className="mt-6">
              <button onClick={handleCreateInvoice} className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Invoice Form Modal */}
      {isFormOpen && (
        <CustomerInvoiceForm
          invoice={selectedInvoice}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}

export default CustomerInvoicesPage