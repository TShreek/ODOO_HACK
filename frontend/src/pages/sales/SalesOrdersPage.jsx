import React, { useState, useEffect } from 'react'
import { Search, Plus, Filter, MoreVertical, Eye, Edit, Trash2, Calendar, User, Package, DollarSign } from 'lucide-react'
import { formatMoney, formatDate } from '../../lib/api'
import SalesOrderForm from './SalesOrderForm'

const SalesOrdersPage = () => {
  const [salesOrders, setSalesOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'detail'
  const [loading, setLoading] = useState(true)

  // Mock data - replace with API calls
  const mockSalesOrders = [
    {
      id: 1,
      so_number: 'SO-202509-001',
      customer_id: 1,
      customer_name: 'Tech Solutions Ltd',
      customer_gst: '29ABCDE1234F1Z5',
      order_date: '2025-09-20',
      delivery_date: '2025-09-25',
      status: 'confirmed',
      total_amount: 145500.00,
      items_count: 3,
      reference: 'REF-001',
      notes: 'Urgent delivery required',
      created_at: '2025-09-20T10:30:00Z',
      items: [
        { id: 1, product_name: 'Laptops', quantity: 10, unit_price: 12000, total: 141600 },
        { id: 2, product_name: 'Mouse Sets', quantity: 10, unit_price: 300, total: 3540 },
        { id: 3, product_name: 'Keyboards', quantity: 5, unit_price: 800, total: 4720 }
      ]
    },
    {
      id: 2,
      so_number: 'SO-202509-002',
      customer_id: 2,
      customer_name: 'Global Manufacturing',
      customer_gst: '27FGHIJ5678K2L6',
      order_date: '2025-09-19',
      delivery_date: '2025-09-30',
      status: 'draft',
      total_amount: 87600.00,
      items_count: 2,
      reference: 'GM-PO-2025-001',
      notes: 'Standard delivery',
      created_at: '2025-09-19T14:15:00Z',
      items: [
        { id: 1, product_name: 'Office Chairs', quantity: 20, unit_price: 3500, total: 82600 },
        { id: 2, product_name: 'Desk Lamps', quantity: 10, unit_price: 500, total: 5900 }
      ]
    },
    {
      id: 3,
      so_number: 'SO-202509-003',
      customer_id: 3,
      customer_name: 'Retail Chain Pvt Ltd',
      customer_gst: '19MNOPQ9012R3S4',
      order_date: '2025-09-18',
      delivery_date: '2025-09-22',
      status: 'delivered',
      total_amount: 234800.00,
      items_count: 5,
      reference: 'RC-ORDER-150',
      notes: 'Delivered successfully',
      created_at: '2025-09-18T09:45:00Z',
      items: [
        { id: 1, product_name: 'Display Units', quantity: 8, unit_price: 25000, total: 236000 }
      ]
    }
  ]

  useEffect(() => {
    // Simulate API call
    const loadSalesOrders = async () => {
      setLoading(true)
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))
      setSalesOrders(mockSalesOrders)
      setFilteredOrders(mockSalesOrders)
      setLoading(false)
    }

    loadSalesOrders()
  }, [])

  useEffect(() => {
    let filtered = salesOrders

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.so_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }, [searchTerm, statusFilter, salesOrders])

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const handleCreateOrder = () => {
    setSelectedOrder(null)
    setIsFormOpen(true)
  }

  const handleEditOrder = (order) => {
    setSelectedOrder(order)
    setIsFormOpen(true)
  }

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setViewMode('detail')
  }

  const handleDeleteOrder = (orderId) => {
    if (window.confirm('Are you sure you want to delete this sales order?')) {
      setSalesOrders(prev => prev.filter(order => order.id !== orderId))
    }
  }

  const handleFormSuccess = (orderData) => {
    if (selectedOrder) {
      // Update existing order
      setSalesOrders(prev => prev.map(order => 
        order.id === selectedOrder.id ? { ...order, ...orderData } : order
      ))
    } else {
      // Add new order
      const newOrder = { 
        ...orderData, 
        id: Date.now(),
        customer_name: 'Selected Customer', // This would come from API
        customer_gst: 'GST123456789'
      }
      setSalesOrders(prev => [newOrder, ...prev])
    }
    setIsFormOpen(false)
    setSelectedOrder(null)
  }

  if (viewMode === 'detail' && selectedOrder) {
    return (
      <div className="space-y-6">
        {/* Detail View Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setViewMode('list')}
              className="text-primary-600 hover:text-primary-900"
            >
              ← Back to Sales Orders
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedOrder.so_number}</h1>
              <p className="text-gray-600">{selectedOrder.customer_name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(selectedOrder.status)}
            <button 
              onClick={() => handleEditOrder(selectedOrder)}
              className="btn-secondary"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-medium">{formatDate(selectedOrder.order_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Delivery Date</p>
                  <p className="font-medium">{formatDate(selectedOrder.delivery_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Reference</p>
                  <p className="font-medium">{selectedOrder.reference || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
              </div>
              {selectedOrder.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="font-medium">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
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
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedOrder.items.map((item) => (
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

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Customer Name</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">GST Number</p>
                  <p className="font-medium">{selectedOrder.customer_gst}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items</span>
                  <span className="font-medium">{selectedOrder.items_count}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-primary-600 pt-3 border-t">
                  <span>Total Amount</span>
                  <span>{formatMoney(selectedOrder.total_amount)}</span>
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
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-gray-600">Manage customer sales orders and deliveries</p>
        </div>
        <button onClick={handleCreateOrder} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Sales Order
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-xl font-semibold text-gray-900">{salesOrders.length}</p>
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
                {formatMoney(salesOrders.reduce((sum, order) => sum + order.total_amount, 0))}
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
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-xl font-semibold text-gray-900">
                {salesOrders.filter(order => order.status === 'draft' || order.status === 'confirmed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-xl font-semibold text-gray-900">
                {salesOrders.filter(order => order.status === 'delivered').length}
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
                placeholder="Search orders..."
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
              <option value="confirmed">Confirmed</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="btn-secondary">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
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
                    Order Details
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.so_number}</div>
                        <div className="text-sm text-gray-500">{order.items_count} items</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                        <div className="text-sm text-gray-500">{order.customer_gst}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.order_date)}</div>
                      <div className="text-sm text-gray-500">Due: {formatDate(order.delivery_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatMoney(order.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-gray-600 hover:text-gray-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit Order"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-error-600 hover:text-error-900"
                          title="Delete Order"
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

        {!loading && filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sales orders</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new sales order.</p>
            <div className="mt-6">
              <button onClick={handleCreateOrder} className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Sales Order
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sales Order Form Modal */}
      {isFormOpen && (
        <SalesOrderForm
          order={selectedOrder}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}

export default SalesOrdersPage