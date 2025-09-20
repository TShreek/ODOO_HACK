import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import SimpleTable from '../components/SimpleTable'
import FormField from '../components/FormField'

export default function Contacts() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [form, setForm] = useState({ name:'', type:'customer', email:'', mobile:'' })
  const load = async () => {
    setLoading(true)
    try { setRows(await api.get('/api/contacts')) } catch(e){ setErr(e.message) } finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[])
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if(!form.name) { setErr('Name required'); return }
    try {
      await api.post('/api/contacts', form)
      setForm({ name:'', type:'customer', email:'', mobile:'' })
      load()
    } catch(e){ setErr(e.message) }
  }
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Contacts</h2>
      <form onSubmit={submit} className="grid grid-cols-5 gap-2 items-end">
        <FormField label="Name"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="border px-2 py-1 w-full"/></FormField>
        <FormField label="Type">
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className="border px-2 py-1 w-full">
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
          </select>
        </FormField>
        <FormField label="Email"><input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="border px-2 py-1 w-full"/></FormField>
        <FormField label="Mobile"><input value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value})} className="border px-2 py-1 w-full"/></FormField>
        <button className="bg-blue-600 text-white px-3 py-2 rounded" disabled={loading}>{loading? 'Saving...' : 'Create'}</button>
      </form>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <SimpleTable columns={[
        {key:'name',label:'Name'},
        {key:'type',label:'Type'},
        {key:'email',label:'Email'},
        {key:'mobile',label:'Mobile'}
      ]} data={rows} />
    </div>
  )
}
