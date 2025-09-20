import React from 'react'
import { NavLink } from 'react-router-dom'

const link = 'block px-3 py-2 rounded hover:bg-gray-200 text-sm'
const active = 'bg-gray-300 font-semibold'

export default function Sidebar() {
  return (
    <aside className="w-52 border-r bg-gray-50 h-full p-3 space-y-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">Navigation</div>
      <nav className="space-y-1">
        <NavLink to="/" className={({isActive})=> isActive? `${link} ${active}`:link}>Dashboard</NavLink>
        <div className="text-xs mt-4 mb-1 font-medium text-gray-500">Master Data</div>
        <NavLink to="/contacts" className={({isActive})=> isActive? `${link} ${active}`:link}>Contacts</NavLink>
        <NavLink to="/products" className={({isActive})=> isActive? `${link} ${active}`:link}>Products</NavLink>
        <NavLink to="/coa" className={({isActive})=> isActive? `${link} ${active}`:link}>Chart of Accounts</NavLink>
        <div className="text-xs mt-4 mb-1 font-medium text-gray-500">Transactions</div>
        <NavLink to="/transactions/purchase" className={({isActive})=> isActive? `${link} ${active}`:link}>Purchase Order</NavLink>
        <NavLink to="/transactions/sales" className={({isActive})=> isActive? `${link} ${active}`:link}>Sales Order</NavLink>
        <div className="text-xs mt-4 mb-1 font-medium text-gray-500">Reports</div>
        <NavLink to="/reports/pnl" className={({isActive})=> isActive? `${link} ${active}`:link}>P&L</NavLink>
        <NavLink to="/reports/balance-sheet" className={({isActive})=> isActive? `${link} ${active}`:link}>Balance Sheet</NavLink>
      </nav>
    </aside>
  )
}
