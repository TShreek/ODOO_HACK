import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-25">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="flex h-screen">
        {/* Sidebar - Desktop */}
        <div className="hidden md:flex md:flex-shrink-0">
          <Sidebar />
        </div>
        
        {/* Sidebar - Mobile */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex h-full">
            <Sidebar />
            <button
              className="flex items-center justify-center w-8 bg-gray-800 text-white hover:bg-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <Header 
            onMenuClick={() => setSidebarOpen(true)}
            showMenuButton={true}
          />
          
          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout