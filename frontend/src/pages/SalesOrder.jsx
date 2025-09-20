import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'
import LineItemsEditor from '../components/LineItemsEditor'

export default function SalesOrder(){
  const [customers,setCustomers]=useState([])
  const [products,setProducts]=useState([])
  const [items,setItems]=useState([{product_id:'',qty:'1',unit_price:'0.00',tax_percent:'0'}])
  const [customer,setCustomer]=useState('')
  const [orderDate,setOrderDate]=useState(new Date().toISOString())
  const [loading,setLoading]=useState(false)
  const [resp,setResp]=useState(null)
  const [err,setErr]=useState('')

  useEffect(()=>{(async()=>{
    try { setCustomers((await api.get('/api/contacts')).filter(c=>c.type==='customer')) } catch(e){}
    try { setProducts(await api.get('/api/products')) } catch(e){}
  })() },[])

  const submit = async e => {
    e.preventDefault(); setErr(''); setResp(null)
    if(!customer) { setErr('Customer required'); return }
    const clean = items.filter(i=> i.product_id && Number(i.qty)>0 && Number(i.unit_price)>=0)
    if(clean.length===0){ setErr('Valid line items required'); return }
    const payload = { customer_id: customer, items: clean.map(i=> ({...i})), order_date: orderDate }
    setLoading(true)
    try { const r = await api.post('/transactions/sales_order', payload); setResp(r) } catch(e){ setErr(e.message) } finally { setLoading(false) }
  }

  return (
    <div className='space-y-6'>
      <h2 className='text-xl font-semibold'>Sales Order</h2>
      <form onSubmit={submit} className='space-y-4'>
        <div className='grid grid-cols-3 gap-4'>
          <label className='text-sm'>Customer<select value={customer} onChange={e=>setCustomer(e.target.value)} className='border px-2 py-1 w-full'><option value=''>Select</option>{customers.map(v=> <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
          <label className='text-sm'>Order Date<input type='datetime-local' value={orderDate.slice(0,16)} onChange={e=>setOrderDate(e.target.value)} className='border px-2 py-1 w-full'/></label>
        </div>
        <LineItemsEditor items={items} onChange={setItems} products={products} />
        {err && <div className='text-red-600 text-sm'>{err}</div>}
        <button disabled={loading} className='bg-blue-600 text-white px-4 py-2 rounded'>{loading? 'Submitting...' : 'Submit SO'}</button>
      </form>
      {resp && <div className='border rounded p-4 bg-gray-50 text-sm'><pre className='overflow-auto whitespace-pre-wrap'>{JSON.stringify(resp,null,2)}</pre></div>}
    </div>
  )
}
