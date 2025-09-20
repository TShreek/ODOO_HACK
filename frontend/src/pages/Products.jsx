import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import SimpleTable from '../components/SimpleTable'
import FormField from '../components/FormField'

export default function Products() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({ name:'', sales_price:'0.00', purchase_price:'0.00', hsn_code:'' })
  const load = async () => { setLoading(true); try { setRows(await api.get('/api/products')) } catch(e){ setErr(e.message) } finally { setLoading(false) } }
  useEffect(()=>{ load() },[])
  const submit = async e => {
    e.preventDefault(); setErr('')
    if(!form.name) { setErr('Name required'); return }
    try { await api.post('/api/products', form); setForm({ name:'', sales_price:'0.00', purchase_price:'0.00', hsn_code:'' }); load() } catch(e){ setErr(e.message) }
  }
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Products</h2>
      <form onSubmit={submit} className="grid grid-cols-5 gap-2 items-end">
        <FormField label="Name"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="border px-2 py-1 w-full"/></FormField>
        <FormField label="Sales Price"><input type="number" step="0.01" value={form.sales_price} onChange={e=>setForm({...form,sales_price:e.target.value})} className="border px-2 py-1 w-full"/></FormField>
        <FormField label="Purchase Price"><input type="number" step="0.01" value={form.purchase_price} onChange={e=>setForm({...form,purchase_price:e.target.value})} className="border px-2 py-1 w-full"/></FormField>
        <FormField label="HSN Code"><input value={form.hsn_code} onChange={e=>setForm({...form,hsn_code:e.target.value})} className="border px-2 py-1 w-full"/></FormField>
        <button className="bg-blue-600 text-white px-3 py-2 rounded" disabled={loading}>{loading? 'Saving...' : 'Create'}</button>
      </form>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <SimpleTable columns={[
        {key:'name',label:'Name'},
        {key:'sales_price',label:'Sales Price'},
        {key:'purchase_price',label:'Purchase Price'},
        {key:'hsn_code',label:'HSN'}
      ]} data={rows} />
    </div>
  )
}
