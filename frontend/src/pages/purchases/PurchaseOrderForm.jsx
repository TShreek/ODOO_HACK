import React, { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { X, Plus, Trash2, User, Calendar, Package, Calculator } from 'lucide-react'
import { formatMoney } from '../../lib/api'

const PurchaseOrderForm = ({ order, onClose, onSuccess }) => {
  const isEditing = !!order
  const [vendors] = useState([
    { id: 1, name: 'ABC Suppliers Ltd', gst: '29ABCDE1234F1Z5' },
    { id: 2, name: 'XYZ Materials', gst: '27FGHIJ5678K2L6' },
    { id: 3, name: 'Quality Parts Inc', gst: '19MNOPQ9012R3S4' },
  ])

  const [products] = useState([
    { id: 1, name: 'Steel Rods', hsn_code: '7213', rate: 50, unit: 'kg' },
    { id: 2, name: 'Cement Bags', hsn_code: '2523', rate: 350, unit: 'bag' },
    { id: 3, name: 'Electric Cables', hsn_code: '8544', rate: 120, unit: 'meter' },
    { id: 4, name: 'Paint Buckets', hsn_code: '3208', rate: 450, unit: 'bucket' },
  ])

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: order || {
      vendor_id: '',
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      reference: '',
      notes: '',
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
  const watchedItems = watchItems || []

  // Auto-generate PO number
  const generatePONumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `PO-${year}${month}-${random}`
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

  const handleProductSelect = (index, productId) => {
    const product = products.find(p => p.id === parseInt(productId))
    if (product) {
      setValue(`items.${index}.product_id`, productId)
      setValue(`items.${index}.description`, product.name)
      setValue(`items.${index}.unit_price`, product.rate)
      calculateItemTotal(index)
    }
  }

  const onSubmit = (data) => {
    const orderData = {
      ...data,
      po_number: isEditing ? order.po_number : generatePONumber(),
      status: 'draft',
      total_amount: calculateOrderTotal(),
      items_count: data.items.length,
      created_at: new Date().toISOString()
    }
    
    onSuccess(orderData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Purchase Order' : 'New Purchase Order'}
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
                PO Number
              </label>
              <input
                type="text"
                value={isEditing ? order.po_number : 'Auto Generated'}
                disabled
                className="input bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendor *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  {...register('vendor_id', { required: 'Vendor is required' })}
                  className={`input pl-10 ${errors.vendor_id ? 'border-error-500' : ''}`}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name} ({vendor.gst})
                    </option>
                  ))}
                </select>
              </div>
              {errors.vendor_id && (
                <p className="mt-1 text-sm text-error-600">{errors.vendor_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('order_date', { required: 'Order date is required' })}
                  type="date"
                  className={`input pl-10 ${errors.order_date ? 'border-error-500' : ''}`}
                />
              </div>
              {errors.order_date && (
                <p className="mt-1 text-sm text-error-600">{errors.order_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Delivery Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('delivery_date')}
                  type="date"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference
              </label>
              <input
                {...register('reference')}
                className="input"
                placeholder="Reference number or note"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
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

            {/* Order Total */}
            <div className="mt-6 bg-primary-50 p-4 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Order Total</span>
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
              placeholder="Additional notes for this purchase order..."
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? 'Update Order' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PurchaseOrderForm