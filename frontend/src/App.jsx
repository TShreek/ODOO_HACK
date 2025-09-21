import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'

// Stores
import useAuthStore from './stores/authStore'

// Components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ContactsPage from './pages/masters/ContactsPage'
import ProductMaster from './pages/masters/ProductMaster'
import ProfitLossPage from './pages/reports/ProfitLossPage'
import BalanceSheetPage from './pages/reports/BalanceSheetPage'
import CustomerPaymentsPage from './pages/transactions/CustomerPaymentsPage'

// Purchase Pages
import PurchaseOrdersPage from './pages/purchases/PurchaseOrdersPage'

// Sales Pages
import SalesOrdersPage from './pages/sales/SalesOrdersPage'
import CustomerInvoicesPage from './pages/sales/CustomerInvoicesPage'
import CustomerReceiptsPage from './pages/sales/CustomerReceiptsPage'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const { initialize, isAuthenticated } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
            } 
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            
            {/* Master Data Routes */}
            <Route path="masters/contacts" element={<ContactsPage />} />
            <Route path="masters/products" element={<ProductMaster />} />
            <Route path="masters/products/create" element={<ProductMaster />} />
            <Route path="masters/products/:id" element={<ProductMaster />} />
            <Route path="masters/products/:id/edit" element={<ProductMaster />} />
            
            {/* Placeholder routes for future implementation */}
            <Route path="masters/taxes" element={<div className="p-8 text-center text-gray-500">Taxes page coming soon...</div>} />
            <Route path="masters/accounts" element={<div className="p-8 text-center text-gray-500">Chart of Accounts page coming soon...</div>} />
            
            {/* Purchase Routes */}
            <Route path="purchases/orders" element={<PurchaseOrdersPage />} />
            <Route path="purchases/bills" element={<div className="p-8 text-center text-gray-500">Vendor Bills page coming soon...</div>} />
            <Route path="purchases/payments" element={<div className="p-8 text-center text-gray-500">Vendor Payments page coming soon...</div>} />
            
            {/* Sales Routes */}
            <Route path="sales/orders" element={<SalesOrdersPage />} />
            <Route path="sales/invoices" element={<CustomerInvoicesPage />} />
            <Route path="sales/receipts" element={<CustomerReceiptsPage />} />
            
            {/* Transaction Routes */}
            <Route path="transactions/customer-payments" element={<CustomerPaymentsPage />} />
            <Route path="transactions/vendor-bills" element={<div className="p-8 text-center text-gray-500">Vendor Bills page coming soon...</div>} />
            <Route path="transactions/vendor-payments" element={<div className="p-8 text-center text-gray-500">Vendor Payments page coming soon...</div>} />
            
            {/* Reports Routes */}
            <Route path="reports/profit-loss" element={<ProfitLossPage />} />
            <Route path="reports/balance-sheet" element={<BalanceSheetPage />} />
            
            {/* Settings */}
            <Route path="settings" element={<div className="p-8 text-center text-gray-500">Settings page coming soon...</div>} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App