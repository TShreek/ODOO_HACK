import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Products from './pages/Products'
import ChartOfAccounts from './pages/ChartOfAccounts'
import PurchaseOrder from './pages/PurchaseOrder'
import SalesOrder from './pages/SalesOrder'
import PnL from './pages/PnL'
import BalanceSheet from './pages/BalanceSheet'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/products" element={<Products />} />
        <Route path="/coa" element={<ChartOfAccounts />} />
        <Route path="/transactions/purchase" element={<PurchaseOrder />} />
        <Route path="/transactions/sales" element={<SalesOrder />} />
        <Route path="/reports/pnl" element={<PnL />} />
        <Route path="/reports/balance-sheet" element={<BalanceSheet />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
