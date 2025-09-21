import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Search, Edit, Trash2, Eye, Calendar, User, Package } from 'lucide-react'
import { api, formatMoney } from '../../lib/api'
import PurchaseOrderForm from './PurchaseOrderForm'

const PurchaseOrdersPage = ({ mode }) => {
  const params = useParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [viewingOrder, setViewingOrder] = useState(null)
  const queryClient = useQueryClient()

  // Mock data for purchase orders
  const [orders, setOrders] = useState([
    {
      id: 1,
      po_number: 'PO-2025-001',
      vendor_name: 'ABC Suppliers Ltd',
      order_date: '2025-09-20',
      status: 'draft',
      total_amount: 25000,
      items_count: 3,
      created_at: '2025-09-20T10:30:00Z'
    },
    {
      id: 2,
      po_number: 'PO-2025-002',
      vendor_name: 'XYZ Materials',
      order_date: '2025-09-19',
      status: 'confirmed',
      total_amount: 18500,
      items_count: 2,
      created_at: '2025-09-19T14:15:00Z'
    },
    {
      id: 3,
      po_number: 'PO-2025-003',
      vendor_name: 'Quality Parts Inc',
      order_date: '2025-09-18',
      status: 'received',
      total_amount: 42000,
      items_count: 5,
      created_at: '2025-09-18T09:45:00Z'
    }
  ])

  const handleEdit = (order) => {
    setEditingOrder(order)
    setShowForm(true)
  }

  const handleView = (order) => {
    setViewingOrder(order)
  }

  const handleDelete = async (order) => {
    if (window.confirm(`Are you sure you want to delete ${order.po_number}?`)) {
      setOrders(prev => prev.filter(o => o.id !== order.id))
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingOrder(null)
  }

  const handleViewClose = () => {
    setViewingOrder(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'confirmed': return 'bg-primary-50 text-primary-700 border-primary-200'
      case 'received': return 'bg-success-50 text-success-700 border-success-200'
      case 'cancelled': return 'bg-error-50 text-error-700 border-error-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const filteredOrders = orders.filter(order =>
    order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sync route-based modes
  useEffect(() => {
    if (mode === 'create') {
      setShowForm(true)
      setEditingOrder(null)
    } else if (mode === 'edit' && params.id) {
      const existing = orders.find(o => String(o.id) === String(params.id))
      if (existing) {
        setEditingOrder(existing)
        setShowForm(true)
      }
    } else if (mode === 'view' && params.id) {
      const existing = orders.find(o => String(o.id) === String(params.id))
      if (existing) {
        setViewingOrder(existing)
      }
    }
  }, [mode, params.id, orders])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600">Manage purchase orders and track vendor deliveries</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Purchase Order
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by PO number or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex space-x-2">
            <select className="input text-sm">
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="card">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No purchase orders found</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="btn-secondary mt-2"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.po_number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items_count} items
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{order.vendor_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatMoney(order.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {new Date(order.order_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleView(order)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(order)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(order)}
                          className="text-error-600 hover:text-error-900"
                          title="Delete"
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
      </div>

      {/* Purchase Order Form Modal */}
      {showForm && (
        <PurchaseOrderForm
          order={editingOrder}
          onClose={handleFormClose}
          onSuccess={(newOrder) => {
            if (editingOrder) {
              setOrders(prev => prev.map(o => o.id === editingOrder.id ? { ...o, ...newOrder } : o))
            } else {
              setOrders(prev => [{ ...newOrder, id: Date.now(), po_number: `PO-2025-${String(prev.length + 1).padStart(3, '0')}` }, ...prev])
            }
            handleFormClose()
          }}
        />
      )}

      {/* Purchase Order View Modal */}
      {viewingOrder && (
        <PurchaseOrderView
          order={viewingOrder}
          onClose={handleViewClose}
        />
      )}
    </div>
  )
}

// Purchase Order View Component
const PurchaseOrderView = ({ order, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Purchase Order - {order.po_number}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Order Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">PO Number:</span>
                  <span className="font-medium">{order.po_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">{new Date(order.order_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Vendor Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vendor:</span>
                  <span className="font-medium">{order.vendor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium text-primary-600">{formatMoney(order.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-medium">{order.items_count}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button onClick={onClose} className="btn-secondary">Close</button>
            <button className="btn-primary">Convert to Bill</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PurchaseOrdersPage