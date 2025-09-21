import axios from 'axios'

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000'
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || process.env.REACT_APP_DEMO_MODE === 'true' || true

// Token storage wrapper
export const authStorage = {
  setRefreshToken: (token) => localStorage.setItem('refreshToken', token),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setAccessToken: (token) => localStorage.setItem('accessToken', token),
  getAccessToken: () => localStorage.getItem('accessToken'),
  setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
  getUser: () => {
    try {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user) : null
    } catch {
      return null
    }
  },
  clear: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }
}

// Demo data for development
const demoData = {
  user: { id: 1, login_id: 'demo', name: 'Demo User', email: 'demo@example.com' },
  contacts: [
    {
      id: 1,
      name: 'Tech Solutions Ltd',
      display_name: 'Tech Solutions Ltd',
      contact_type: 'customer',
      email: 'contact@techsolutions.com',
      phone: '+91 98765 43210',
      address: '123 Business Park, Mumbai, MH 400001',
      gst_number: '29ABCDE1234F1Z5',
      created_at: '2025-09-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Global Manufacturing',
      display_name: 'Global Manufacturing',
      contact_type: 'vendor',
      email: 'orders@globalmanuf.com',
      phone: '+91 87654 32109',
      address: '456 Industrial Area, Delhi, DL 110001',
      gst_number: '27FGHIJ5678K2L6',
      created_at: '2025-09-02T00:00:00Z'
    }
  ],
  products: [
    {
      id: 1,
      name: 'Premium Laptop',
      sku: 'LAP001',
      hsn_code: '8471',
      category_id: 1,
      sales_price: 75000,
      purchase_price: 65000,
      tax_id: 1,
      unit: 'piece',
      description: 'High-performance laptop with 16GB RAM and SSD'
    }
  ],
  taxes: [
    { id: 1, name: 'GST 18%', type: 'percent', value: 18, apply_on: 'both' },
    { id: 2, name: 'GST 12%', type: 'percent', value: 12, apply_on: 'sales' }
  ],
  accounts: [
    { id: 1, name: 'Cash Account', code: '1000', type: 'Assets', parent_id: null },
    { id: 2, name: 'Bank Account', code: '1001', type: 'Assets', parent_id: null }
  ],
  dashboard: {
    totalRevenue: 125000,
    totalExpenses: 78000,
    netProfit: 47000,
    pendingInvoices: 8,
    totalContacts: 45,
    totalProducts: 120,
    activeAccounts: 24,
    recentActivity: [
      {
        id: 1,
        type: 'payment',
        description: 'Payment received from ABC Corp',
        amount: 15000,
        time: '2 hours ago'
      }
    ]
  }
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - attach auth token
api.interceptors.request.use(
  (config) => {
    const token = authStorage.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = authStorage.getRefreshToken()
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken
        })

        const { accessToken, refreshToken: newRefreshToken } = response.data
        authStorage.setAccessToken(accessToken)
        authStorage.setRefreshToken(newRefreshToken)

        processQueue(null, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        authStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// Demo API simulator
const simulateApiCall = async (data, delay = 200) => {
  await new Promise((resolve) => setTimeout(resolve, delay + Math.random() * 300))
  return { data }
}

// API service methods
export const apiService = {
  // Authentication
  auth: {
    async login(credentials) {
      if (DEMO_MODE) {
        const response = await simulateApiCall({
          accessToken: 'demo-access-token-' + Date.now(),
          refreshToken: 'demo-refresh-token-' + Date.now(),
          user: demoData.user
        })
        return response.data
      }
      const response = await api.post('/api/auth/login', credentials)
      return response.data
    },

    async signup(userData) {
      if (DEMO_MODE) {
        const response = await simulateApiCall({
          accessToken: 'demo-access-token-' + Date.now(),
          refreshToken: 'demo-refresh-token-' + Date.now(),
          user: { ...userData, id: Date.now() }
        })
        return response.data
      }
      const response = await api.post('/api/auth/signup', userData)
      return response.data
    },

    async refresh(refreshToken) {
      if (DEMO_MODE) {
        const response = await simulateApiCall({
          accessToken: 'demo-access-token-' + Date.now(),
          refreshToken: 'demo-refresh-token-' + Date.now()
        })
        return response.data
      }
      const response = await api.post('/api/auth/refresh', { refreshToken })
      return response.data
    },

    async logout() {
      if (DEMO_MODE) {
        await simulateApiCall({ success: true })
        return
      }
      await api.post('/api/auth/logout')
    }
  },

  // Dashboard
  dashboard: {
    async getStats(range = '7d') {
      if (DEMO_MODE) {
        const response = await simulateApiCall(demoData.dashboard)
        return response.data
      }
      const response = await api.get(`/api/reports/dashboard?range=${range}`)
      return response.data
    }
  },

  // Contacts
  contacts: {
    async list(params = {}) {
      if (DEMO_MODE) {
        const filteredContacts = demoData.contacts.filter((contact) => {
          if (params.q) {
            return contact.name.toLowerCase().includes(params.q.toLowerCase())
          }
          return true
        })
        const response = await simulateApiCall({
          items: filteredContacts,
          total: filteredContacts.length,
          page: params.page || 1,
          per_page: params.size || 10
        })
        return response.data
      }
      const response = await api.get('/api/contacts', { params })
      return response.data
    },

    async get(id) {
      if (DEMO_MODE) {
        const contact = demoData.contacts.find((c) => c.id === parseInt(id))
        const response = await simulateApiCall(contact)
        return response.data
      }
      const response = await api.get(`/api/contacts/${id}`)
      return response.data
    },

    async create(contactData) {
      if (DEMO_MODE) {
        const newContact = {
          ...contactData,
          id: Date.now(),
          created_at: new Date().toISOString()
        }
        demoData.contacts.push(newContact)
        const response = await simulateApiCall(newContact)
        return response.data
      }
      const response = await api.post('/api/contacts', contactData)
      return response.data
    },

    async update(id, contactData) {
      if (DEMO_MODE) {
        const index = demoData.contacts.findIndex((c) => c.id === parseInt(id))
        if (index >= 0) {
          demoData.contacts[index] = { ...demoData.contacts[index], ...contactData }
          const response = await simulateApiCall(demoData.contacts[index])
          return response.data
        }
        throw new Error('Contact not found')
      }
      const response = await api.put(`/api/contacts/${id}`, contactData)
      return response.data
    },

    async delete(id) {
      if (DEMO_MODE) {
        const index = demoData.contacts.findIndex((c) => c.id === parseInt(id))
        if (index >= 0) {
          demoData.contacts.splice(index, 1)
          const response = await simulateApiCall({ success: true })
          return response.data
        }
        throw new Error('Contact not found')
      }
      const response = await api.delete(`/api/contacts/${id}`)
      return response.data
    }
  },

  // Products
  products: {
    async list(params = {}) {
      if (DEMO_MODE) {
        const response = await simulateApiCall({
          items: demoData.products,
          total: demoData.products.length,
          page: params.page || 1,
          per_page: params.size || 10
        })
        return response.data
      }
      const response = await api.get('/api/products', { params })
      return response.data
    },

    async create(productData) {
      if (DEMO_MODE) {
        const newProduct = { ...productData, id: Date.now() }
        demoData.products.push(newProduct)
        const response = await simulateApiCall(newProduct)
        return response.data
      }
      const response = await api.post('/api/products', productData)
      return response.data
    },

    async getHsn(code) {
      if (DEMO_MODE) {
        const hsnData = [
          { code: '8471', description: 'Computers and IT equipment' },
          { code: '9401', description: 'Furniture and office chairs' }
        ]
        const response = await simulateApiCall(hsnData.find((h) => h.code === code))
        return response.data
      }
      const response = await api.get(`/api/products/hsn/${code}`)
      return response.data
    }
  },

  // Taxes
  taxes: {
    async list() {
      if (DEMO_MODE) {
        const response = await simulateApiCall(demoData.taxes)
        return response.data
      }
      const response = await api.get('/api/taxes')
      return response.data
    },

    async create(taxData) {
      if (DEMO_MODE) {
        const newTax = { ...taxData, id: Date.now() }
        demoData.taxes.push(newTax)
        const response = await simulateApiCall(newTax)
        return response.data
      }
      const response = await api.post('/api/taxes', taxData)
      return response.data
    }
  },

  // Accounts
  accounts: {
    async list() {
      if (DEMO_MODE) {
        const response = await simulateApiCall(demoData.accounts)
        return response.data
      }
      const response = await api.get('/api/accounts')
      return response.data
    },

    async create(accountData) {
      if (DEMO_MODE) {
        const newAccount = { ...accountData, id: Date.now() }
        demoData.accounts.push(newAccount)
        const response = await simulateApiCall(newAccount)
        return response.data
      }
      const response = await api.post('/api/accounts', accountData)
      return response.data
    }
  },

  // Purchase Orders
  purchaseOrders: {
    async list(params = {}) {
      if (DEMO_MODE) {
        const response = await simulateApiCall({
          items: [],
          total: 0,
          page: 1,
          per_page: 10
        })
        return response.data
      }
      const response = await api.get('/api/purchase_orders', { params })
      return response.data
    },

    async create(orderData) {
      if (DEMO_MODE) {
        const response = await simulateApiCall({ ...orderData, id: Date.now() })
        return response.data
      }
      const response = await api.post('/api/purchase_orders', orderData)
      return response.data
    },

    async get(id) {
      if (DEMO_MODE) {
        const response = await simulateApiCall({ id, status: 'draft' })
        return response.data
      }
      const response = await api.get(`/api/purchase_orders/${id}`)
      return response.data
    },

    async createBill(id) {
      if (DEMO_MODE) {
        const response = await simulateApiCall({ bill_id: Date.now() })
        return response.data
      }
      const response = await api.post(`/api/purchase_orders/${id}/create_bill`)
      return response.data
    }
  },

  // Vendor Bills
  vendorBills: {
    async get(id) {
      if (DEMO_MODE) {
        const response = await simulateApiCall({ id, status: 'confirmed' })
        return response.data
      }
      const response = await api.get(`/api/vendor_bills/${id}`)
      return response.data
    },

    async confirm(id) {
      if (DEMO_MODE) {
        const response = await simulateApiCall({ success: true })
        return response.data
      }
      const response = await api.put(`/api/vendor_bills/${id}/confirm`)
      return response.data
    },

    async pay(id, paymentData) {
      if (DEMO_MODE) {
        const response = await simulateApiCall({ payment_id: Date.now() })
        return response.data
      }
      const response = await api.post(`/api/vendor_bills/${id}/pay`, paymentData)
      return response.data
    }
  },

  // Sales Orders
  salesOrders: {
    async list(params = {}) {
      if (DEMO_MODE) {
        const response = await simulateApiCall({
          items: [],
          total: 0,
          page: 1,
          per_page: 10
        })
        return response.data
      }
      const response = await api.get('/api/sales_orders', { params })
      return response.data
    },

    async create(orderData) {
      if (DEMO_MODE) {
        const response = await simulateApiCall({ ...orderData, id: Date.now() })
        return response.data
      }
      const response = await api.post('/api/sales_orders', orderData)
      return response.data
    },

    async createInvoice(id) {
      if (DEMO_MODE) {
        const response = await simulateApiCall({ invoice_id: Date.now() })
        return response.data
      }
      const response = await api.post(`/api/sales_orders/${id}/create_invoice`)
      return response.data
    }
  },

  // Reports
  reports: {
    async partnerLedger(params) {
      if (DEMO_MODE) {
        const response = await simulateApiCall({
          partner_name: 'Demo Partner',
          entries: [],
          balance: 0
        })
        return response.data
      }
      const response = await api.get('/api/reports/partner_ledger', { params })
      return response.data
    },

    async profitLoss(params) {
      if (DEMO_MODE) {
        const response = await simulateApiCall({
          revenue: 450000,
          expenses: 320000,
          gross_profit: 130000,
          net_profit: 110000,
          period: params.from + ' to ' + params.to
        })
        return response.data
      }
      const response = await api.get('/api/reports/pnl', { params })
      return response.data
    },

    async balanceSheet(params) {
      if (DEMO_MODE) {
        const response = await simulateApiCall({
          assets: {
            current_assets: 750000,
            fixed_assets: 1200000,
            total_assets: 1950000
          },
          liabilities: {
            current_liabilities: 350000,
            long_term_liabilities: 500000,
            total_liabilities: 850000
          },
          equity: {
            retained_earnings: 800000,
            current_profit: 300000,
            total_equity: 1100000
          }
        })
        return response.data
      }
      const response = await api.get('/api/reports/balance_sheet', { params })
      return response.data
    }
  }
}

// Utility functions
export const formatMoney = (value, currency = 'INR', locale = 'en-IN') => {
  if (value == null || value === '') return '₹0.00'
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return '₹0.00'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue)
}

export const formatDate = (date, options = {}) => {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    }).format(new Date(date))
  } catch {
    return date
  }
}

export default api