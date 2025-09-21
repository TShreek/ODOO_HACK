import React, { useState } from 'react'
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
  Wallet,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  
  {
    name: 'Purchase',
    icon: ShoppingCart,
    children: [
  { name: 'Purchase Orders', href: '/purchases/orders', icon: FileText },
  { name: 'Vendor Bills', href: '/purchases/bills', icon: Receipt },
  { name: 'Vendor Payments', href: '/purchases/payments', icon: CreditCard },
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
  const [expandedSections, setExpandedSections] = useState({
    'Purchase': false,
    'Sales': false,
    'Reports': false,
    'Master Data': false,
  })

  const isActiveRoute = (href) => {
    if (href === '/') {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }))
  }

  // Auto-expand sections that contain active routes
  React.useEffect(() => {
    const activeSection = navigation.find(item => 
      item.children && item.children.some(child => isActiveRoute(child.href))
    )
    if (activeSection) {
      setExpandedSections(prev => ({
        ...prev,
        [activeSection.name]: true
      }))
    }
  }, [location.pathname])

  const NavItem = ({ item, isChild = false }) => {
    const Icon = item.icon
    const isExpanded = expandedSections[item.name]

    if (item.children) {
      return (
        <div className="space-y-1">
          <button
            onClick={() => toggleSection(item.name)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200"
          >
            <div className="flex items-center">
              <Icon className="mr-3 h-4 w-4" />
              {item.name}
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>
          
          {isExpanded && (
            <div className="ml-6 space-y-1 animate-slide-up">
              {item.children.map((child) => (
                <NavItem key={child.name} item={child} isChild />
              ))}
            </div>
          )}
        </div>
      )
    }

    return (
      <NavLink
        to={item.href}
        className={({ isActive }) => {
          const active = isActive || isActiveRoute(item.href)
          return `sidebar-item ${active ? 'sidebar-item-active' : 'sidebar-item-inactive'} ${
            isChild ? 'ml-2 pl-6' : ''
          }`
        }}
      >
        <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
        <span className="truncate">{item.name}</span>
      </NavLink>
    )
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-sm">
          <span className="text-sm font-bold text-white">SA</span>
        </div>
        <div className="leading-tight">
          <h1 className="text-base font-semibold text-gray-900">Shiv Accounts</h1>
          <p className="text-[11px] tracking-wide text-gray-500">ERP System</p>
        </div>
      </div>

      {/* Scrollable Nav Area */}
      <div className="flex-1 overflow-hidden">
        <nav className="h-full overflow-y-auto px-3 py-5 space-y-4 custom-scrollbar">
          {navigation.map((item, idx) => (
            <div key={item.name} className="first:pt-0">
              <NavItem item={item} />
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-200 bg-gray-25">
        <div className="text-center leading-tight">
          <p className="text-[11px] text-gray-500 font-medium">© 2025 Shiv Accounts</p>
          <p className="text-[11px] text-gray-400">v1.0.0</p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar