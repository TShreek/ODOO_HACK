import React, { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { X, Plus, Trash2, User, Calendar, Package, Calculator, FileText } from 'lucide-react'
import { formatMoney } from '../../lib/api'

const CustomerInvoiceForm = ({ invoice, onClose, onSuccess }) => {
  const isEditing = !!invoice
  const [customers] = useState([
    { id: 1, name: 'Tech Solutions Ltd', gst: '29ABCDE1234F1Z5', email: 'contact@techsolutions.com' },
    { id: 2, name: 'Global Manufacturing', gst: '27FGHIJ5678K2L6', email: 'orders@globalmanuf.com' },
    { id: 3, name: 'Retail Chain Pvt Ltd', gst: '19MNOPQ9012R3S4', email: 'procurement@retailchain.com' },
    { id: 4, name: 'StartUp Innovations', gst: '33UVWXY7890Z1A2', email: 'hello@startupinnov.com' },
  ])

  const [products] = useState([
    { id: 1, name: 'Laptops', hsn_code: '8471', rate: 12000, unit: 'piece' },
    { id: 2, name: 'Office Chairs', hsn_code: '9401', rate: 3500, unit: 'piece' },
    { id: 3, name: 'Display Units', hsn_code: '8528', rate: 25000, unit: 'piece' },
    { id: 4, name: 'Mouse Sets', hsn_code: '8471', rate: 300, unit: 'piece' },
    { id: 5, name: 'Keyboards', hsn_code: '8471', rate: 800, unit: 'piece' },
  ])

  const [salesOrders] = useState([
    { id: 1, so_number: 'SO-202509-001', customer_id: 1, total_amount: 145500 },
    { id: 2, so_number: 'SO-202509-002', customer_id: 2, total_amount: 87600 },
    { id: 3, so_number: 'SO-202509-003', customer_id: 3, total_amount: 234800 },
  ])

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: invoice || {
      customer_id: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      reference: '',
      sales_order_id: '',
      notes: '',
      payment_terms: '30',
      items: [
        {
          product_id: '',
          description: '',
          quantity: 1,
          unit_price: 0,
          tax_rate: 18,
          total: 0
        }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const watchItems = watch('items')
  const watchCustomerId = watch('customer_id')
  const watchedItems = watchItems || []

  // Auto-generate Invoice number
  const generateInvoiceNumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `INV-${year}${month}-${random}`
  }

  // Calculate due date based on payment terms
  const calculateDueDate = (invoiceDate, paymentTerms) => {
    if (!invoiceDate || !paymentTerms) return ''
    
    const date = new Date(invoiceDate)
    date.setDate(date.getDate() + parseInt(paymentTerms))
    return date.toISOString().split('T')[0]
  }

  const calculateItemTotal = (index) => {
    const item = watchedItems[index]
    if (!item) return 0
    
    const quantity = parseFloat(item.quantity) || 0
    const unitPrice = parseFloat(item.unit_price) || 0
    const taxRate = parseFloat(item.tax_rate) || 0
    
    const subtotal = quantity * unitPrice
    const taxAmount = (subtotal * taxRate) / 100
    const total = subtotal + taxAmount
    
    setValue(`items.${index}.total`, total)
    return total
  }

  const calculateOrderTotal = () => {
    return watchedItems.reduce((total, item, index) => {
      return total + calculateItemTotal(index)
    }, 0)
  }

  const calculateSubtotal = () => {
    return watchedItems.reduce((total, item) => {
      const quantity = parseFloat(item.quantity) || 0
      const unitPrice = parseFloat(item.unit_price) || 0
      return total + (quantity * unitPrice)
    }, 0)
  }

  const calculateTotalTax = () => {
    return watchedItems.reduce((total, item) => {
      const quantity = parseFloat(item.quantity) || 0
      const unitPrice = parseFloat(item.unit_price) || 0
      const taxRate = parseFloat(item.tax_rate) || 0
      const subtotal = quantity * unitPrice
      return total + ((subtotal * taxRate) / 100)
    }, 0)
  }

  const handleProductSelect = (index, productId) => {
    const product = products.find(p => p.id === parseInt(productId))
    if (product) {
      setValue(`items.${index}.product_id`, productId)
      setValue(`items.${index}.description`, product.name)
      setValue(`items.${index}.unit_price`, product.rate)
      calculateItemTotal(index)
    }
  }

  // Filter sales orders by selected customer
  const filteredSalesOrders = salesOrders.filter(so => 
    !watchCustomerId || so.customer_id === parseInt(watchCustomerId)
  )

  const onSubmit = (data) => {
    const invoiceData = {
      ...data,
      invoice_number: isEditing ? invoice.invoice_number : generateInvoiceNumber(),
      status: 'draft',
      total_amount: calculateOrderTotal(),
      paid_amount: 0,
      balance_amount: calculateOrderTotal(),
      items_count: data.items.length,
      due_date: calculateDueDate(data.invoice_date, data.payment_terms),
      created_at: new Date().toISOString()
    }
    
    onSuccess(invoiceData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Customer Invoice' : 'New Customer Invoice'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number
              </label>
              <input
                type="text"
                value={isEditing ? invoice.invoice_number : 'Auto Generated'}
                disabled
                className="input bg-gray-50"
              />
            </div>

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
                Invoice Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('invoice_date', { required: 'Invoice date is required' })}
                  type="date"
                  className={`input pl-10 ${errors.invoice_date ? 'border-error-500' : ''}`}
                />
              </div>
              {errors.invoice_date && (
                <p className="mt-1 text-sm text-error-600">{errors.invoice_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms (Days)
              </label>
              <select
                {...register('payment_terms')}
                className="input"
              >
                <option value="0">Due on Receipt</option>
                <option value="15">Net 15</option>
                <option value="30">Net 30</option>
                <option value="45">Net 45</option>
                <option value="60">Net 60</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sales Order Reference
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  {...register('sales_order_id')}
                  className="input pl-10"
                >
                  <option value="">Select Sales Order (Optional)</option>
                  {filteredSalesOrders.map(so => (
                    <option key={so.id} value={so.id}>
                      {so.so_number} - {formatMoney(so.total_amount)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference
              </label>
              <input
                {...register('reference')}
                className="input"
                placeholder="Customer PO or reference"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
              <button
                type="button"
                onClick={() => append({
                  product_id: '',
                  description: '',
                  quantity: 1,
                  unit_price: 0,
                  tax_rate: 18,
                  total: 0
                })}
                className="btn-secondary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-error-600 hover:text-error-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product *
                      </label>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                          {...register(`items.${index}.product_id`, { required: 'Product is required' })}
                          onChange={(e) => handleProductSelect(index, e.target.value)}
                          className="input pl-10"
                        >
                          <option value="">Select Product</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name} - {product.hsn_code}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity *
                      </label>
                      <input
                        {...register(`items.${index}.quantity`, { 
                          required: 'Quantity is required',
                          min: { value: 0.01, message: 'Quantity must be greater than 0' }
                        })}
                        type="number"
                        step="0.01"
                        className="input"
                        onChange={() => calculateItemTotal(index)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Price *
                      </label>
                      <input
                        {...register(`items.${index}.unit_price`, { 
                          required: 'Unit price is required',
                          min: { value: 0, message: 'Price cannot be negative' }
                        })}
                        type="number"
                        step="0.01"
                        className="input"
                        onChange={() => calculateItemTotal(index)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax %
                      </label>
                      <input
                        {...register(`items.${index}.tax_rate`)}
                        type="number"
                        step="0.01"
                        className="input"
                        onChange={() => calculateItemTotal(index)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <div className="text-right">
                      <span className="text-sm text-gray-600">Total: </span>
                      <span className="text-lg font-medium text-primary-600">
                        {formatMoney(calculateItemTotal(index))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Invoice Summary */}
            <div className="mt-6 bg-primary-50 p-6 rounded-xl space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatMoney(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Tax</span>
                <span className="font-medium">{formatMoney(calculateTotalTax())}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-primary-200">
                <span className="text-lg font-semibold text-gray-900">Invoice Total</span>
                <span className="text-2xl font-bold text-primary-600">
                  {formatMoney(calculateOrderTotal())}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              {...register('notes')}
              className="input min-h-[80px] resize-none"
              placeholder="Additional notes for this invoice..."
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CustomerInvoiceForm