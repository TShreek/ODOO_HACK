import React, { useState, useMemo } from 'react'
import { Menu, Bell, User, LogOut, ChevronDown } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import useAuthStore from '../stores/authStore'

const routeTitleMap = [
  { match: /^\/$/, title: 'Dashboard' },
  { match: /^\/dashboard/, title: 'Dashboard' },
  { match: /^\/products/, title: 'Products' },
  { match: /^\/contacts/, title: 'Contacts' },
  { match: /^\/sales/, title: 'Sales' },
  { match: /^\/purchases?/, title: 'Purchase' },
  { match: /^\/transactions/, title: 'Transactions' },
  { match: /^\/reports\/profit-loss/, title: 'Profit & Loss' },
  { match: /^\/reports\/balance-sheet/, title: 'Balance Sheet' },
  { match: /^\/reports\/stock-statement/, title: 'Stock Statement' },
  { match: /^\/reports/, title: 'Reports' },
  { match: /^\/masters|^\/master-data/, title: 'Master Data' }
]

const Header = ({ onMenuClick, showMenuButton = false }) => {
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const location = useLocation()

  const pageTitle = useMemo(() => {
    const path = location.pathname
    const found = routeTitleMap.find(r => r.match.test(path))
    return found ? found.title : 'ERP'
  }, [location.pathname])

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center">
          {showMenuButton && (
            <button 
              onClick={onMenuClick}
              className="p-2 rounded-xl hover:bg-gray-100 md:hidden"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          )}
          
          {/* Breadcrumb or page title could go here on larger screens */}
          <div className="hidden md:block ml-4">
            <h2 className="text-lg font-semibold text-gray-900" data-testid="page-title">
              {pageTitle}
            </h2>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Notifications */}
          <button className="p-2 rounded-xl hover:bg-gray-100 relative transition-colors">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-error-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 md:space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full">
                <User className="h-4 w-4 text-primary-600" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || user?.login_id || 'User'}
                </p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
            </button>

            {/* User dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || user?.login_id || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email || 'admin@example.com'}</p>
                </div>
                
                <div className="py-1">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                    <User className="h-4 w-4 mr-3" />
                    Profile Settings
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-error-700 hover:bg-error-50 flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  )
}

export default Header