import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Package, Plus, Search, Filter, Edit2, Trash2, Eye, ArrowLeft } from 'lucide-react'
import apiService from '../../services/apiClient'

const ProductMaster = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const [products, setProducts] = useState([])
  const [taxes, setTaxes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState(id ? 'view' : 'list') // 'list', 'view', 'edit', 'create'
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    hsn_code: '',
    category_id: '',
    unit: '',
    sales_price: '',
    purchase_price: '',
    tax_id: ''
  })

  // Helper function to format money
  const formatMoney = (amount) => {
    if (amount == null) return '₹0.00'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  // Load specific product if ID provided
  useEffect(() => {
    if (id && products.length > 0) {
      const product = products.find(p => p.id === parseInt(id))
      if (product) {
        setSelectedProduct(product)
        setFormData(product)
        setMode('view')
      } else {
        setError('Product not found')
      }
    }
  }, [id, products])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productsData, taxesData] = await Promise.all([
        apiService.products.getAll(),
        apiService.taxes.getAll()
      ])
      setProducts(productsData || [])
      setTaxes(taxesData || [])
      setError(null)
    } catch (err) {
      setError('Failed to load data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedProduct(null)
    setFormData({
      name: '',
      sku: '',
      description: '',
      hsn_code: '',
      category_id: '',
      unit: '',
      sales_price: '',
      purchase_price: '',
      tax_id: ''
    })
    setMode('create')
    navigate('/masters/products/create')
  }

  const handleView = (product) => {
    setSelectedProduct(product)
    setFormData(product)
    setMode('view')
    navigate(`/masters/products/${product.id}`)
  }

  const handleEdit = (product) => {
    setSelectedProduct(product)
    setFormData(product)
    setMode('edit')
    navigate(`/masters/products/${product.id}/edit`)
  }

  const handleDelete = async (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      try {
        await apiService.products.delete(product.id)
        setProducts(products.filter(p => p.id !== product.id))
        
        // Navigate back to list if currently viewing this product
        if (selectedProduct?.id === product.id) {
          navigate('/masters/products')
          setMode('list')
          setSelectedProduct(null)
        }
      } catch (err) {
        setError('Failed to delete product: ' + err.message)
      }
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      setFormLoading(true)
      let savedProduct

      if (mode === 'create') {
        savedProduct = await apiService.products.create(formData)
        setProducts([...products, savedProduct])
      } else if (mode === 'edit') {
        savedProduct = await apiService.products.update(selectedProduct.id, formData)
        setProducts(products.map(p => p.id === selectedProduct.id ? savedProduct : p))
      }

      setSelectedProduct(savedProduct)
      setMode('view')
      navigate(`/masters/products/${savedProduct.id}`)
      setError(null)
    } catch (err) {
      setError('Failed to save product: ' + err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleCancel = () => {
    if (mode === 'create') {
      navigate('/masters/products')
      setMode('list')
      setSelectedProduct(null)
    } else {
      setMode('view')
      navigate(`/masters/products/${selectedProduct.id}`)
    }
  }

  const handleBackToList = () => {
    navigate('/masters/products')
    setMode('list')
    setSelectedProduct(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Filter products based on search and status
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.hsn_code?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Handle loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="spinner h-8 w-8 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    )
  }

  // Render list view
  if (mode === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-6 w-6 text-primary-600" />
              Products
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your product catalog with pricing and tax information
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </button>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 rounded-xl p-4">
            <p className="text-error-800">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input md:w-48"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-cell font-semibold text-gray-900">SKU</th>
                  <th className="table-cell font-semibold text-gray-900">Product Name</th>
                  <th className="table-cell font-semibold text-gray-900">HSN Code</th>
                  <th className="table-cell font-semibold text-gray-900">Sales Price</th>
                  <th className="table-cell font-semibold text-gray-900">Purchase Price</th>
                  <th className="table-cell font-semibold text-gray-900">Unit</th>
                  <th className="table-cell font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <Package className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No products found</p>
                        <p className="text-gray-400 mb-4">Get started by adding your first product to the catalog.</p>
                        <button
                          onClick={handleCreate}
                          className="btn-primary"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Product
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const tax = taxes.find(t => t.id === product.tax_id)
                    return (
                      <tr key={product.id} className="table-row">
                        <td className="table-cell font-medium">{product.sku}</td>
                        <td className="table-cell">
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            {product.description && (
                              <p className="text-sm text-gray-500 truncate max-w-xs">{product.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="table-cell text-gray-600">{product.hsn_code || 'N/A'}</td>
                        <td className="table-cell font-medium text-success-600">
                          {formatMoney(product.sales_price)}
                        </td>
                        <td className="table-cell font-medium text-gray-900">
                          {formatMoney(product.purchase_price)}
                        </td>
                        <td className="table-cell">
                          <span className="badge badge-info">{product.unit}</span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleView(product)}
                              className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              className="p-1 rounded-lg hover:bg-error-50 text-error-600 hover:text-error-700"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Render form view (create/edit/view)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToList}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-6 w-6 text-primary-600" />
              {mode === 'create' ? 'Add Product' : 
               mode === 'edit' ? 'Edit Product' : 'Product Details'}
            </h1>
            {selectedProduct && (
              <p className="text-gray-600 mt-1">{selectedProduct.name}</p>
            )}
          </div>
        </div>
        
        {mode === 'view' && (
          <button
            onClick={() => handleEdit(selectedProduct)}
            className="btn-primary"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="bg-error-50 border border-error-200 rounded-xl p-4">
          <p className="text-error-800">{error}</p>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter product name"
                  required
                  disabled={mode === 'view'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">SKU *</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter unique SKU"
                  required
                  disabled={mode === 'view'}
                />
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter product description"
                  rows={3}
                  disabled={mode === 'view'}
                />
              </div>
            </div>
          </div>

          {/* Classification */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Classification</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-group">
                <label className="form-label">HSN/SAC Code</label>
                <input
                  type="text"
                  name="hsn_code"
                  value={formData.hsn_code}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter HSN/SAC code"
                  disabled={mode === 'view'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="input"
                  disabled={mode === 'view'}
                >
                  <option value="">Select category</option>
                  <option value="1">Electronics</option>
                  <option value="2">Furniture</option>
                  <option value="3">Stationery</option>
                  <option value="4">Services</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unit of Measure *</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="input"
                  required
                  disabled={mode === 'view'}
                >
                  <option value="">Select unit</option>
                  <option value="piece">Piece</option>
                  <option value="kg">Kilogram</option>
                  <option value="liter">Liter</option>
                  <option value="meter">Meter</option>
                  <option value="hour">Hour</option>
                  <option value="day">Day</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing & Tax */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Tax</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="form-group">
                <label className="form-label">Sales Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="sales_price"
                    value={formData.sales_price}
                    onChange={handleInputChange}
                    className="input pl-8"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={mode === 'view'}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Purchase Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="purchase_price"
                    value={formData.purchase_price}
                    onChange={handleInputChange}
                    className="input pl-8"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={mode === 'view'}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tax</label>
                <select
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleInputChange}
                  className="input"
                  disabled={mode === 'view'}
                >
                  <option value="">Select tax</option>
                  {taxes.map(tax => (
                    <option key={tax.id} value={tax.id}>{tax.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          {mode !== 'view' && (
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
                disabled={formLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <div className="spinner h-4 w-4 mr-2"></div>
                    Saving...
                  </>
                ) : (
                  mode === 'create' ? 'Create Product' : 'Update Product'
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default ProductMaster