import React, { useState, useEffect } from 'react'
import { api, formatMoney } from '../../lib/api'

export default function BalanceSheet(){
  const today = new Date().toISOString().slice(0,10)
  const [asOf, setAsOf] = useState(today)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const load = async()=>{
    setLoading(true)
    try {
      const res = await api(`/reports/balance-sheet?as_of=${asOf}`)
      setData(res)
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() }, [])
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Balance Sheet</h2>
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1">As Of</label>
          <input type="date" value={asOf} onChange={e=>setAsOf(e.target.value)} className="border px-2 py-1 rounded" />
        </div>
        <button onClick={load} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" disabled={loading}>{loading? 'Loading...' : 'Run'}</button>
      </div>
      {data && (
        <div className="grid grid-cols-4 gap-4">
          <Metric label="Assets" value={data.assets} />
          <Metric label="Liabilities" value={data.liabilities} />
          <Metric label="Equity" value={data.equity} />
          <Metric label="Equation OK" value={data.equation_ok? 'Yes' : 'No'} raw />
        </div>
      )}
    </div>
  )
}

function Metric({label, value, raw=false}) {
  return (
    <div className="p-4 border rounded bg-white">
      <div className="text-xs uppercase text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-semibold">{raw? value: (value!=null? formatMoney(value): '—')}</div>
    </div>
  )
}
