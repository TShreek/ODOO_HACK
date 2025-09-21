import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  Receipt,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { formatMoney, apiService } from '../services/apiClient'

const StatCard = ({ title, value, change, icon: Icon, trend = 'up' }) => {
  const isPositive = trend === 'up'
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              isPositive ? 'text-success-600' : 'text-error-600'
            }`}>
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 mr-1" />
              )}
              {change}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${
          isPositive ? 'bg-success-50' : 'bg-primary-50'
        }`}>
          <Icon className={`h-6 w-6 ${
            isPositive ? 'text-success-600' : 'text-primary-600'
          }`} />
        </div>
      </div>
    </div>
  )
}

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    contacts: 0,
    products: 0,
    pendingInvoices: 0
  })

  const [recentActivity] = useState([
    { id: 1, type: 'payment', description: 'Payment received from ABC Corp', amount: 15000, time: '2 hours ago' },
    { id: 2, type: 'invoice', description: 'Invoice INV-001 created', amount: 8500, time: '4 hours ago' },
    { id: 3, type: 'expense', description: 'Office supplies purchased', amount: -1200, time: '1 day ago' },
    { id: 4, type: 'payment', description: 'Vendor payment processed', amount: -5000, time: '2 days ago' },
  ])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await apiService.dashboard.getStats('7d')
        setStats({
          totalRevenue: data.totalRevenue,
          totalExpenses: data.totalExpenses,
          netProfit: data.netProfit,
          contacts: data.totalContacts,
          products: data.totalProducts,
          pendingInvoices: data.pendingInvoices
        })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        // Fallback to demo data
        setStats({
          totalRevenue: 125000,
          totalExpenses: 78000,
          netProfit: 47000,
          contacts: 45,
          products: 120,
          pendingInvoices: 8
        })
      }
    }

    fetchDashboardData()
  }, [])

  const getActivityIcon = (type) => {
    switch (type) {
      case 'payment': return CreditCard
      case 'invoice': return Receipt
      case 'expense': return TrendingDown
      default: return Receipt
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'payment': return 'text-success-600 bg-success-50'
      case 'invoice': return 'text-primary-600 bg-primary-50'
      case 'expense': return 'text-error-600 bg-error-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatMoney(stats.totalRevenue)}
          change="+12.5% from last month"
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          title="Total Expenses"
          value={formatMoney(stats.totalExpenses)}
          change="+3.2% from last month"
          icon={TrendingDown}
          trend="down"
        />
        <StatCard
          title="Net Profit"
          value={formatMoney(stats.netProfit)}
          change="+24.8% from last month"
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          title="Pending Invoices"
          value={stats.pendingInvoices}
          change="2 overdue"
          icon={Receipt}
          trend="down"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Contacts"
          value={stats.contacts}
          change="+5 this month"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Total Products"
          value={stats.products}
          change="+12 this month"
          icon={Package}
          trend="up"
        />
        <StatCard
          title="Active Accounts"
          value="24"
          change="All configured"
          icon={CreditCard}
          trend="up"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Card */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const Icon = getActivityIcon(activity.type)
              const colorClass = getActivityColor(activity.type)
              
              return (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  <div className="text-sm font-medium">
                    <span className={activity.amount > 0 ? 'text-success-600' : 'text-error-600'}>
                      {formatMoney(Math.abs(activity.amount))}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-secondary justify-start">
              <Receipt className="h-4 w-4 mr-2" />
              New Invoice
            </button>
            <button className="btn-secondary justify-start">
              <CreditCard className="h-4 w-4 mr-2" />
              Record Payment
            </button>
            <button className="btn-secondary justify-start">
              <Users className="h-4 w-4 mr-2" />
              Add Contact
            </button>
            <button className="btn-secondary justify-start">
              <Package className="h-4 w-4 mr-2" />
              Add Product
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage