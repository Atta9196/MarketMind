import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#0b1120] px-3 py-4 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="overflow-hidden rounded-2xl border border-[#1e293b] bg-[#111827] shadow-2xl shadow-black/30 sm:rounded-3xl">
          <Navbar />
          <main className="px-4 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
