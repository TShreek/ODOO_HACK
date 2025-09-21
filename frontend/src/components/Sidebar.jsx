import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  Home, 
  Users, 
  Package, 
  Receipt, 
  CreditCard,
  BarChart3,
  Settings,
  Building2,
  FileText,
  ShoppingCart,
  TrendingUp,
  Archive,
  Wallet
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  
  {
    name: 'Purchase',
    icon: ShoppingCart,
    children: [
      { name: 'Purchase Orders', href: '/purchase/orders', icon: FileText },
      { name: 'Vendor Bills', href: '/purchase/bills', icon: Receipt },
      { name: 'Vendor Payments', href: '/purchase/payments', icon: CreditCard },
    ]
  },
  
  {
    name: 'Sales',
    icon: TrendingUp,
    children: [
      { name: 'Sales Orders', href: '/sales/orders', icon: FileText },
      { name: 'Customer Invoices', href: '/sales/invoices', icon: Receipt },
      { name: 'Customer Receipts', href: '/sales/receipts', icon: Wallet },
    ]
  },
  
  {
    name: 'Reports',
    icon: BarChart3,
    children: [
      { name: 'Profit & Loss', href: '/reports/profit-loss', icon: BarChart3 },
      { name: 'Balance Sheet', href: '/reports/balance-sheet', icon: BarChart3 },
      { name: 'Stock Statement', href: '/reports/stock-statement', icon: Archive },
    ]
  },
  
  { 
    name: 'Master Data', 
    icon: Building2,
    children: [
      { name: 'Contact Master', href: '/masters/contacts', icon: Users },
      { name: 'Product Master', href: '/masters/products', icon: Package },
      { name: 'Taxes Master', href: '/masters/taxes', icon: Receipt },
      { name: 'Chart of Accounts', href: '/masters/accounts', icon: CreditCard },
    ]
  },
  
  { name: 'Settings', href: '/settings', icon: Settings },
]

const Sidebar = () => {
  const location = useLocation()

  const isActiveRoute = (href) => {
    if (href === '/') {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  const NavItem = ({ item, isChild = false }) => {
    const Icon = item.icon

    if (item.children) {
      return (
        <div className="space-y-1">
          <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-600">
            <Icon className="mr-3 h-4 w-4" />
            {item.name}
          </div>
          <div className="ml-6 space-y-1">
            {item.children.map((child) => (
              <NavItem key={child.name} item={child} isChild />
            ))}
          </div>
        </div>
      )
    }

    return (
      <NavLink
        to={item.href}
        className={({ isActive }) =>
          isActive || isActiveRoute(item.href)
            ? 'sidebar-item-active'
            : 'sidebar-item-inactive'
        }
      >
        <Icon className="mr-3 h-4 w-4" />
        {item.name}
      </NavLink>
    )
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg">
            <span className="text-sm font-bold text-white">SA</span>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">Shiv Accounts</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">© 2025 Shiv Accounts</p>
      </div>
    </div>
  )
}

export default Sidebar