import React, { useState } from 'react'
import { api, formatMoney } from '../lib/api'

export default function BalanceSheet(){
  const [asOf,setAsOf]=useState(new Date().toISOString().slice(0,10))
  const [data,setData]=useState(null)
  const [loading,setLoading]=useState(false)
  const [err,setErr]=useState('')

  const load = async ()=>{
    setErr(''); setLoading(true); setData(null)
    try { setData(await api.get(`/reports/balance_sheet?as_of=${asOf}`)) } catch(e){ setErr(e.message) } finally { setLoading(false) }
  }

  const renderSection = (title, lines=[]) => (
    <div className='p-3 border rounded'>
      <div className='font-medium mb-2'>{title}</div>
      <table className='w-full text-sm'>
        <tbody>
          {lines.map((l,i)=>(<tr key={i}><td className='py-1 pr-2'>{l.account_name||l.account_code}</td><td className='text-right'>{formatMoney(l.amount)}</td></tr>))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className='space-y-6'>
      <h2 className='text-xl font-semibold'>Balance Sheet</h2>
      <div className='flex gap-4 items-end'>
        <label className='text-sm'>As Of<input type='date' value={asOf} onChange={e=>setAsOf(e.target.value)} className='border px-2 py-1 ml-2'/></label>
        <button onClick={load} disabled={loading} className='bg-blue-600 text-white px-4 py-2 rounded'>{loading? 'Loading...' : 'Load'}</button>
      </div>
      {err && <div className='text-red-600 text-sm'>{err}</div>}
      {data && <div className='space-y-4'>
        {renderSection('Assets', data.assets)}
        {renderSection('Liabilities', data.liabilities)}
        {renderSection('Equity', data.equity)}
        <div className='p-3 border rounded bg-gray-50 text-sm'>
          <div>Assets Total: {formatMoney(data.assets_total)}</div>
          <div>Liabilities+Equity: {formatMoney(data.liabilities_equity_total)}</div>
        </div>
      </div>}
    </div>
  )
}
