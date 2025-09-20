import React, { useState, useEffect } from 'react'
import { api, formatMoney } from '../../lib/api'

export default function ProfitAndLoss(){
  const today = new Date().toISOString().slice(0,10)
  const startOfMonth = today.slice(0,8)+'01'
  const [start, setStart] = useState(startOfMonth)
  const [end, setEnd] = useState(today)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const load = async()=>{
    if(!start || !end) return
    setLoading(true)
    try {
      const res = await api(`/reports/pnl?start=${start}&end=${end}`)
      setData(res)
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() }, [])
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Profit &amp; Loss</h2>
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1">Start</label>
          <input type="date" value={start} onChange={e=>setStart(e.target.value)} className="border px-2 py-1 rounded" />
        </div>
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1">End</label>
          <input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="border px-2 py-1 rounded" />
        </div>
        <button onClick={load} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" disabled={loading}>{loading? 'Loading...' : 'Run'}</button>
      </div>
      {data && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border rounded bg-white">
            <div className="text-xs uppercase text-gray-500 mb-1">Income</div>
            <div className="text-lg font-semibold">{formatMoney(data.income)}</div>
          </div>
          <div className="p-4 border rounded bg-white">
            <div className="text-xs uppercase text-gray-500 mb-1">Expense</div>
            <div className="text-lg font-semibold">{formatMoney(data.expense)}</div>
          </div>
          <div className="p-4 border rounded bg-white">
            <div className="text-xs uppercase text-gray-500 mb-1">Net Profit</div>
            <div className="text-lg font-semibold">{formatMoney(data.net_profit)}</div>
          </div>
        </div>
      )}
    </div>
  )
}
