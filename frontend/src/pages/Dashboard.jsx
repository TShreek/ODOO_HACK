import React, { useEffect, useState, useCallback } from 'react'
import { api, formatMoney } from '../lib/api'
import { connectRealtime, onRealtime } from '../lib/realtime'

export default function Dashboard() {
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api('/reports/summary')
      setMetrics(data)
    } catch (e) {
      console.error('dashboard summary error', e)
    } finally { setLoading(false) }
  },[])

  useEffect(()=>{ load() }, [load])
  useEffect(()=>{
    connectRealtime()
    const off = onRealtime(msg => {
      if (msg.type === 'journal_update') {
        load()
      }
    })
    return off
  }, [load])
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Cash" value={metrics?.cash} loading={loading} />
        <MetricCard label="A/R" value={metrics?.accounts_receivable} loading={loading} />
        <MetricCard label="A/P" value={metrics?.accounts_payable} loading={loading} />
        <MetricCard label="Income YTD" value={metrics?.income_ytd} loading={loading} />
        <MetricCard label="Expense YTD" value={metrics?.expense_ytd} loading={loading} />
        <MetricCard label="Net Income YTD" value={metrics?.net_income_ytd} loading={loading} />
      </div>
    </div>
  )
}

function MetricCard({label, value, loading}) {
  return (
    <div className="p-4 border rounded bg-white shadow-sm">
      <div className="text-xs uppercase text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-semibold">{loading && value == null ? '…' : (value != null ? formatMoney(value) : '—')}</div>
    </div>
  )
}
