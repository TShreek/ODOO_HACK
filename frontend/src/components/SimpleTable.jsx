import React from 'react'

export default function SimpleTable({ columns, data }) {
  return (
    <table className="w-full border text-sm">
      <thead className="bg-gray-100">
        <tr>{columns.map(c => <th key={c.key} className="border px-2 py-1 text-left">{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {data.length === 0 && <tr><td colSpan={columns.length} className="p-3 text-center text-gray-500">No rows</td></tr>}
        {data.map((row,i)=>(
          <tr key={i} className="odd:bg-white even:bg-gray-50">
            {columns.map(col => <td key={col.key} className="border px-2 py-1 break-all">{col.render? col.render(row[col.key], row): row[col.key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
