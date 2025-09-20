import React, { useState } from 'react'
import { api, formatMoney } from '../lib/api'

export default function PnL(){
  const [start,setStart]=useState('2025-01-01')
  const [end,setEnd]=useState(new Date().toISOString().slice(0,10))
  const [data,setData]=useState(null)
  const [loading,setLoading]=useState(false)
  const [err,setErr]=useState('')

  const load = async ()=>{
    setErr(''); setLoading(true); setData(null)
    try { setData(await api.get(`/reports/pnl?start=${start}&end=${end}`)) } catch(e){ setErr(e.message) } finally { setLoading(false) }
  }

  return (
    <div className='space-y-6'>
      <h2 className='text-xl font-semibold'>Profit & Loss</h2>
      <div className='flex gap-4 items-end'>
        <label className='text-sm'>Start<input type='date' value={start} onChange={e=>setStart(e.target.value)} className='border px-2 py-1 ml-2'/></label>
        <label className='text-sm'>End<input type='date' value={end} onChange={e=>setEnd(e.target.value)} className='border px-2 py-1 ml-2'/></label>
        <button onClick={load} disabled={loading} className='bg-blue-600 text-white px-4 py-2 rounded'>{loading? 'Loading...' : 'Load'}</button>
      </div>
      {err && <div className='text-red-600 text-sm'>{err}</div>}
      {data && <div className='space-y-4'>
        <div className='p-3 border rounded'>
          <div className='font-medium mb-2'>Totals</div>
          <div className='grid grid-cols-3 gap-2 text-sm'>
            <div>Income: {formatMoney(data.total_income)}</div>
            <div>Expenses: {formatMoney(data.total_expense)}</div>
            <div>Net: {formatMoney(data.net_profit)}</div>
          </div>
        </div>
        {data.breakdown && Object.entries(data.breakdown).map(([section, lines])=> (
          <div key={section} className='p-3 border rounded'>
            <div className='font-medium mb-2 capitalize'>{section}</div>
            <table className='w-full text-sm'>
              <tbody>
                {lines.map((l,i)=>(<tr key={i}><td className='py-1 pr-2'>{l.account_name||l.account_code}</td><td className='text-right'>{formatMoney(l.amount)}</td></tr>))}
              </tbody>
            </table>
          </div>
        ))}
      </div>}
    </div>
  )
}
