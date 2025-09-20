import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import SimpleTable from '../components/SimpleTable'
import FormField from '../components/FormField'

export default function ChartOfAccounts() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({ code:'', name:'', type:'Asset' })
  const load = async () => { setLoading(true); try { setRows(await api.get('/api/coa')) } catch(e){ setErr(e.message) } finally { setLoading(false) } }
  useEffect(()=>{ load() },[])
  const submit = async e => {
    e.preventDefault(); setErr('')
    if(!form.code || !form.name) { setErr('Code and Name required'); return }
    try { await api.post('/api/coa', form); setForm({ code:'', name:'', type:'Asset' }); load() } catch(e){ setErr(e.message) }
  }
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Chart of Accounts</h2>
      <form onSubmit={submit} className="grid grid-cols-5 gap-2 items-end">
        <FormField label="Code"><input value={form.code} onChange={e=>setForm({...form,code:e.target.value})} className="border px-2 py-1 w-full"/></FormField>
        <FormField label="Name"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="border px-2 py-1 w-full"/></FormField>
        <FormField label="Type">
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="border px-2 py-1 w-full">
            {['Asset','Liability','Equity','Income','Expense'].map(t=> <option key={t}>{t}</option>)}
          </select>
        </FormField>
        <div></div>
        <button className="bg-blue-600 text-white px-3 py-2 rounded" disabled={loading}>{loading? 'Saving...' : 'Create'}</button>
      </form>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <SimpleTable columns={[
        {key:'account_code',label:'Code'},
        {key:'account_name',label:'Name'},
        {key:'account_type',label:'Type'}
      ]} data={rows} />
    </div>
  )
}
