import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import LoadingSpinner from './components/LoadingSpinner'

const Watchlist = lazy(() => import('./pages/Watchlist'))
const StockDetail = lazy(() => import('./pages/StockDetail'))
const OptionsCalculator = lazy(() => import('./pages/OptionsCalculator'))

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner label="Loading page..." />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/watchlist" replace />} />
            <Route path="watchlist" element={<Watchlist />} />
            <Route path="stock/:ticker" element={<StockDetail />} />
            <Route path="options" element={<OptionsCalculator />} />
            <Route path="*" element={<Navigate to="/watchlist" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
