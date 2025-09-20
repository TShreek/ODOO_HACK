import React from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ children }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Topbar />
        <main className="p-4 overflow-y-auto bg-white flex-1">{children}</main>
      </div>
    </div>
  )
}
