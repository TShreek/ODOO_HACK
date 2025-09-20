import React from 'react'

export default function FormField({ label, children, error }) {
  return (
    <label className="block mb-3 text-sm">
      <span className="block mb-1 font-medium">{label}</span>
      {children}
      {error && <span className="text-red-600 text-xs">{error}</span>}
    </label>
  )
}
