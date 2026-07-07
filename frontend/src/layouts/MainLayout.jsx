import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#0b1120] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="overflow-hidden rounded-3xl border border-[#1e293b] bg-[#111827] shadow-2xl shadow-black/30">
          <Navbar />
          <main className="px-8 pb-8 pt-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
