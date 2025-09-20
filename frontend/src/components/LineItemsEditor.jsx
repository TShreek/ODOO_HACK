import React from 'react'

export default function LineItemsEditor({ items, onChange, products }) {
  const update = (idx, field, value) => {
    const next = items.map((it,i)=> i===idx? { ...it, [field]: value }: it)
    onChange(next)
  }
  const add = () => onChange([...items, { product_id:'', qty:'1', unit_price:'0.00', tax_percent:'0' }])
  const remove = (idx) => onChange(items.filter((_,i)=>i!==idx))
  return (
    <div className="space-y-2">
      {items.map((it,i)=>(
        <div key={i} className="grid grid-cols-6 gap-2 items-end">
          <select className="border px-2 py-1" value={it.product_id} onChange={e=>update(i,'product_id',e.target.value)}>
            <option value="">Product</option>
            {products.map(p=> <option key={p.id||p.product_id} value={p.id||p.product_id}>{p.name}</option>)}
          </select>
          <input className="border px-2 py-1" type="number" min="0" value={it.qty} onChange={e=>update(i,'qty',e.target.value)} />
          <input className="border px-2 py-1" type="number" step="0.01" value={it.unit_price} onChange={e=>update(i,'unit_price',e.target.value)} />
          <input className="border px-2 py-1" type="number" step="0.01" value={it.tax_percent} onChange={e=>update(i,'tax_percent',e.target.value)} />
          <input className="border px-2 py-1" placeholder="discount" type="number" step="0.01" value={it.discount||''} onChange={e=>update(i,'discount',e.target.value)} />
          <button type="button" className="text-red-600 text-xs" onClick={()=>remove(i)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={add} className="text-sm px-2 py-1 bg-gray-200 rounded">Add Line</button>
    </div>
  )
}
